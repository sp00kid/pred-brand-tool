'use client';

interface ExportButtonProps {
  format: 'png' | 'jpeg';
  onFormatChange: (f: 'png' | 'jpeg') => void;
  onExport: () => void;
  onCopy: () => void;
  disabled: boolean;
}

export default function ExportButton({ format, onFormatChange, onExport, onCopy, disabled }: ExportButtonProps) {
  return (
    <div className={`flex flex-col gap-3 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      {/* Format toggle */}
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-white/50 mb-2">
          Format
        </p>
        <div className="flex gap-1 bg-pred-surface rounded-md p-0.5">
          {(['png', 'jpeg'] as const).map((f) => (
            <button
              key={f}
              onClick={() => onFormatChange(f)}
              className={`
                flex-1 h-7 rounded text-[11px] font-semibold uppercase tracking-wider transition-all
                ${format === f
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white/60'
                }
              `}
            >
              {f === 'jpeg' ? 'JPEG' : 'PNG'}
            </button>
          ))}
        </div>
      </div>

      {/* Export + Copy buttons */}
      <div className="flex gap-2">
        <button
          onClick={onExport}
          disabled={disabled}
          className={`
            flex-1 h-11 shrink-0 rounded-md text-sm font-semibold transition-all
            ${disabled
              ? 'bg-pred-surface text-pred-grey/40 cursor-not-allowed'
              : 'bg-pred-yellow text-pred-black hover:brightness-110 active:scale-[0.98]'
            }
          `}
        >
          Export {format === 'jpeg' ? 'JPEG' : 'PNG'}
        </button>
        <button
          onClick={onCopy}
          disabled={disabled}
          title="Copy to clipboard"
          className={`
            w-11 h-11 shrink-0 rounded-md flex items-center justify-center transition-all
            ${disabled
              ? 'bg-pred-surface text-pred-grey/40 cursor-not-allowed'
              : 'bg-pred-surface border border-pred-border text-white/70 hover:text-white hover:border-white/30 active:scale-[0.98]'
            }
          `}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </button>
      </div>
    </div>
  );
}
