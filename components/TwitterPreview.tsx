'use client';

/**
 * Pixel-accurate X/Twitter dark-mode tweet card preview.
 * All values extracted from x.com DOM via Chrome DevTools (Feb 2026).
 *
 * Typography: TwitterChirp fallback chain
 * Layout: 16px horizontal padding, 12px top, 12px avatar-content gap
 * Image: 16px border-radius
 * Dark "Lights Out" palette
 */

interface TwitterPreviewProps {
  imageDataUrl: string | null;
  caption: string;
}

// X dark mode "Lights Out" palette
const colors = {
  bg: '#000000',
  cardBg: '#16181C',
  text: '#E7E9EA',
  secondary: '#71767B',
  border: '#2F3336',
  icon: '#71767B',
} as const;

const fontStack =
  '-apple-system, "system-ui", "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

// Engagement icon SVG paths (extracted from x.com DOM)
const icons = {
  reply:
    'M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z',
  repost:
    'M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z',
  like: 'M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z',
  bookmark:
    'M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5zM6.5 4c-.276 0-.5.22-.5.5v14.56l6-4.29 6 4.29V4.5c0-.28-.224-.5-.5-.5h-11z',
  share:
    'M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z',
  views:
    'M8.75 21V3h2v18h-2zM18.75 21V8.5h2V21h-2zM13.75 21v-6h2v6h-2zM3.75 21v-4h2v4h-2z',
};

function EngagementIcon({ d, label }: { d: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }} title={label}>
      <svg viewBox="0 0 24 24" width={18.75} height={18.75} fill="none" style={{ color: colors.icon }}>
        <path d={d} fill="currentColor" />
      </svg>
    </div>
  );
}

// Official X/Twitter gold verified badge (extracted from x.com DOM Feb 2026)
function VerifiedBadge() {
  return (
    <svg viewBox="0 0 22 22" width={18.75} height={18.75} aria-hidden="true" style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id="gold-outer" gradientUnits="userSpaceOnUse" x1="4" y1="1.5" x2="19.5" y2="22">
          <stop stopColor="#F4E72A" />
          <stop offset=".539" stopColor="#CD8105" />
          <stop offset=".68" stopColor="#CB7B00" />
          <stop offset="1" stopColor="#F4EC26" />
          <stop offset="1" stopColor="#F4E72A" />
        </linearGradient>
        <linearGradient id="gold-inner" gradientUnits="userSpaceOnUse" x1="5" y1="2.5" x2="17.5" y2="19.5">
          <stop stopColor="#F9E87F" />
          <stop offset=".406" stopColor="#E2B719" />
          <stop offset=".989" stopColor="#E2B719" />
        </linearGradient>
      </defs>
      <path
        clipRule="evenodd"
        fillRule="evenodd"
        d="M13.596 3.011L11 .5 8.404 3.011l-3.576-.506-.624 3.558-3.19 1.692L2.6 11l-1.586 3.245 3.19 1.692.624 3.558 3.576-.506L11 21.5l2.596-2.511 3.576.506.624-3.558 3.19-1.692L19.4 11l1.586-3.245-3.19-1.692-.624-3.558-3.576.506zM6 11.39l3.74 3.74 6.2-6.77L14.47 7l-4.8 5.23-2.26-2.26L6 11.39z"
        fill="url(#gold-outer)"
      />
      <path
        clipRule="evenodd"
        fillRule="evenodd"
        d="M13.348 3.772L11 1.5 8.651 3.772l-3.235-.458-.565 3.219-2.886 1.531L3.4 11l-1.435 2.936 2.886 1.531.565 3.219 3.235-.458L11 20.5l2.348-2.272 3.236.458.564-3.219 2.887-1.531L18.6 11l1.435-2.936-2.887-1.531-.564-3.219-3.236.458zM6 11.39l3.74 3.74 6.2-6.77L14.47 7l-4.8 5.23-2.26-2.26L6 11.39z"
        fill="url(#gold-inner)"
      />
      <path
        clipRule="evenodd"
        fillRule="evenodd"
        d="M6 11.39l3.74 3.74 6.197-6.767h.003V9.76l-6.2 6.77L6 12.79v-1.4zm0 0z"
        fill="#D18800"
      />
    </svg>
  );
}

export default function TwitterPreview({ imageDataUrl, caption }: TwitterPreviewProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-pred-black overflow-auto">
      {/* Tweet card */}
      <div
        style={{
          width: 598,
          maxWidth: '100%',
          background: colors.bg,
          border: `1px solid ${colors.border}`,
          borderRadius: 16,
          fontFamily: fontStack,
          overflow: 'hidden',
        }}
      >
        {/* Tweet body */}
        <div style={{ padding: '12px 16px 4px 16px', display: 'flex', gap: 12 }}>
          {/* Avatar — matches @predofficial Twitter profile pic */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '15%',
              background: '#F4FB37',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logos/mark-black.svg"
              alt="Pred"
              style={{ width: 24, height: 24 }}
            />
          </div>

          {/* Content column */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Name row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  lineHeight: '20px',
                  color: colors.text,
                  whiteSpace: 'nowrap',
                }}
              >
                PRED
              </span>
              <VerifiedBadge />
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 400,
                  lineHeight: '20px',
                  color: colors.secondary,
                  whiteSpace: 'nowrap',
                }}
              >
                @predofficial
              </span>
              <span style={{ fontSize: 15, color: colors.secondary }}>&middot;</span>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 400,
                  lineHeight: '20px',
                  color: colors.secondary,
                  whiteSpace: 'nowrap',
                }}
              >
                now
              </span>
            </div>

            {/* Caption text */}
            {caption && (
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 400,
                  lineHeight: '20px',
                  color: colors.text,
                  marginTop: 4,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {caption}
              </div>
            )}

            {/* Image */}
            {imageDataUrl && (
              <div
                style={{
                  marginTop: 12,
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: `1px solid ${colors.border}`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageDataUrl}
                  alt="Preview"
                  style={{
                    display: 'block',
                    width: '100%',
                  }}
                />
              </div>
            )}

            {/* Engagement bar — two-zone layout matching X feed */}
            <div style={{ display: 'flex', alignItems: 'center', height: 48, gap: 16 }}>
              {/* Left zone — evenly distributed */}
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between' }}>
                <EngagementIcon d={icons.reply} label="Reply" />
                <EngagementIcon d={icons.repost} label="Repost" />
                <EngagementIcon d={icons.like} label="Like" />
                <EngagementIcon d={icons.views} label="Views" />
              </div>
              {/* Right zone — clumped */}
              <div style={{ display: 'flex', gap: 12 }}>
                <EngagementIcon d={icons.bookmark} label="Bookmark" />
                <EngagementIcon d={icons.share} label="Share" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
