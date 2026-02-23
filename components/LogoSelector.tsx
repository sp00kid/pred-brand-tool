'use client';

import type { LogoVariant } from '@/lib/constraints';
import { logoVariants } from '@/lib/constraints';

interface LogoSelectorProps {
  selectedId: string;
  onChange: (variant: LogoVariant) => void;
  disabled: boolean;
}

export default function LogoSelector({ selectedId, onChange, disabled }: LogoSelectorProps) {
  return (
    <div className={disabled ? 'opacity-40 pointer-events-none' : ''}>
      <p className="text-[10px] uppercase tracking-wider text-white/40 mb-3">Logo Variant</p>
      <div className="grid grid-cols-3 gap-2">
        {logoVariants.map((v) => {
          const isActive = v.id === selectedId;
          const bgColor = v.color === 'black' ? '#3A3A3A' : '#1A1A1A';
          return (
            <button
              key={v.id}
              onClick={() => onChange(v)}
              className={`
                flex items-center justify-center rounded-md h-12 px-2 transition-all
                ${isActive
                  ? 'border border-white/60 shadow-none'
                  : 'border border-pred-border hover:border-white/20'
                }
              `}
              style={{ backgroundColor: bgColor }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={v.path}
                alt={v.label}
                className={v.type === 'mark' ? 'h-6 w-6 object-contain' : 'h-4 max-w-full object-contain'}
              />
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-white/40 mt-2">
        {logoVariants.find((v) => v.id === selectedId)?.label}
      </p>
    </div>
  );
}
