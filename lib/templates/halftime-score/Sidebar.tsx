'use client';

import { useState } from 'react';
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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-medium uppercase tracking-wider text-white/30 mb-1 block">
      {children}
    </span>
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
      className="w-full h-9 bg-pred-surface border border-pred-border rounded-lg px-3 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
    />
  );
}

function ChevronIcon() {
  return (
    <svg
      width="12" height="12" viewBox="0 0 12 12" fill="none"
      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40"
    >
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SelectInput({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 bg-pred-surface border border-pred-border rounded-lg pl-3 pr-8 text-sm text-white/90 appearance-none focus:outline-none focus:border-white/30 transition-colors cursor-pointer"
      >
        {children}
      </select>
      <ChevronIcon />
    </div>
  );
}

function QuickFill({ fields, onChange }: HalftimeScoreSidebarProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    const message = input.trim();
    if (!message || loading) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/parse-halftime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Request failed');
      }

      const data = await res.json();
      const updated: Partial<HalftimeScoreFields> = {};
      if (data.homeTeam) updated.homeTeam = data.homeTeam;
      if (data.awayTeam) updated.awayTeam = data.awayTeam;
      if (data.homeScore) updated.homeScore = String(data.homeScore);
      if (data.awayScore) updated.awayScore = String(data.awayScore);
      if (data.homeOdds) updated.homeOdds = String(data.homeOdds);
      if (data.awayOdds) updated.awayOdds = String(data.awayOdds);
      if (data.status) updated.status = data.status;
      if (data.league) updated.league = data.league;

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
          placeholder={"Describe the match...\ne.g. Real Madrid 0-2 Barcelona, La Liga, live, 30% vs 52%"}
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

export default function HalftimeScoreSidebar({ fields, onChange }: HalftimeScoreSidebarProps) {
  const update = (key: keyof HalftimeScoreFields, value: string) => {
    onChange({ ...fields, [key]: value });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* AI Quick Fill */}
      <QuickFill fields={fields} onChange={onChange} />

      {/* Teams */}
      <div>
        <SectionLabel>Teams</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <FieldLabel>Home</FieldLabel>
            <SelectInput value={fields.homeTeam} onChange={(v) => update('homeTeam', v)}>
              <option value="">Select team</option>
              {leagues.map((league) => (
                <optgroup key={league.id} label={league.name}>
                  {league.teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </SelectInput>
          </div>
          <div>
            <FieldLabel>Away</FieldLabel>
            <SelectInput value={fields.awayTeam} onChange={(v) => update('awayTeam', v)}>
              <option value="">Select team</option>
              {leagues.map((league) => (
                <optgroup key={league.id} label={league.name}>
                  {league.teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </SelectInput>
          </div>
        </div>
      </div>

      {/* Score & Odds */}
      <div>
        <SectionLabel>Score & Odds</SectionLabel>
        <div className="grid grid-cols-2 gap-x-2 gap-y-2">
          <div>
            <FieldLabel>Home Score</FieldLabel>
            <TextInput value={fields.homeScore} onChange={(v) => update('homeScore', v)} placeholder="0" />
          </div>
          <div>
            <FieldLabel>Away Score</FieldLabel>
            <TextInput value={fields.awayScore} onChange={(v) => update('awayScore', v)} placeholder="0" />
          </div>
          <div>
            <FieldLabel>Home Odds %</FieldLabel>
            <TextInput value={fields.homeOdds} onChange={(v) => update('homeOdds', v)} placeholder="50" />
          </div>
          <div>
            <FieldLabel>Away Odds %</FieldLabel>
            <TextInput value={fields.awayOdds} onChange={(v) => update('awayOdds', v)} placeholder="50" />
          </div>
        </div>
      </div>

      {/* Match Info */}
      <div>
        <SectionLabel>Match Info</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <FieldLabel>Status</FieldLabel>
            <SelectInput value={fields.status} onChange={(v) => update('status', v)}>
              <option value="HALFTIME">Halftime</option>
              <option value="FULLTIME">Fulltime</option>
              <option value="LIVE">Live</option>
            </SelectInput>
          </div>
          <div>
            <FieldLabel>League</FieldLabel>
            <SelectInput value={fields.league} onChange={(v) => update('league', v)}>
              <option value="">Select</option>
              {leagueOptions.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </SelectInput>
          </div>
        </div>
      </div>

    </div>
  );
}
