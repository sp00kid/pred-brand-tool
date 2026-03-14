'use client';

interface BgBlurSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export default function BgBlurSlider({ value, onChange }: BgBlurSliderProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[11px] font-medium uppercase tracking-wider text-white/50">
          BG Blur
        </p>
        <span className="text-[11px] text-white/40 tabular-nums">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-pred-yellow h-1"
      />
    </div>
  );
}
