import { TemplateDefinition } from '../types';

export const halftimeScoreTemplate: TemplateDefinition = {
  id: 'halftime-score',
  name: 'Halftime Score',
  description: 'Instagram match score graphic with odds pills',
  canvasWidth: 1080,
  canvasHeight: 1080,
  fields: [
    { id: 'homeTeam', label: 'Home Team', type: 'select', group: 'Teams', half: true },
    { id: 'awayTeam', label: 'Away Team', type: 'select', group: 'Teams', half: true },
    { id: 'homeScore', label: 'Home Score', type: 'text', group: 'Score', half: true },
    { id: 'awayScore', label: 'Away Score', type: 'text', group: 'Score', half: true },
    { id: 'homeOdds', label: 'Home Odds %', type: 'text', group: 'Odds', half: true },
    { id: 'awayOdds', label: 'Away Odds %', type: 'text', group: 'Odds', half: true },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      group: 'Match Info',
      options: [
        { label: 'Halftime', value: 'HALFTIME' },
        { label: 'Fulltime', value: 'FULLTIME' },
        { label: 'Live', value: 'LIVE' },
      ],
    },
    { id: 'league', label: 'League', type: 'select', group: 'Match Info' },
  ],
  defaultValues: {
    homeTeam: 'realmadrid',
    awayTeam: 'barcelona',
    homeScore: '0',
    awayScore: '2',
    homeOdds: '30',
    awayOdds: '52',
    status: 'LIVE',
    league: 'la-liga',
  },
};
