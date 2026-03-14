import type { TemplateDefinition } from '../types';

export const MAX_MATCHES = 12;

export const soccerFixturesTemplate: TemplateDefinition = {
  id: 'soccer-fixtures',
  name: 'Soccer Fixtures',
  description: 'Daily match schedule graphic with team badges and kick-off times',
  canvasWidth: 1280,
  canvasHeight: 720,
  fields: [
    { id: 'title', label: 'Title', type: 'text', group: 'Header', default: 'MATCHES TODAY' },
    { id: 'date', label: 'Date', type: 'text', group: 'Header', default: 'Monday 10 March' },
    {
      id: 'timezone',
      label: 'Timezone',
      type: 'select',
      group: 'Header',
      default: 'ET',
      options: [
        { label: 'ET', value: 'ET' },
        { label: 'CT', value: 'CT' },
        { label: 'PT', value: 'PT' },
        { label: 'GMT', value: 'GMT' },
        { label: 'BST', value: 'BST' },
        { label: 'CET', value: 'CET' },
      ],
    },
    {
      id: 'matches',
      label: 'Matches',
      type: 'repeater',
      min: 1,
      max: MAX_MATCHES,
      itemFields: [
        { id: 'homeTeam', label: 'Home', type: 'select' },
        { id: 'awayTeam', label: 'Away', type: 'select' },
        { id: 'time', label: 'Time', type: 'text', default: '3:00 PM' },
      ],
    },
  ],
  defaultValues: {
    title: 'MATCHES TODAY',
    date: 'Monday 10 March',
    timezone: 'ET',
    matches: [
      { homeTeam: 'arsenal', awayTeam: 'chelsea', time: '2:30 PM' },
      { homeTeam: 'liverpool', awayTeam: 'mancity', time: '3:00 PM' },
      { homeTeam: 'barcelona', awayTeam: 'realmadrid', time: '5:30 PM' },
    ],
  },
};
