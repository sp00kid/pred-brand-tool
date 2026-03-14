export interface Team {
  id: string;
  name: string;
  badge: string; // filename in /badges/
  primaryColor: string; // pill background hex
  borderColor: string;  // darker extrude hex
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
      { id: 'arsenal', name: 'Arsenal', badge: 'arsenal.png', primaryColor: '#EF0107', borderColor: '#7A0004' },
      { id: 'astonvilla', name: 'Aston Villa', badge: 'astonvilla.png', primaryColor: '#95BFE5', borderColor: '#3A6A96' },
      { id: 'bournemouth', name: 'Bournemouth', badge: 'bournemouth.png', primaryColor: '#DA291C', borderColor: '#6E100B' },
      { id: 'brentford', name: 'Brentford', badge: 'brentford.png', primaryColor: '#E30613', borderColor: '#730007' },
      { id: 'brighton', name: 'Brighton', badge: 'brighton.png', primaryColor: '#0057B8', borderColor: '#002760' },
      { id: 'chelsea', name: 'Chelsea', badge: 'chelsea.png', primaryColor: '#034694', borderColor: '#011B45' },
      { id: 'crystalpalace', name: 'Crystal Palace', badge: 'crystalpalace.png', primaryColor: '#1B458F', borderColor: '#0A1E42' },
      { id: 'everton', name: 'Everton', badge: 'everton.png', primaryColor: '#003399', borderColor: '#001450' },
      { id: 'fulham', name: 'Fulham', badge: 'fulham.png', primaryColor: '#CC0000', borderColor: '#660000' },
      { id: 'ipswich', name: 'Ipswich Town', badge: 'ipswich.png', primaryColor: '#0044A9', borderColor: '#001D4D' },
      { id: 'leicester', name: 'Leicester City', badge: 'leicester.png', primaryColor: '#003090', borderColor: '#001244' },
      { id: 'liverpool', name: 'Liverpool', badge: 'liverpool.png', primaryColor: '#C8102E', borderColor: '#6B0A1A' },
      { id: 'mancity', name: 'Man City', badge: 'mancity.png', primaryColor: '#6CABDD', borderColor: '#2A6494' },
      { id: 'manutd', name: 'Man United', badge: 'manutd.png', primaryColor: '#DA291C', borderColor: '#6E100B' },
      { id: 'newcastle', name: 'Newcastle', badge: 'newcastle.png', primaryColor: '#241F20', borderColor: '#000000' },
      { id: 'nottmforest', name: "Nott'm Forest", badge: 'nottmforest.png', primaryColor: '#FF4D4D', borderColor: '#6E0000' },
      { id: 'southampton', name: 'Southampton', badge: 'southampton.png', primaryColor: '#D71920', borderColor: '#6C0009' },
      { id: 'tottenham', name: 'Tottenham', badge: 'tottenham_white.png', primaryColor: '#132257', borderColor: '#060D26' },
      { id: 'westham', name: 'West Ham', badge: 'westham.png', primaryColor: '#7A263A', borderColor: '#3A0F1A' },
      { id: 'wolves', name: 'Wolves', badge: 'wolves.png', primaryColor: '#FDB913', borderColor: '#A07200' },
    ],
  },
  {
    id: 'la-liga',
    name: 'La Liga',
    teams: [
      { id: 'alaves', name: 'Alavés', badge: 'alaves.png', primaryColor: '#1F4E9D', borderColor: '#0C2150' },
      { id: 'athleticbilbao', name: 'Athletic Bilbao', badge: 'athleticbilbao.png', primaryColor: '#EE2523', borderColor: '#7A0B0A' },
      { id: 'atletico', name: 'Atlético Madrid', badge: 'atletico.png', primaryColor: '#CE1126', borderColor: '#690813' },
      { id: 'barcelona', name: 'Barcelona', badge: 'barcelona.png', primaryColor: '#A50044', borderColor: '#4D0020' },
      { id: 'betis', name: 'Real Betis', badge: 'betis.png', primaryColor: '#00954B', borderColor: '#004A25' },
      { id: 'celtavigo', name: 'Celta Vigo', badge: 'celtavigo.png', primaryColor: '#8ECAE6', borderColor: '#3A7EA0' },
      { id: 'espanyol', name: 'Espanyol', badge: 'espanyol.png', primaryColor: '#005B99', borderColor: '#002840' },
      { id: 'getafe', name: 'Getafe', badge: 'getafe.png', primaryColor: '#004F9F', borderColor: '#00224A' },
      { id: 'girona', name: 'Girona', badge: 'girona.png', primaryColor: '#CC1034', borderColor: '#660818' },
      { id: 'laspalmas', name: 'Las Palmas', badge: 'laspalmas.png', primaryColor: '#F5D800', borderColor: '#8A7A00' },
      { id: 'leganes', name: 'Leganés', badge: 'leganes.png', primaryColor: '#1B3A7A', borderColor: '#0A193A' },
      { id: 'mallorca', name: 'Mallorca', badge: 'mallorca.png', primaryColor: '#D4001A', borderColor: '#6A000C' },
      { id: 'osasuna', name: 'Osasuna', badge: 'osasuna.png', primaryColor: '#C8102E', borderColor: '#64071A' },
      { id: 'rayovallecano', name: 'Rayo Vallecano', badge: 'rayovallecano.png', primaryColor: '#E8001C', borderColor: '#74000D' },
      { id: 'realmadrid', name: 'Real Madrid', badge: 'realmadrid.png', primaryColor: '#FEBE10', borderColor: '#8A6A08' },
      { id: 'realsociedad', name: 'Real Sociedad', badge: 'realsociedad.png', primaryColor: '#0066B3', borderColor: '#002E55' },
      { id: 'sevilla', name: 'Sevilla', badge: 'sevilla.png', primaryColor: '#D4021D', borderColor: '#6A000E' },
      { id: 'valencia', name: 'Valencia', badge: 'valencia.png', primaryColor: '#F7A600', borderColor: '#A06B00' },
      { id: 'valladolid', name: 'Valladolid', badge: 'valladolid.png', primaryColor: '#6C1D45', borderColor: '#360D22' },
      { id: 'villarreal', name: 'Villarreal', badge: 'villarreal.png', primaryColor: '#F7D117', borderColor: '#9A8200' },
    ],
  },
  {
    id: 'bundesliga',
    name: 'Bundesliga',
    teams: [
      { id: 'bayernmunich', name: 'Bayern Munich', badge: 'bayernmunich.png', primaryColor: '#DC052D', borderColor: '#6E0016' },
      { id: 'dortmund', name: 'Borussia Dortmund', badge: 'dortmund.png', primaryColor: '#FDE100', borderColor: '#9A8900' },
      { id: 'leverkusen', name: 'Bayer Leverkusen', badge: 'leverkusen.png', primaryColor: '#E32221', borderColor: '#730F0F' },
      { id: 'rbleipzig', name: 'RB Leipzig', badge: 'rbleipzig.png', primaryColor: '#DD0741', borderColor: '#6F0320' },
      { id: 'stuttgart', name: 'Stuttgart', badge: 'stuttgart.png', primaryColor: '#E32219', borderColor: '#730F09' },
    ],
  },
  {
    id: 'serie-a',
    name: 'Serie A',
    teams: [
      { id: 'acmilan', name: 'AC Milan', badge: 'acmilan.png', primaryColor: '#FB090B', borderColor: '#7D0405' },
      { id: 'atalanta', name: 'Atalanta', badge: 'atalanta.png', primaryColor: '#1E73BE', borderColor: '#0C3562' },
      { id: 'bologna', name: 'Bologna', badge: 'bologna.png', primaryColor: '#9E1B34', borderColor: '#4F0D1A' },
      { id: 'fiorentina', name: 'Fiorentina', badge: 'fiorentina.png', primaryColor: '#4B2D8A', borderColor: '#221446' },
      { id: 'intermilan', name: 'Inter Milan', badge: 'intermilan.png', primaryColor: '#010E80', borderColor: '#000640' },
      { id: 'juventus', name: 'Juventus', badge: 'juventus_white.png', primaryColor: '#333333', borderColor: '#111111' },
      { id: 'lazio', name: 'Lazio', badge: 'lazio.png', primaryColor: '#87D8F7', borderColor: '#3090B8' },
      { id: 'napoli', name: 'Napoli', badge: 'napoli.png', primaryColor: '#12A0C3', borderColor: '#075A6E' },
      { id: 'roma', name: 'Roma', badge: 'roma.png', primaryColor: '#A6192E', borderColor: '#530D17' },
    ],
  },
  {
    id: 'ligue-1',
    name: 'Ligue 1',
    teams: [
      { id: 'brest', name: 'Brest', badge: 'brest.png', primaryColor: '#CC0000', borderColor: '#660000' },
      { id: 'lille', name: 'Lille', badge: 'lille.png', primaryColor: '#EE1C25', borderColor: '#780D12' },
      { id: 'lyon', name: 'Lyon', badge: 'lyon.png', primaryColor: '#00529B', borderColor: '#00254A' },
      { id: 'marseille', name: 'Marseille', badge: 'marseille.png', primaryColor: '#2FAEE0', borderColor: '#1266A0' },
      { id: 'monaco', name: 'Monaco', badge: 'monaco.png', primaryColor: '#CE1126', borderColor: '#690813' },
      { id: 'psg', name: 'PSG', badge: 'psg.png', primaryColor: '#004170', borderColor: '#001B30' },
    ],
  },
  {
    id: 'eredivisie',
    name: 'Eredivisie',
    teams: [
      { id: 'ajax', name: 'Ajax', badge: 'ajax.png', primaryColor: '#CC0000', borderColor: '#660000' },
      { id: 'feyenoord', name: 'Feyenoord', badge: 'feyenoord.png', primaryColor: '#CC0000', borderColor: '#660000' },
      { id: 'psv', name: 'PSV', badge: 'psv.png', primaryColor: '#EE1C25', borderColor: '#780D12' },
    ],
  },
  {
    id: 'liga-portugal',
    name: 'Liga Portugal',
    teams: [
      { id: 'benfica', name: 'Benfica', badge: 'benfica.png', primaryColor: '#CC0000', borderColor: '#660000' },
      { id: 'porto', name: 'FC Porto', badge: 'porto.png', primaryColor: '#003DA5', borderColor: '#001852' },
      { id: 'sportingcp', name: 'Sporting CP', badge: 'sportingcp.png', primaryColor: '#007848', borderColor: '#003C24' },
    ],
  },
  {
    id: 'scottish-premiership',
    name: 'Scottish Premiership',
    teams: [
      { id: 'celtic', name: 'Celtic', badge: 'celtic.png', primaryColor: '#16A34A', borderColor: '#0A5225' },
      { id: 'rangers', name: 'Rangers', badge: 'rangers.png', primaryColor: '#1B458F', borderColor: '#0A1E42' },
    ],
  },
  {
    id: 'super-lig',
    name: 'Süper Lig',
    teams: [
      { id: 'besiktas', name: 'Beşiktaş', badge: 'besiktas.png', primaryColor: '#333333', borderColor: '#111111' },
      { id: 'fenerbahce', name: 'Fenerbahçe', badge: 'fenerbahce.png', primaryColor: '#FFED00', borderColor: '#9A8E00' },
      { id: 'galatasaray', name: 'Galatasaray', badge: 'galatasaray.png', primaryColor: '#DA9B14', borderColor: '#A06E0A' },
    ],
  },
  {
    id: 'championship',
    name: 'Championship',
    teams: [
      { id: 'burnley', name: 'Burnley', badge: 'burnley.png', primaryColor: '#6C1D45', borderColor: '#3A0F24' },
      { id: 'sunderland', name: 'Sunderland', badge: 'sunderland.png', primaryColor: '#EB172B', borderColor: '#7A0B15' },
    ],
  },
  {
    id: 'eliteserien',
    name: 'Eliteserien',
    teams: [
      { id: 'bodoglimt', name: 'Bodø/Glimt', badge: 'bodoglimt.png', primaryColor: '#FFD700', borderColor: '#9A8200' },
    ],
  },
  {
    id: 'other-european',
    name: 'Other European',
    teams: [
      { id: 'clubbrugge', name: 'Club Brugge', badge: 'clubbrugge.png', primaryColor: '#003DA5', borderColor: '#001852' },
      { id: 'dinamozagreb', name: 'Dinamo Zagreb', badge: 'dinamozagreb.png', primaryColor: '#005BAA', borderColor: '#002855' },
      { id: 'redstarbelgrade', name: 'Red Star Belgrade', badge: 'redstarbelgrade.png', primaryColor: '#CC0000', borderColor: '#660000' },
      { id: 'salzburg', name: 'Red Bull Salzburg', badge: 'salzburg.png', primaryColor: '#CC0000', borderColor: '#660000' },
      { id: 'shakhtardonetsk', name: 'Shakhtar Donetsk', badge: 'shakhtardonetsk.png', primaryColor: '#F08200', borderColor: '#8A4900' },
      { id: 'slovanbratislava', name: 'Slovan Bratislava', badge: 'slovanbratislava.png', primaryColor: '#003DA5', borderColor: '#001852' },
      { id: 'spartaprague', name: 'Sparta Prague', badge: 'spartaprague.png', primaryColor: '#AC1A2F', borderColor: '#560D17' },
      { id: 'sturmgraz', name: 'Sturm Graz', badge: 'sturmgraz.png', primaryColor: '#1A1A1A', borderColor: '#000000' },
      { id: 'youngboys', name: 'Young Boys', badge: 'youngboys.png', primaryColor: '#FFD200', borderColor: '#9A7D00' },
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
