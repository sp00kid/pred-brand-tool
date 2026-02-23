'use client';

import type { Corner, LogoConstraints } from '@/lib/constraints';

interface ConstraintPanelProps {
  constraints: LogoConstraints;
  onChange: (constraints: LogoConstraints) => void;
  disabled: boolean;
}

const corners: Corner[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

export default function ConstraintPanel({ constraints, onChange, disabled }: ConstraintPanelProps) {
  const gapPercent = Math.round(constraints.gap * 100 * 10) / 10;
  const sizePercent = Math.round(constraints.logoScale * 100);
  const opacityPercent = Math.round(constraints.opacity * 100);

  return (
    <div className={`flex flex-col gap-5 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      {/* Corner selector */}
      <div>
        <label className="text-[11px] font-medium uppercase tracking-wider text-white/50 mb-3 block">
          Logo Position
        </label>
        <div className="grid grid-cols-2 gap-2">
          {corners.map((value) => {
            const isActive = constraints.corner === value;
            const isTop = value.startsWith('top');
            const isLeft = value.endsWith('left');
            return (
              <button
                key={value}
                onClick={() => onChange({ ...constraints, corner: value })}
                className={`
                  h-10 rounded-md transition-all flex items-center justify-center
                  ${isActive
                    ? 'bg-white/[0.06] border border-white/60'
                    : 'bg-pred-surface border border-pred-border hover:border-white/20'
                  }
                `}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d={
                      isTop && isLeft   ? 'M2 10V2h8' :
                      isTop && !isLeft  ? 'M14 10V2H6' :
                      !isTop && isLeft  ? 'M2 6v8h8' :
                                          'M14 6v8H6'
                    }
                    stroke={isActive ? '#fff' : '#666'}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            );
          })}
        </div>
      </div>

      {/* Gap slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-medium uppercase tracking-wider text-white/50">
            Gap
          </label>
          <span className="text-xs tabular-nums text-white/70">{gapPercent}%</span>
        </div>
        <input
          type="range"
          min={0.01}
          max={0.1}
          step={0.005}
          value={constraints.gap}
          onChange={(e) => onChange({ ...constraints, gap: parseFloat(e.target.value) })}
          className="w-full slider"
          style={{ '--value': (constraints.gap - 0.01) / (0.1 - 0.01) } as React.CSSProperties}
        />
      </div>

      {/* Logo size slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-medium uppercase tracking-wider text-white/50">
            Logo Size
          </label>
          <span className="text-xs tabular-nums text-white/70">{sizePercent}%</span>
        </div>
        <input
          type="range"
          min={0.05}
          max={0.35}
          step={0.01}
          value={constraints.logoScale}
          onChange={(e) => onChange({ ...constraints, logoScale: parseFloat(e.target.value) })}
          className="w-full slider"
          style={{ '--value': (constraints.logoScale - 0.05) / (0.35 - 0.05) } as React.CSSProperties}
        />
      </div>

      {/* Opacity slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-medium uppercase tracking-wider text-white/50">
            Opacity
          </label>
          <span className="text-xs tabular-nums text-white/70">{opacityPercent}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={constraints.opacity}
          onChange={(e) => onChange({ ...constraints, opacity: parseFloat(e.target.value) })}
          className="w-full slider"
          style={{ '--value': constraints.opacity } as React.CSSProperties}
        />
      </div>
    </div>
  );
}
