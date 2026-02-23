'use client';

import { cropPresets } from '@/lib/crop';

interface CropSelectorProps {
  selectedId: string;
  onChange: (ratio: number | null, id: string) => void;
  disabled: boolean;
}

export default function CropSelector({ selectedId, onChange, disabled }: CropSelectorProps) {
  return (
    <div className={disabled ? 'opacity-40 pointer-events-none' : ''}>
      <p className="text-[11px] font-medium uppercase tracking-wider text-white/50 mb-3">
        Crop Ratio
      </p>
      <div className="flex gap-1.5">
        {cropPresets.map((preset) => {
          const isActive = preset.id === selectedId;
          return (
            <button
              key={preset.id}
              onClick={() => onChange(preset.ratio, preset.id)}
              className={`
                flex-1 h-8 px-2 rounded-md text-[11px] font-medium uppercase tracking-wider transition-all
                ${isActive
                  ? 'bg-white/[0.06] border border-white/60 text-white'
                  : 'bg-pred-surface border border-pred-border text-white/50 hover:border-white/20 hover:text-white/70'
                }
              `}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
