import { NextRequest, NextResponse } from 'next/server';
import { MAX_MATCHES } from '@/lib/templates/soccer-fixtures/index';

const TEAM_LIST = `
Premier League: arsenal (Arsenal), astonvilla (Aston Villa), bournemouth (Bournemouth), brentford (Brentford), brighton (Brighton), chelsea (Chelsea), crystalpalace (Crystal Palace), everton (Everton), fulham (Fulham), ipswich (Ipswich Town), leicester (Leicester City), liverpool (Liverpool), mancity (Man City), manutd (Man United), newcastle (Newcastle), nottmforest (Nott'm Forest), southampton (Southampton), tottenham (Tottenham), westham (West Ham), wolves (Wolves)
La Liga: alaves (Alavés), athleticbilbao (Athletic Bilbao), atletico (Atlético Madrid), barcelona (Barcelona), betis (Real Betis), celtavigo (Celta Vigo), espanyol (Espanyol), getafe (Getafe), girona (Girona), laspalmas (Las Palmas), leganes (Leganés), mallorca (Mallorca), osasuna (Osasuna), rayovallecano (Rayo Vallecano), realmadrid (Real Madrid), realsociedad (Real Sociedad), sevilla (Sevilla), valencia (Valencia), valladolid (Valladolid), villarreal (Villarreal)
Bundesliga: bayernmunich (Bayern Munich), dortmund (Borussia Dortmund), leverkusen (Bayer Leverkusen), rbleipzig (RB Leipzig), stuttgart (Stuttgart)
Serie A: acmilan (AC Milan), atalanta (Atalanta), bologna (Bologna), fiorentina (Fiorentina), intermilan (Inter Milan), juventus (Juventus), lazio (Lazio), napoli (Napoli), roma (Roma)
Ligue 1: brest (Brest), lille (Lille), lyon (Lyon), marseille (Marseille), monaco (Monaco), psg (PSG)
Eredivisie: ajax (Ajax), feyenoord (Feyenoord), psv (PSV)
Liga Portugal: benfica (Benfica), porto (FC Porto), sportingcp (Sporting CP)
Scottish Premiership: celtic (Celtic), rangers (Rangers)
Süper Lig: besiktas (Beşiktaş), fenerbahce (Fenerbahçe), galatasaray (Galatasaray)
Championship: burnley (Burnley), sunderland (Sunderland)
Eliteserien: bodoglimt (Bodø/Glimt)
Other European: clubbrugge (Club Brugge), dinamozagreb (Dinamo Zagreb), redstarbelgrade (Red Star Belgrade), salzburg (Red Bull Salzburg), shakhtardonetsk (Shakhtar Donetsk), slovanbratislava (Slovan Bratislava), spartaprague (Sparta Prague), sturmgraz (Sturm Graz), youngboys (Young Boys)
`.trim();

const SYSTEM_PROMPT = `You parse natural language soccer/football match input into structured data.

Available team IDs (use these exact IDs):
${TEAM_LIST}

Rules:
- Fuzzy-match team names to the closest team ID. "Barca" = barcelona, "Bayern" = bayernmunich, "Spurs" = tottenham, "City" = mancity, "United" = manutd, etc.
- Extract kick-off times. Normalize to format like "3:00 PM", "8:00 PM", "10:30 PM". If user says "8pm" that's "8:00 PM".
- If the user mentions a title (e.g. "UCL", "Champions League", "Premier League matchday"), extract it as title.
- If the user mentions a date (e.g. "Wednesday March 12", "tomorrow"), extract it as date.
- If the user mentions a timezone (e.g. "CET", "GMT", "ET"), extract it as timezone.
- Maximum ${MAX_MATCHES} matches. If more are given, take the first ${MAX_MATCHES}.
- Only include fields you can confidently extract. Omit title/date/timezone if not mentioned.
- If a team name doesn't match any known team, use empty string for that team ID.

Respond with JSON matching the schema provided.`;

const RESPONSE_SCHEMA = {
  name: 'parsed_matches',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Event title if mentioned' },
      date: { type: 'string', description: 'Date if mentioned' },
      timezone: {
        type: 'string',
        enum: ['ET', 'CT', 'PT', 'GMT', 'BST', 'CET'],
        description: 'Timezone if mentioned',
      },
      matches: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            homeTeam: { type: 'string', description: 'Team ID for home team' },
            awayTeam: { type: 'string', description: 'Team ID for away team' },
            time: { type: 'string', description: 'Kick-off time e.g. "8:00 PM"' },
          },
          required: ['homeTeam', 'awayTeam', 'time'],
          additionalProperties: false,
        },
        maxItems: MAX_MATCHES,
      },
    },
    required: ['matches'],
    additionalProperties: false,
  },
};

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENROUTER_API_KEY not configured' },
      { status: 500 }
    );
  }

  let body: { message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: message },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: RESPONSE_SCHEMA,
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('OpenRouter error:', response.status, text);
      return NextResponse.json(
        { error: 'AI service error' },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(content);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Parse matches error:', err);
    return NextResponse.json(
      { error: 'Failed to parse matches' },
      { status: 500 }
    );
  }
}
