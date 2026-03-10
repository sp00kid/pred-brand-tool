'use client';

import { useState } from 'react';
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

function MatchParser({ fields, onChange }: SidebarProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    const message = input.trim();
    if (!message || loading) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/parse-matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Request failed');
      }

      const data = await res.json();
      const updated: Partial<SoccerFixturesFields> = {};
      if (data.title) updated.title = data.title;
      if (data.date) updated.date = data.date;
      if (data.timezone) updated.timezone = data.timezone;
      if (data.matches?.length) updated.matches = data.matches;

      onChange({ ...fields, ...updated });
      setInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-pred-surface border border-pred-border rounded-md p-2.5">
      <div className="flex items-center gap-1.5 mb-2">
        <svg className="w-3.5 h-3.5 text-pred-yellow shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a4 4 0 0 0-4 4c0 2 1.5 3 1.5 5h5c0-2 1.5-3 1.5-5a4 4 0 0 0-4-4zM9.5 18h5M10 21h4M10 11h.01M14 11h.01" />
        </svg>
        <span className="text-[11px] font-medium uppercase tracking-wider text-white/50">Quick Fill</span>
      </div>
      <div className="relative">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={"Describe your matches...\ne.g. Arsenal vs Chelsea 8pm, Barca vs Bayern 10pm CET"}
          disabled={loading}
          rows={3}
          className="w-full bg-pred-black border border-pred-border rounded px-2.5 py-2 pr-10 text-xs text-white/90 placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors disabled:opacity-50 resize-none"
        />
        <button
          onClick={submit}
          disabled={loading || !input.trim()}
          className="absolute right-1.5 bottom-1.5 h-6 w-6 flex items-center justify-center bg-pred-yellow text-pred-black rounded hover:bg-pred-yellow/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          ) : (
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </div>
      {error && (
        <p className="text-[11px] text-red-400 mt-1.5">{error}</p>
      )}
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

      {/* AI Match Parser */}
      <MatchParser fields={fields} onChange={onChange} />

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
