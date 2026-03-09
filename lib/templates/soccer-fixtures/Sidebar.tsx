'use client';

import { leagues } from './teams';
import type { SoccerFixturesFields, MatchEntry } from '@/components/SoccerFixturesCanvas';

interface SidebarProps {
  fields: SoccerFixturesFields;
  onChange: (fields: SoccerFixturesFields) => void;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-wider text-white/50 mb-2">
      {children}
    </p>
  );
}

function TeamSelect({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <div className="flex-1">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-8 bg-pred-surface border border-pred-border rounded-md px-2 text-xs text-white/90 focus:outline-none focus:border-white/30 transition-colors"
      >
        <option value="">{label}</option>
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
  );
}

export default function SoccerFixturesSidebar({ fields, onChange }: SidebarProps) {
  const updateField = (key: 'title' | 'date' | 'timezone', value: string) => {
    onChange({ ...fields, [key]: value });
  };

  const updateMatch = (index: number, key: keyof MatchEntry, value: string) => {
    const newMatches = fields.matches.map((m, i) =>
      i === index ? { ...m, [key]: value } : m
    );
    onChange({ ...fields, matches: newMatches });
  };

  const addMatch = () => {
    if (fields.matches.length >= 6) return;
    onChange({
      ...fields,
      matches: [...fields.matches, { homeTeam: '', awayTeam: '', time: '3:00 PM' }],
    });
  };

  const removeMatch = (index: number) => {
    if (fields.matches.length <= 1) return;
    onChange({
      ...fields,
      matches: fields.matches.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <SectionLabel>Header</SectionLabel>
        <input
          type="text"
          value={fields.title}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="MATCHES TODAY"
          className="w-full h-8 bg-pred-surface border border-pred-border rounded-md px-2.5 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors mb-2"
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={fields.date}
            onChange={(e) => updateField('date', e.target.value)}
            placeholder="Monday 10 March"
            className="flex-1 h-8 bg-pred-surface border border-pred-border rounded-md px-2.5 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
          />
          <select
            value={fields.timezone}
            onChange={(e) => updateField('timezone', e.target.value)}
            className="w-20 h-8 bg-pred-surface border border-pred-border rounded-md px-2 text-sm text-white/90 focus:outline-none focus:border-white/30 transition-colors"
          >
            {['ET', 'CT', 'PT', 'GMT', 'BST', 'CET'].map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Matches */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <SectionLabel>Matches ({fields.matches.length}/6)</SectionLabel>
          {fields.matches.length < 6 && (
            <button
              onClick={addMatch}
              className="text-[11px] text-pred-yellow hover:text-pred-yellow/80 font-medium uppercase tracking-wider transition-colors"
            >
              + Add
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {fields.matches.map((match, i) => (
            <div key={i} className="bg-pred-surface border border-pred-border rounded-md p-2.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-medium uppercase tracking-wider text-white/30">
                  Match {i + 1}
                </span>
                {fields.matches.length > 1 && (
                  <button
                    onClick={() => removeMatch(i)}
                    className="text-[10px] text-white/30 hover:text-red-400 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="flex gap-1.5 mb-1.5">
                <TeamSelect
                  value={match.homeTeam}
                  onChange={(v) => updateMatch(i, 'homeTeam', v)}
                  label="Home"
                />
                <TeamSelect
                  value={match.awayTeam}
                  onChange={(v) => updateMatch(i, 'awayTeam', v)}
                  label="Away"
                />
              </div>
              <input
                type="text"
                value={match.time}
                onChange={(e) => updateMatch(i, 'time', e.target.value)}
                placeholder="3:00 PM"
                className="w-full h-7 bg-pred-black border border-pred-border rounded px-2 text-xs text-white/90 placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
