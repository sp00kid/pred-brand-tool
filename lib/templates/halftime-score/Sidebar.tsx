'use client';

import { leagues } from '@/lib/templates/soccer-fixtures/teams';
import { leagueOptions } from './leagues';

export interface HalftimeScoreFields {
  homeTeam: string;
  awayTeam: string;
  homeScore: string;
  awayScore: string;
  homeOdds: string;
  awayOdds: string;
  status: string;
  league: string;
}

interface HalftimeScoreSidebarProps {
  fields: HalftimeScoreFields;
  onChange: (fields: HalftimeScoreFields) => void;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-wider text-white/50 mb-2">
      {children}
    </p>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-8 bg-pred-surface border border-pred-border rounded-md px-2.5 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
    />
  );
}

export default function HalftimeScoreSidebar({ fields, onChange }: HalftimeScoreSidebarProps) {
  const update = (key: keyof HalftimeScoreFields, value: string) => {
    onChange({ ...fields, [key]: value });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Teams */}
      <div>
        <SectionLabel>Teams</SectionLabel>
        <div className="flex gap-2">
          <select
            value={fields.homeTeam}
            onChange={(e) => update('homeTeam', e.target.value)}
            className="w-full h-8 bg-pred-surface border border-pred-border rounded-md px-2.5 text-sm text-white/90 appearance-none focus:outline-none focus:border-white/30 transition-colors"
          >
            <option value="">Home Team</option>
            {leagues.map((league) => (
              <optgroup key={league.id} label={league.name}>
                {league.teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <select
            value={fields.awayTeam}
            onChange={(e) => update('awayTeam', e.target.value)}
            className="w-full h-8 bg-pred-surface border border-pred-border rounded-md px-2.5 text-sm text-white/90 appearance-none focus:outline-none focus:border-white/30 transition-colors"
          >
            <option value="">Away Team</option>
            {leagues.map((league) => (
              <optgroup key={league.id} label={league.name}>
                {league.teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {/* Score */}
      <div>
        <SectionLabel>Score</SectionLabel>
        <div className="flex gap-2">
          <TextInput value={fields.homeScore} onChange={(v) => update('homeScore', v)} placeholder="Home Score" />
          <TextInput value={fields.awayScore} onChange={(v) => update('awayScore', v)} placeholder="Away Score" />
        </div>
      </div>

      {/* Odds */}
      <div>
        <SectionLabel>Odds</SectionLabel>
        <div className="flex gap-2">
          <TextInput value={fields.homeOdds} onChange={(v) => update('homeOdds', v)} placeholder="Home Odds %" />
          <TextInput value={fields.awayOdds} onChange={(v) => update('awayOdds', v)} placeholder="Away Odds %" />
        </div>
      </div>

      {/* Match Info */}
      <div>
        <SectionLabel>Match Info</SectionLabel>
        <div className="flex flex-col gap-2">
          <select
            value={fields.status}
            onChange={(e) => update('status', e.target.value)}
            className="w-full h-8 bg-pred-surface border border-pred-border rounded-md px-2.5 text-sm text-white/90 appearance-none focus:outline-none focus:border-white/30 transition-colors"
          >
            <option value="HALFTIME">Halftime</option>
            <option value="FULLTIME">Fulltime</option>
            <option value="LIVE">Live</option>
          </select>
          <select
            value={fields.league}
            onChange={(e) => update('league', e.target.value)}
            className="w-full h-8 bg-pred-surface border border-pred-border rounded-md px-2.5 text-sm text-white/90 appearance-none focus:outline-none focus:border-white/30 transition-colors"
          >
            <option value="">Select League</option>
            {leagueOptions.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
