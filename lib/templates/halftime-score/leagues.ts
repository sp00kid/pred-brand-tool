export interface LeagueDef {
  id: string;
  name: string;
  logo: string; // path relative to /badges/
}

export const leagueOptions: LeagueDef[] = [
  { id: 'ucl', name: 'Champions League', logo: 'ucl.png' },
  { id: 'premier-league', name: 'Premier League', logo: 'premierleague.svg' },
  { id: 'la-liga', name: 'La Liga', logo: 'laliga-white.png' },
];

export function getLeagueById(id: string): LeagueDef | undefined {
  return leagueOptions.find(l => l.id === id);
}
