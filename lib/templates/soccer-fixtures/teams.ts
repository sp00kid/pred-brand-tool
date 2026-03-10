export interface Team {
  id: string;
  name: string;
  badge: string; // filename in /badges/
}

export interface League {
  id: string;
  name: string;
  teams: Team[];
}

export const leagues: League[] = [
  {
    id: 'premier-league',
    name: 'Premier League',
    teams: [
      { id: 'arsenal', name: 'Arsenal', badge: 'arsenal.png' },
      { id: 'astonvilla', name: 'Aston Villa', badge: 'astonvilla.png' },
      { id: 'bournemouth', name: 'Bournemouth', badge: 'bournemouth.png' },
      { id: 'brentford', name: 'Brentford', badge: 'brentford.png' },
      { id: 'brighton', name: 'Brighton', badge: 'brighton.png' },
      { id: 'chelsea', name: 'Chelsea', badge: 'chelsea.png' },
      { id: 'crystalpalace', name: 'Crystal Palace', badge: 'crystalpalace.png' },
      { id: 'everton', name: 'Everton', badge: 'everton.png' },
      { id: 'fulham', name: 'Fulham', badge: 'fulham.png' },
      { id: 'ipswich', name: 'Ipswich Town', badge: 'ipswich.png' },
      { id: 'leicester', name: 'Leicester City', badge: 'leicester.png' },
      { id: 'liverpool', name: 'Liverpool', badge: 'liverpool.png' },
      { id: 'mancity', name: 'Man City', badge: 'mancity.png' },
      { id: 'manutd', name: 'Man United', badge: 'manutd.png' },
      { id: 'newcastle', name: 'Newcastle', badge: 'newcastle.png' },
      { id: 'nottmforest', name: "Nott'm Forest", badge: 'nottmforest.png' },
      { id: 'southampton', name: 'Southampton', badge: 'southampton.png' },
      { id: 'tottenham', name: 'Tottenham', badge: 'tottenham.png' },
      { id: 'westham', name: 'West Ham', badge: 'westham.png' },
      { id: 'wolves', name: 'Wolves', badge: 'wolves.png' },
    ],
  },
  {
    id: 'la-liga',
    name: 'La Liga',
    teams: [
      { id: 'alaves', name: 'Alavés', badge: 'alaves.png' },
      { id: 'athleticbilbao', name: 'Athletic Bilbao', badge: 'athleticbilbao.png' },
      { id: 'atletico', name: 'Atlético Madrid', badge: 'atletico.png' },
      { id: 'barcelona', name: 'Barcelona', badge: 'barcelona.png' },
      { id: 'betis', name: 'Real Betis', badge: 'betis.png' },
      { id: 'celtavigo', name: 'Celta Vigo', badge: 'celtavigo.png' },
      { id: 'espanyol', name: 'Espanyol', badge: 'espanyol.png' },
      { id: 'getafe', name: 'Getafe', badge: 'getafe.png' },
      { id: 'girona', name: 'Girona', badge: 'girona.png' },
      { id: 'laspalmas', name: 'Las Palmas', badge: 'laspalmas.png' },
      { id: 'leganes', name: 'Leganés', badge: 'leganes.png' },
      { id: 'mallorca', name: 'Mallorca', badge: 'mallorca.png' },
      { id: 'osasuna', name: 'Osasuna', badge: 'osasuna.png' },
      { id: 'rayovallecano', name: 'Rayo Vallecano', badge: 'rayovallecano.png' },
      { id: 'realmadrid', name: 'Real Madrid', badge: 'realmadrid.png' },
      { id: 'realsociedad', name: 'Real Sociedad', badge: 'realsociedad.png' },
      { id: 'sevilla', name: 'Sevilla', badge: 'sevilla.png' },
      { id: 'valencia', name: 'Valencia', badge: 'valencia.png' },
      { id: 'valladolid', name: 'Valladolid', badge: 'valladolid.png' },
      { id: 'villarreal', name: 'Villarreal', badge: 'villarreal.png' },
    ],
  },
  {
    id: 'bundesliga',
    name: 'Bundesliga',
    teams: [
      { id: 'bayernmunich', name: 'Bayern Munich', badge: 'bayernmunich.png' },
      { id: 'dortmund', name: 'Borussia Dortmund', badge: 'dortmund.png' },
      { id: 'leverkusen', name: 'Bayer Leverkusen', badge: 'leverkusen.png' },
      { id: 'rbleipzig', name: 'RB Leipzig', badge: 'rbleipzig.png' },
      { id: 'stuttgart', name: 'Stuttgart', badge: 'stuttgart.png' },
    ],
  },
  {
    id: 'serie-a',
    name: 'Serie A',
    teams: [
      { id: 'acmilan', name: 'AC Milan', badge: 'acmilan.png' },
      { id: 'atalanta', name: 'Atalanta', badge: 'atalanta.png' },
      { id: 'bologna', name: 'Bologna', badge: 'bologna.png' },
      { id: 'fiorentina', name: 'Fiorentina', badge: 'fiorentina.png' },
      { id: 'intermilan', name: 'Inter Milan', badge: 'intermilan.png' },
      { id: 'juventus', name: 'Juventus', badge: 'juventus.png' },
      { id: 'lazio', name: 'Lazio', badge: 'lazio.png' },
      { id: 'napoli', name: 'Napoli', badge: 'napoli.png' },
      { id: 'roma', name: 'Roma', badge: 'roma.png' },
    ],
  },
  {
    id: 'ligue-1',
    name: 'Ligue 1',
    teams: [
      { id: 'brest', name: 'Brest', badge: 'brest.png' },
      { id: 'lille', name: 'Lille', badge: 'lille.png' },
      { id: 'lyon', name: 'Lyon', badge: 'lyon.png' },
      { id: 'marseille', name: 'Marseille', badge: 'marseille.png' },
      { id: 'monaco', name: 'Monaco', badge: 'monaco.png' },
      { id: 'psg', name: 'PSG', badge: 'psg.png' },
    ],
  },
  {
    id: 'eredivisie',
    name: 'Eredivisie',
    teams: [
      { id: 'ajax', name: 'Ajax', badge: 'ajax.png' },
      { id: 'feyenoord', name: 'Feyenoord', badge: 'feyenoord.png' },
      { id: 'psv', name: 'PSV', badge: 'psv.png' },
    ],
  },
  {
    id: 'liga-portugal',
    name: 'Liga Portugal',
    teams: [
      { id: 'benfica', name: 'Benfica', badge: 'benfica.png' },
      { id: 'porto', name: 'FC Porto', badge: 'porto.png' },
      { id: 'sportingcp', name: 'Sporting CP', badge: 'sportingcp.png' },
    ],
  },
  {
    id: 'scottish-premiership',
    name: 'Scottish Premiership',
    teams: [
      { id: 'celtic', name: 'Celtic', badge: 'celtic.png' },
      { id: 'rangers', name: 'Rangers', badge: 'rangers.png' },
    ],
  },
  {
    id: 'other-european',
    name: 'Other European',
    teams: [
      { id: 'clubbrugge', name: 'Club Brugge', badge: 'clubbrugge.png' },
      { id: 'dinamozagreb', name: 'Dinamo Zagreb', badge: 'dinamozagreb.png' },
      { id: 'redstarbelgrade', name: 'Red Star Belgrade', badge: 'redstarbelgrade.png' },
      { id: 'salzburg', name: 'Red Bull Salzburg', badge: 'salzburg.png' },
      { id: 'shakhtardonetsk', name: 'Shakhtar Donetsk', badge: 'shakhtardonetsk.png' },
      { id: 'slovanbratislava', name: 'Slovan Bratislava', badge: 'slovanbratislava.png' },
      { id: 'spartaprague', name: 'Sparta Prague', badge: 'spartaprague.png' },
      { id: 'sturmgraz', name: 'Sturm Graz', badge: 'sturmgraz.png' },
      { id: 'youngboys', name: 'Young Boys', badge: 'youngboys.png' },
    ],
  },
];

export function getTeamById(id: string): Team | undefined {
  for (const league of leagues) {
    const team = league.teams.find(t => t.id === id);
    if (team) return team;
  }
  return undefined;
}
