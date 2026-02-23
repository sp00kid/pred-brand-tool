'use client';

interface ExportButtonProps {
  onExport: () => void;
  disabled: boolean;
}

export default function ExportButton({ onExport, disabled }: ExportButtonProps) {
  return (
    <button
      onClick={onExport}
      disabled={disabled}
      className={`
        w-full h-11 shrink-0 rounded-md text-sm font-semibold transition-all
        ${disabled
          ? 'bg-pred-surface text-pred-grey/40 cursor-not-allowed'
          : 'bg-pred-yellow text-pred-black hover:brightness-110 active:scale-[0.98]'
        }
      `}
    >
      Export PNG
    </button>
  );
}
