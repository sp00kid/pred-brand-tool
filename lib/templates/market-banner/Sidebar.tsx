'use client';

import type { MarketBannerFields } from '@/components/MarketBannerCanvas';

// Common team color presets
const colorPresets = [
  '#D82126', // Liverpool red
  '#7C2C3B', // West Ham
  '#034694', // Chelsea blue
  '#6CABDD', // Man City
  '#DA291C', // Man United
  '#132257', // Tottenham navy
  '#EF0107', // Arsenal red
  '#003399', // Everton blue
  '#FDB913', // Wolves gold
  '#241F20', // Newcastle black
  '#0057B8', // Leicester
  '#FFFFFF', // White
];

interface MarketBannerSidebarProps {
  fields: MarketBannerFields;
  onChange: (fields: MarketBannerFields) => void;
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
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className="w-full h-8 bg-pred-surface border border-pred-border rounded-md px-2.5 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
    />
  );
}

function ColorInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-md border border-pred-border shrink-0"
          style={{ backgroundColor: value }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 h-8 bg-pred-surface border border-pred-border rounded-md px-2.5 text-sm text-white/90 font-mono placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
        />
      </div>
      <div className="flex flex-wrap gap-1">
        {colorPresets.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`w-5 h-5 rounded border transition-all ${
              value.toUpperCase() === c.toUpperCase()
                ? 'border-white scale-110'
                : 'border-pred-border hover:border-white/30 hover:scale-105'
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  );
}

export default function MarketBannerSidebar({ fields, onChange }: MarketBannerSidebarProps) {
  const update = (key: keyof MarketBannerFields, value: string) => {
    onChange({ ...fields, [key]: value });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Teams */}
      <div>
        <SectionLabel>Teams</SectionLabel>
        <div className="flex gap-2 mb-2">
          <TextInput value={fields.team1} onChange={(v) => update('team1', v)} placeholder="Team 1" />
          <TextInput value={fields.team2} onChange={(v) => update('team2', v)} placeholder="Team 2" />
        </div>
        <div className="flex gap-2">
          <TextInput value={fields.team1Abbr} onChange={(v) => update('team1Abbr', v)} placeholder="ABR" maxLength={5} />
          <TextInput value={fields.team2Abbr} onChange={(v) => update('team2Abbr', v)} placeholder="ABR" maxLength={5} />
        </div>
      </div>

      {/* Prices */}
      <div>
        <SectionLabel>Prices</SectionLabel>
        <div className="flex gap-2">
          <TextInput value={fields.price1} onChange={(v) => update('price1', v)} placeholder="62¢" />
          <TextInput value={fields.price2} onChange={(v) => update('price2', v)} placeholder="16¢" />
        </div>
      </div>

      {/* Card Colors */}
      <div>
        <SectionLabel>Card Colors</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          <ColorInput value={fields.color1} onChange={(v) => update('color1', v)} />
          <ColorInput value={fields.color2} onChange={(v) => update('color2', v)} />
        </div>
      </div>

      {/* Match Info */}
      <div>
        <SectionLabel>Match Info</SectionLabel>
        <div className="flex gap-2 mb-2">
          <TextInput value={fields.league} onChange={(v) => update('league', v)} placeholder="League" />
          <TextInput value={fields.date} onChange={(v) => update('date', v)} placeholder="Date" />
        </div>
        <TextInput value={fields.label} onChange={(v) => update('label', v)} placeholder="Label (e.g. NEW MARKET)" />
      </div>

      {/* Status */}
      <div>
        <SectionLabel>Status</SectionLabel>
        <select
          value={fields.status}
          onChange={(e) => update('status', e.target.value)}
          className="w-full h-8 bg-pred-surface border border-pred-border rounded-md px-2.5 text-sm text-white/90 focus:outline-none focus:border-white/30 transition-colors"
        >
          <option value="MARKET LIVE">Market Live</option>
          <option value="COMING SOON">Coming Soon</option>
        </select>
      </div>
    </div>
  );
}
