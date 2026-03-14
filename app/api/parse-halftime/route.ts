import { NextRequest, NextResponse } from 'next/server';

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

const SYSTEM_PROMPT = `You parse natural language match score input into structured JSON for a halftime score graphic.

Available team IDs (use these exact IDs):
${TEAM_LIST}

Rules:
- Fuzzy-match team names to the closest team ID. Common nicknames: "Barca" = barcelona, "Madrid"/"Real" = realmadrid, "Bayern" = bayernmunich, "Spurs" = tottenham, "City"/"Manc" = mancity, "United"/"Manu"/"Utd" = manutd, "Pool"/"Liv" = liverpool, "Che" = chelsea, "Ars" = arsenal, "Inter" = intermilan, "Milan" = acmilan, "Juve" = juventus, "Atleti" = atletico, "Dortmund"/"BVB" = dortmund, "PSG" = psg.
- First team mentioned is home, second is away.
- Numbers near team names or in "X-Y" format are scores. "barca 2 madrid 0" or "barca 2-0 madrid" → homeScore="2", awayScore="0".
- Percentages (numbers with % sign) are win probability odds. First % = home, second % = away. "52% 30%" → homeOdds="52", awayOdds="30". Return just the number without %.
- Status: "ht"/"halftime"/"half" = "HALFTIME", "ft"/"fulltime"/"full" = "FULLTIME", "live" = "LIVE". If not mentioned, return "".
- League: "ucl"/"champions league"/"cl" = "ucl", "pl"/"premier"/"epl"/"prem" = "premier-league", "la liga"/"laliga"/"liga" = "la-liga". If not mentioned, return "".
- Return empty string "" for any field not explicitly present in the input. Do NOT guess or invent values.

Respond with JSON matching the schema provided.`;

const RESPONSE_SCHEMA = {
  name: 'parsed_halftime',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      homeTeam: { type: 'string', description: 'Team ID for home team' },
      awayTeam: { type: 'string', description: 'Team ID for away team' },
      homeScore: { type: 'string', description: 'Home team score, or empty string if not mentioned' },
      awayScore: { type: 'string', description: 'Away team score, or empty string if not mentioned' },
      homeOdds: { type: 'string', description: 'Home team win odds percentage number, or empty string if not mentioned' },
      awayOdds: { type: 'string', description: 'Away team win odds percentage number, or empty string if not mentioned' },
      status: {
        type: 'string',
        enum: ['HALFTIME', 'FULLTIME', 'LIVE', ''],
        description: 'Match status, or empty string if not mentioned',
      },
      league: {
        type: 'string',
        enum: ['ucl', 'premier-league', 'la-liga', ''],
        description: 'League ID, or empty string if not mentioned',
      },
    },
    required: ['homeTeam', 'awayTeam', 'homeScore', 'awayScore', 'homeOdds', 'awayOdds', 'status', 'league'],
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
    console.error('Parse halftime error:', err);
    return NextResponse.json(
      { error: 'Failed to parse match data' },
      { status: 500 }
    );
  }
}
