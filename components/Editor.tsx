'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import ImageUpload, { type ImageInfo } from './ImageUpload';
import LogoCanvas, { type LogoCanvasHandle } from './LogoCanvas';
import MarketBannerCanvas, { type MarketBannerCanvasHandle, type MarketBannerFields } from './MarketBannerCanvas';
import SoccerFixturesCanvas, { type SoccerFixturesCanvasHandle, type SoccerFixturesFields } from './SoccerFixturesCanvas';
import HalftimeScoreCanvas, { type HalftimeScoreCanvasHandle } from './HalftimeScoreCanvas';
import LogoSelector from './LogoSelector';
import ConstraintPanel from './ConstraintPanel';
import ExportButton from './ExportButton';
import CropSelector from './CropSelector';
import TwitterPreview from './TwitterPreview';
import MarketBannerSidebar from '@/lib/templates/market-banner/Sidebar';
import SoccerFixturesSidebar from '@/lib/templates/soccer-fixtures/Sidebar';
import HalftimeScoreSidebar, { type HalftimeScoreFields } from '@/lib/templates/halftime-score/Sidebar';
import { defaultConstraints, logoVariants, type LogoConstraints, type LogoVariant } from '@/lib/constraints';
import { templates } from '@/lib/templates';
import { marketBannerTemplate } from '@/lib/templates/market-banner';
import { soccerFixturesTemplate } from '@/lib/templates/soccer-fixtures';

// Shared canvas handle interface
type CanvasHandle = LogoCanvasHandle | MarketBannerCanvasHandle | SoccerFixturesCanvasHandle | HalftimeScoreCanvasHandle;

const defaultBannerFields: MarketBannerFields = marketBannerTemplate.defaultValues as unknown as MarketBannerFields;

export default function Editor() {
  // Template state
  const [activeTemplate, setActiveTemplate] = useState<string>('logo-overlay');

  // Logo overlay state
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [constraints, setConstraints] = useState<LogoConstraints>(defaultConstraints);
  const [logoVariant, setLogoVariant] = useState<LogoVariant>(logoVariants[0]);
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [cropRatio, setCropRatio] = useState<number | null>(null);
  const [cropId, setCropId] = useState('original');

  // Market banner state
  const [bannerImageDataUrl, setBannerImageDataUrl] = useState<string | null>('/mock/banner-default.png');
  const [bannerImageInfo, setBannerImageInfo] = useState<ImageInfo | null>(null);
  const [bannerFields, setBannerFields] = useState<MarketBannerFields>(defaultBannerFields);

  // Soccer fixtures state
  const [fixturesImageDataUrl, setFixturesImageDataUrl] = useState<string | null>('/mock/fixtures-default.jpg');
  const [fixturesImageInfo, setFixturesImageInfo] = useState<ImageInfo | null>(null);
  const [fixturesFields, setFixturesFields] = useState<SoccerFixturesFields>(
    soccerFixturesTemplate.defaultValues as unknown as SoccerFixturesFields
  );

  // Halftime score state
  const [halftimeImageDataUrl, setHalftimeImageDataUrl] = useState<string | null>('/mock/halftime-default.jpg');
  const [halftimeImageInfo, setHalftimeImageInfo] = useState<ImageInfo | null>(null);
  const [halftimeFields, setHalftimeFields] = useState<HalftimeScoreFields>({
    homeTeam: 'real-madrid',
    awayTeam: 'barcelona',
    homeScore: '0',
    awayScore: '2',
    homeOdds: '30',
    awayOdds: '52',
    status: 'LIVE',
    league: 'la-liga',
  });

  // Shared state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg'>('png');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');

  const logoCanvasRef = useRef<LogoCanvasHandle>(null);
  const bannerCanvasRef = useRef<MarketBannerCanvasHandle>(null);
  const fixturesCanvasRef = useRef<SoccerFixturesCanvasHandle>(null);
  const halftimeCanvasRef = useRef<HalftimeScoreCanvasHandle>(null);
  const toastTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  // Active canvas handle
  const getActiveCanvas = useCallback((): CanvasHandle | null => {
    if (activeTemplate === 'logo-overlay') return logoCanvasRef.current;
    if (activeTemplate === 'market-banner') return bannerCanvasRef.current;
    if (activeTemplate === 'soccer-fixtures') return fixturesCanvasRef.current;
    if (activeTemplate === 'halftime-score') return halftimeCanvasRef.current;
    return null;
  }, [activeTemplate]);

  // Active image state helpers
  const activeImageDataUrl =
    activeTemplate === 'logo-overlay' ? imageDataUrl :
    activeTemplate === 'market-banner' ? bannerImageDataUrl :
    activeTemplate === 'soccer-fixtures' ? fixturesImageDataUrl :
    activeTemplate === 'halftime-score' ? halftimeImageDataUrl :
    null;
  const activeImageInfo =
    activeTemplate === 'logo-overlay' ? imageInfo :
    activeTemplate === 'market-banner' ? bannerImageInfo :
    activeTemplate === 'soccer-fixtures' ? fixturesImageInfo :
    activeTemplate === 'halftime-score' ? halftimeImageInfo :
    null;
  // Logo overlay needs image to enable controls; other templates work without image
  const hasContent = activeTemplate === 'logo-overlay' ? !!imageDataUrl : true;

  const handleImageUpload = useCallback((dataUrl: string, file: File) => {
    if (activeTemplate === 'logo-overlay') {
      setImageDataUrl(dataUrl);
      setCropRatio(null);
      setCropId('original');
    } else if (activeTemplate === 'market-banner') {
      setBannerImageDataUrl(dataUrl);
    } else if (activeTemplate === 'halftime-score') {
      setHalftimeImageDataUrl(dataUrl);
    } else {
      setFixturesImageDataUrl(dataUrl);
    }
    setCaption('');
    setActiveTab('editor');
    setPreviewDataUrl(null);

    const img = new Image();
    img.onload = () => {
      const info = { width: img.naturalWidth, height: img.naturalHeight, fileSize: file.size };
      if (activeTemplate === 'logo-overlay') {
        setImageInfo(info);
      } else if (activeTemplate === 'market-banner') {
        setBannerImageInfo(info);
      } else {
        setFixturesImageInfo(info);
      }
    };
    img.src = dataUrl;
  }, [activeTemplate]);

  const handleExport = useCallback(() => {
    const canvas = getActiveCanvas();
    if (!canvas) return;

    const quality = exportFormat === 'jpeg' ? 0.85 : undefined;
    const dataUrl = canvas.exportImage(exportFormat, quality);
    if (!dataUrl) return;

    const ext = exportFormat === 'jpeg' ? 'jpg' : 'png';
    let filename: string;
    if (activeTemplate === 'market-banner') {
      const a1 = bannerFields.team1Abbr || 'T1';
      const a2 = bannerFields.team2Abbr || 'T2';
      filename = `pred-${a1}-vs-${a2}.${ext}`;
    } else if (activeTemplate === 'soccer-fixtures') {
      filename = `pred-fixtures-${fixturesFields.date.replace(/\s+/g, '-').toLowerCase()}.${ext}`;
    } else {
      filename = `pred-branded.${ext}`;
    }

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();

    setShowToast(true);
    setToastMessage(`Exported ${filename}`);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setShowToast(false), 2000);
  }, [exportFormat, activeTemplate, bannerFields.team1Abbr, bannerFields.team2Abbr, fixturesFields.date, getActiveCanvas]);

  const handleCopy = useCallback(async () => {
    const canvas = getActiveCanvas();
    if (!canvas) return;

    const dataUrl = canvas.exportImage('png');
    if (!dataUrl) return;

    const res = await fetch(dataUrl);
    const blob = await res.blob();
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);

    setShowToast(true);
    setToastMessage('Copied to clipboard');
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setShowToast(false), 2000);
  }, [getActiveCanvas]);

  const handleTabChange = useCallback((tab: 'editor' | 'preview') => {
    if (tab === 'preview' && activeTab !== 'preview') {
      const canvas = getActiveCanvas();
      const dataUrl = canvas?.getPreview();
      setPreviewDataUrl(dataUrl ?? null);
    }
    setActiveTab(tab);
  }, [activeTab, getActiveCanvas]);

  // Re-capture preview when canvas state changes while in preview mode
  useEffect(() => {
    if (activeTab !== 'preview') return;
    const frame = requestAnimationFrame(() => {
      const canvas = getActiveCanvas();
      const dataUrl = canvas?.getPreview();
      if (dataUrl) setPreviewDataUrl(dataUrl);
    });
    return () => cancelAnimationFrame(frame);
  }, [activeTab, constraints, logoVariant, cropRatio, zoomLevel, bannerFields, fixturesFields, halftimeFields, getActiveCanvas]);

  const handleCanvasUpdate = useCallback(() => {
    if (activeTab !== 'preview') return;
    const canvas = getActiveCanvas();
    const dataUrl = canvas?.getPreview();
    if (dataUrl) setPreviewDataUrl(dataUrl);
  }, [activeTab, getActiveCanvas]);

  // Reset zoom when switching templates
  const handleTemplateSwitch = useCallback((templateId: string) => {
    // Copy image to target template if it has no image yet
    const sourceImage = imageDataUrl || bannerImageDataUrl || fixturesImageDataUrl || halftimeImageDataUrl;
    if (templateId === 'market-banner' && sourceImage && !bannerImageDataUrl) {
      setBannerImageDataUrl(sourceImage);
    } else if (templateId === 'logo-overlay' && sourceImage && !imageDataUrl) {
      setImageDataUrl(sourceImage);
    } else if (templateId === 'soccer-fixtures' && sourceImage && !fixturesImageDataUrl) {
      setFixturesImageDataUrl(sourceImage);
    } else if (templateId === 'halftime-score' && sourceImage && !halftimeImageDataUrl) {
      setHalftimeImageDataUrl(sourceImage);
    }
    setActiveTemplate(templateId);
    setZoomLevel(1);
    setActiveTab('editor');
    setPreviewDataUrl(null);
  }, [imageDataUrl, bannerImageDataUrl, fixturesImageDataUrl]);

  useEffect(() => {
    return () => {
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
    };
  }, []);

  return (
    <div className="flex h-screen">
      {/* Main content area */}
      <div className="relative flex-1 flex flex-col p-4 gap-4">
        {/* Header + Tabs */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center">
            <svg width="156" height="21" viewBox="0 0 1164 157" fill="none">
              <g clipPath="url(#btl_clip)">
                <path d="M41.0985 79.3253L120.027 66.8472L123.791 59.2217L0 17.4301L30.9972 44.0698L8.71485 156.769L41.0985 79.3253Z" fill="white"/>
                <path d="M135.679 77.3443L56.7501 89.9214L52.9868 97.4479L176.777 139.339L145.78 112.6L168.062 0L135.679 77.3443Z" fill="white"/>
              </g>
              <path d="M276.996 43.7298C283.946 43.7298 289.263 45.0504 292.947 47.6916C296.631 50.3328 298.473 54.9897 298.473 61.6623C298.473 64.5815 298.195 67.0837 297.639 69.1689C297.152 71.1845 296.214 72.7832 294.824 73.9648C293.503 75.1464 292.252 75.9457 291.07 76.3627C289.958 76.7797 288.36 77.2663 286.275 77.8223C291.905 78.7259 295.797 80.1508 297.952 82.0969C300.106 84.0431 301.184 87.7616 301.184 93.2526C301.184 100.968 299.307 106.25 295.554 109.1C291.87 111.88 286.031 113.27 278.038 113.27H211V43.7298H276.996ZM277.1 64.79C277.1 62.4268 276.405 60.8629 275.015 60.0984C273.694 59.3338 271.713 58.9515 269.072 58.9515H232.164V71.0455H268.655C271.435 71.0455 273.52 70.6632 274.91 69.8987C276.37 69.1341 277.1 67.4312 277.1 64.79ZM279.915 90.7504C279.915 88.8737 279.289 87.4141 278.038 86.3715C276.857 85.3289 274.493 84.8076 270.949 84.8076H232.164V97.5272H270.636C273.069 97.5272 275.223 97.2839 277.1 96.7974C278.977 96.2413 279.915 94.2257 279.915 90.7504Z" fill="white"/>
              <path d="M382.65 43.7298C390.991 43.7298 396.934 45.3632 400.478 48.63C404.093 51.8272 405.9 57.5267 405.9 65.7283C405.9 68.8561 405.726 71.5321 405.378 73.7562C405.031 75.9804 404.336 77.9266 403.293 79.5947C402.251 81.1933 401.034 82.4097 399.644 83.2438C398.254 84.0083 395.335 85.1204 390.887 86.58C395.752 87.2056 399.331 88.4567 401.625 90.3333C403.919 92.1405 405.066 95.3377 405.066 99.9251V113.27H383.588V106.598C383.588 103.192 383.276 100.481 382.65 98.4655C382.094 96.4498 379.349 95.442 374.414 95.442H339.07V113.27H317.906V43.7298H382.65ZM373.788 78.5521C378.584 78.5521 381.573 77.9613 382.754 76.7797C383.936 75.5981 384.527 72.9569 384.527 68.8561C384.527 66.5624 384.284 64.8595 383.797 63.7474C383.38 62.6353 382.442 61.8708 380.982 61.4537C379.592 61.0367 378.445 60.7934 377.541 60.7239C376.638 60.6544 375.561 60.6197 374.309 60.6197H339.07V78.5521H373.788Z" fill="white"/>
              <path d="M441.321 113.27H417.758L456.542 43.7298H485.109L523.059 113.27H499.705L493.137 100.655H448.202L441.321 113.27ZM455.604 86.2673H485.422L470.513 58.743L455.604 86.2673Z" fill="white"/>
              <path d="M597.307 113.27L555.395 61.0367V113.27H535.482V43.7298H569.157L611.069 95.859V43.7298H630.982V113.27H597.307Z" fill="white"/>
              <path d="M710.413 43.7298C722.994 43.7298 731.439 45.815 735.748 49.9853C740.058 54.1557 742.212 62.4963 742.212 75.0073V83.0352C742.212 86.302 742.143 88.5957 742.004 89.9163C741.934 91.2369 741.552 93.9476 740.857 98.0485C740.162 102.08 737.764 105.625 733.663 108.683C729.562 111.741 724.419 113.27 718.233 113.27H649.109V43.7298H710.413ZM720.839 78.7606V78.1351C720.839 71.3235 720.075 66.7362 718.546 64.373C717.016 62.0098 712.916 60.8282 706.243 60.8282H670.274V96.2761H705.93C712.464 96.2761 716.565 95.0597 718.233 92.627C719.97 90.1943 720.839 85.5722 720.839 78.7606Z" fill="white"/>
              <path d="M809.64 113.27V61.141H778.571V43.7298H861.769V61.141H830.804V113.27H809.64Z" fill="white"/>
              <path d="M918.442 43L935.332 43.1043C947.704 43.1043 956.149 45.1547 960.667 49.2555C965.254 53.3563 967.548 61.558 967.548 73.8605V77.1968C967.548 91.6539 965.741 101.35 962.127 106.285C958.512 111.15 949.372 113.583 934.707 113.583L918.755 113.896L912.083 114L897.695 113.479C889.632 113.479 883.412 111.672 879.033 108.057C874.654 104.373 872.464 98.4655 872.464 90.3333L872.256 77.5095C872.256 63.3999 874.063 54.1904 877.677 49.8811C881.292 45.5022 889.876 43.3128 903.429 43.3128L918.442 43ZM906.974 96.6931L918.338 96.9016L929.181 96.7974C935.159 96.7974 939.433 96.1718 942.005 94.9207C944.646 93.6001 945.967 90.4028 945.967 85.3289L946.175 75.9457C946.175 72.7484 945.967 70.0377 945.55 67.8135C945.202 65.5198 944.438 63.8517 943.256 62.8091C942.074 61.697 940.302 60.9672 937.939 60.6197C935.645 60.2721 933.178 60.0984 930.536 60.0984L909.476 60.2026C904.68 60.2026 901.031 60.6892 898.529 61.6623C896.027 62.6353 894.567 64.7205 894.15 67.9178C893.803 71.0455 893.629 73.652 893.629 75.7372V80.4288C893.629 86.8233 894.359 91.1326 895.818 93.3568C897.347 95.581 901.066 96.6931 906.974 96.6931Z" fill="white"/>
              <path d="M1029.01 43L1045.9 43.1043C1058.28 43.1043 1066.72 45.1547 1071.24 49.2555C1075.83 53.3563 1078.12 61.558 1078.12 73.8605V77.1968C1078.12 91.6539 1076.31 101.35 1072.7 106.285C1069.08 111.15 1059.94 113.583 1045.28 113.583L1029.33 113.896L1022.65 114L1008.27 113.479C1000.2 113.479 993.983 111.672 989.604 108.057C985.225 104.373 983.035 98.4655 983.035 90.3333L982.827 77.5095C982.827 63.3999 984.634 54.1904 988.248 49.8811C991.863 45.5022 1000.45 43.3128 1014 43.3128L1029.01 43ZM1017.54 96.6931L1028.91 96.9016L1039.75 96.7974C1045.73 96.7974 1050 96.1718 1052.58 94.9207C1055.22 93.6001 1056.54 90.4028 1056.54 85.3289L1056.75 75.9457C1056.75 72.7484 1056.54 70.0377 1056.12 67.8135C1055.77 65.5198 1055.01 63.8517 1053.83 62.8091C1052.65 61.697 1050.87 60.9672 1048.51 60.6197C1046.22 60.2721 1043.75 60.0984 1041.11 60.0984L1020.05 60.2026C1015.25 60.2026 1011.6 60.6892 1009.1 61.6623C1006.6 62.6353 1005.14 64.7205 1004.72 67.9178C1004.37 71.0455 1004.2 73.652 1004.2 75.7372V80.4288C1004.2 86.8233 1004.93 91.1326 1006.39 93.3568C1007.92 95.581 1011.64 96.6931 1017.54 96.6931Z" fill="white"/>
              <path d="M1163.98 95.859V113.27H1094.75V43.7298H1115.92V95.859H1163.98Z" fill="white"/>
              <defs>
                <clipPath id="btl_clip">
                  <rect width="176.773" height="156.768" fill="white"/>
                </clipPath>
              </defs>
            </svg>
          </div>
          <div className="flex justify-center gap-1 border-b border-pred-border">
            {(['editor', 'preview'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`
                  px-3 pb-2 text-[11px] font-medium uppercase tracking-wider transition-colors
                  ${activeTab === tab
                    ? 'text-white border-b-2 border-white -mb-px'
                    : 'text-white/40 hover:text-white/70'
                  }
                `}
              >
                {tab === 'editor' ? 'Editor' : 'Tweet Preview'}
              </button>
            ))}
          </div>
        </div>

        {/* Canvas — render both but only show active */}
        <div className="flex-1 flex flex-col relative">
          {activeTemplate === 'logo-overlay' && (
            <LogoCanvas
              ref={logoCanvasRef}
              imageDataUrl={imageDataUrl}
              constraints={constraints}
              logoVariant={logoVariant}
              cropRatio={cropRatio}
              onZoomChange={setZoomLevel}
              onCanvasUpdate={handleCanvasUpdate}
            />
          )}

          {activeTemplate === 'market-banner' && (
            <MarketBannerCanvas
              ref={bannerCanvasRef}
              fields={bannerFields}
              imageDataUrl={bannerImageDataUrl}
              onZoomChange={setZoomLevel}
              onCanvasUpdate={handleCanvasUpdate}
            />
          )}

          {activeTemplate === 'soccer-fixtures' && (
            <SoccerFixturesCanvas
              ref={fixturesCanvasRef}
              fields={fixturesFields}
              imageDataUrl={fixturesImageDataUrl}
              onZoomChange={setZoomLevel}
              onCanvasUpdate={handleCanvasUpdate}
            />
          )}

          {activeTemplate === 'halftime-score' && (
            <HalftimeScoreCanvas
              ref={halftimeCanvasRef}
              fields={halftimeFields}
              imageDataUrl={halftimeImageDataUrl}
              onZoomChange={setZoomLevel}
              onCanvasUpdate={handleCanvasUpdate}
            />
          )}

          {/* Zoom bar — only visible in editor mode with image */}
          {activeTab === 'editor' && activeImageDataUrl && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-pred-surface/80 backdrop-blur-sm border border-pred-border rounded-full px-1.5 py-1 opacity-0 hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={() => getActiveCanvas()?.zoomTo(Math.max(1, zoomLevel - 0.5))}
                className="w-6 h-6 flex items-center justify-center rounded-full text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors text-xs"
              >
                −
              </button>
              <span className="text-[11px] text-white/60 w-10 text-center tabular-nums select-none">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => getActiveCanvas()?.zoomTo(Math.min(5, zoomLevel + 0.5))}
                className="w-6 h-6 flex items-center justify-center rounded-full text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors text-xs"
              >
                +
              </button>
              <div className="w-px h-3.5 bg-pred-border mx-0.5" />
              <button
                onClick={() => getActiveCanvas()?.resetFraming()}
                title="Reset framing"
                className="w-6 h-6 flex items-center justify-center rounded-full text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors text-xs"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 1 9 9" />
                  <polyline points="1 17 3 21 7 19" />
                </svg>
              </button>
            </div>
          )}

          {/* Twitter Preview */}
          {activeTab === 'preview' && (
            <div className="absolute inset-0 z-10 flex flex-col">
              <TwitterPreview
                imageDataUrl={previewDataUrl}
                caption={caption}
              />
            </div>
          )}
        </div>

        {/* Export toast */}
        <div
          className={`
            absolute bottom-8 left-1/2 -translate-x-1/2
            px-4 py-2 rounded-full
            bg-pred-surface/90 backdrop-blur-sm
            text-xs text-white/80
            transition-all duration-300 pointer-events-none
            ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
          `}
        >
          {toastMessage}
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-72 border-l border-pred-border bg-pred-black p-5 flex flex-col gap-6 overflow-y-auto">
        {/* Template selector */}
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-white/50 mb-2">
            Template
          </p>
          <div className="flex gap-1 bg-pred-surface rounded-md p-0.5">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => handleTemplateSwitch(t.id)}
                className={`
                  flex-1 h-7 rounded text-[11px] font-semibold uppercase tracking-wider transition-all
                  ${activeTemplate === t.id
                    ? 'bg-white/10 text-white'
                    : 'text-white/40 hover:text-white/60'
                  }
                `}
              >
                {t.id === 'logo-overlay' ? 'Logo' : t.id === 'market-banner' ? 'Banner' : t.id === 'soccer-fixtures' ? 'Fixtures' : 'Halftime'}
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-pred-border" />

        {/* Template-specific controls */}
        {activeTemplate === 'logo-overlay' ? (
          <>
            <ImageUpload
              onImageUpload={handleImageUpload}
              hasImage={!!imageDataUrl}
              imageInfo={imageInfo}
            />

            <div className="h-px bg-pred-border" />

            <CropSelector
              selectedId={cropId}
              onChange={(ratio, id) => { setCropRatio(ratio); setCropId(id); }}
              disabled={!imageDataUrl}
            />

            <div className="h-px bg-pred-border" />

            <LogoSelector
              selectedId={logoVariant.id}
              onChange={setLogoVariant}
              disabled={!imageDataUrl}
            />

            <div className="h-px bg-pred-border" />

            <ConstraintPanel
              constraints={constraints}
              onChange={setConstraints}
              disabled={!imageDataUrl}
            />
          </>
        ) : activeTemplate === 'market-banner' ? (
          <>
            <ImageUpload
              onImageUpload={handleImageUpload}
              hasImage={!!bannerImageDataUrl}
              imageInfo={bannerImageInfo}
            />

            <div className="h-px bg-pred-border" />

            <MarketBannerSidebar
              fields={bannerFields}
              onChange={setBannerFields}
            />
          </>
        ) : activeTemplate === 'soccer-fixtures' ? (
          <>
            <ImageUpload
              onImageUpload={handleImageUpload}
              hasImage={!!fixturesImageDataUrl}
              imageInfo={fixturesImageInfo}
            />

            <div className="h-px bg-pred-border" />

            <SoccerFixturesSidebar
              fields={fixturesFields}
              onChange={setFixturesFields}
            />
          </>
        ) : (
          <>
            <ImageUpload
              onImageUpload={handleImageUpload}
              hasImage={!!halftimeImageDataUrl}
              imageInfo={halftimeImageInfo}
            />

            <div className="h-px bg-pred-border" />

            <HalftimeScoreSidebar
              fields={halftimeFields}
              onChange={setHalftimeFields}
            />
          </>
        )}

        <div className="h-px bg-pred-border" />

        <ExportButton
          format={exportFormat}
          onFormatChange={setExportFormat}
          onExport={handleExport}
          onCopy={handleCopy}
          disabled={!hasContent}
        />

        {/* Tweet Caption */}
        <div className={!hasContent ? 'opacity-40 pointer-events-none' : ''}>
          <p className="text-[11px] font-medium uppercase tracking-wider text-white/50 mb-2">
            Tweet Caption
          </p>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write your caption..."
            rows={3}
            className="w-full bg-pred-surface border border-pred-border rounded-md px-3 py-2 text-sm text-white/90 placeholder:text-white/30 resize-none focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>

        <div className="mt-auto pt-4 border-t border-pred-border">
          <p className="text-[10px] text-pred-grey/40 uppercase tracking-wider">Pred v0</p>
        </div>
      </div>
    </div>
  );
}
