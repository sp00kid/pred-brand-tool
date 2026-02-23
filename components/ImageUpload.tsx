'use client';

import { useCallback, useRef, useState } from 'react';

export interface ImageInfo {
  width: number;
  height: number;
  fileSize: number;
}

interface ImageUploadProps {
  onImageUpload: (dataUrl: string, file: File) => void;
  hasImage: boolean;
  imageInfo?: ImageInfo | null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ImageUpload({ onImageUpload, hasImage, imageInfo }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onImageUpload(e.target.result as string, file);
      }
    };
    reader.readAsDataURL(file);
  }, [onImageUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClick = () => inputRef.current?.click();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <label className={`text-xs font-medium uppercase tracking-wider mb-3 block ${hasImage ? 'text-pred-grey' : 'text-white/70'}`}>
        {hasImage ? 'Replace Image' : 'Upload Image'}
      </label>
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          group flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed
          p-6 cursor-pointer transition-all duration-150
          ${isDragging
            ? 'border-white/60 bg-white/5'
            : hasImage
              ? 'border-pred-border hover:border-pred-grey/50 hover:bg-pred-surface/50 hover:scale-[1.01]'
              : 'border-white/30 bg-white/[0.04] hover:border-white/50 hover:bg-white/[0.07] hover:scale-[1.01]'
          }
        `}
      >
        <svg
          width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
          className={`transition-transform duration-150 group-hover:-translate-y-0.5 ${hasImage ? 'text-pred-grey' : 'text-white/70'}`}
        >
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
        </svg>
        <span className={`text-sm ${hasImage ? 'text-pred-grey' : 'text-white/80'}`}>
          {hasImage ? 'Drop to replace' : 'Drop image or click'}
        </span>
        <span className={`text-xs ${hasImage ? 'text-pred-grey/50' : 'text-white/40'}`}>PNG, JPG, WebP</span>
      </div>
      {imageInfo && (
        <p className="text-[10px] text-pred-grey/50 mt-2 text-center tabular-nums">
          {imageInfo.width} &times; {imageInfo.height} &middot; {formatFileSize(imageInfo.fileSize)}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
