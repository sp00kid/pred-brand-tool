'use client';

import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle, useState } from 'react';
import * as fabric from 'fabric';
import type { LogoConstraints, LogoVariant } from '@/lib/constraints';
import { calculateLogoPosition } from '@/lib/constraints';
import { calculateCropDimensions } from '@/lib/crop';

interface LogoCanvasProps {
  imageDataUrl: string | null;
  constraints: LogoConstraints;
  logoVariant: LogoVariant;
  cropRatio: number | null;
  onZoomChange?: (zoom: number) => void;
  onCanvasUpdate?: () => void;
}

export interface LogoCanvasHandle {
  exportPng: () => string | null;
  resetFraming: () => void;
  zoomTo: (level: number) => void;
  getPreview: () => string | null;
}

function clampImagePosition(img: fabric.FabricImage, canvasW: number, canvasH: number) {
  const imgW = img.getScaledWidth();
  const imgH = img.getScaledHeight();

  let left = img.left!;
  let top = img.top!;

  left = Math.min(0, left);
  left = Math.max(canvasW - imgW, left);

  top = Math.min(0, top);
  top = Math.max(canvasH - imgH, top);

  img.set({ left, top });
}

const LogoCanvas = forwardRef<LogoCanvasHandle, LogoCanvasProps>(
  function LogoCanvas({ imageDataUrl, constraints, logoVariant, cropRatio, onZoomChange, onCanvasUpdate }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasElRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<fabric.Canvas | null>(null);
    const bgImageRef = useRef<fabric.FabricImage | null>(null);
    const logoRef = useRef<fabric.FabricImage | null>(null);
    const originalDimsRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
    const cropDimsRef = useRef<{ cropW: number; cropH: number }>({ cropW: 0, cropH: 0 });
    const displayScaleRef = useRef<number>(1);
    const userZoomRef = useRef<number>(1);
    const [containerSize, setContainerSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

    // Track container size with ResizeObserver
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const ro = new ResizeObserver((entries) => {
        const { width, height } = entries[0].contentRect;
        setContainerSize({ w: width, h: height });
      });
      ro.observe(container);
      return () => ro.disconnect();
    }, []);

    // Initialize Fabric canvas
    useEffect(() => {
      if (!canvasElRef.current || fabricRef.current) return;

      const canvas = new fabric.Canvas(canvasElRef.current, {
        backgroundColor: '#141414',
        selection: false,
      });
      fabricRef.current = canvas;

      // Constrain background image on drag
      canvas.on('object:moving', (e) => {
        if (e.target === bgImageRef.current) {
          clampImagePosition(e.target as fabric.FabricImage, canvas.getWidth(), canvas.getHeight());
        }
      });

      // Notify parent when drag ends (for live preview updates)
      canvas.on('mouse:up', () => {
        onCanvasUpdate?.();
      });

      return () => {
        canvas.dispose();
        fabricRef.current = null;
      };
    }, []);

    // Scroll-to-zoom on the canvas element
    useEffect(() => {
      const canvasEl = canvasElRef.current;
      if (!canvasEl) return;

      // Get the Fabric wrapper element (canvas is wrapped by Fabric)
      const wrapper = canvasEl.parentElement;
      if (!wrapper) return;

      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();

        const canvas = fabricRef.current;
        const bg = bgImageRef.current;
        if (!canvas || !bg || !originalDimsRef.current.width) return;

        const delta = e.deltaY;
        const currentZoom = userZoomRef.current;
        const newZoom = Math.min(5.0, Math.max(1.0, currentZoom * (1 - delta * 0.001)));

        if (newZoom === currentZoom) return;

        // Get mouse position relative to canvas
        const rect = wrapper.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Zoom toward cursor: adjust position so point under cursor stays fixed
        const oldScale = displayScaleRef.current * currentZoom;
        const newScale = displayScaleRef.current * newZoom;

        const bgLeft = bg.left!;
        const bgTop = bg.top!;

        const newLeft = mouseX - (mouseX - bgLeft) * (newScale / oldScale);
        const newTop = mouseY - (mouseY - bgTop) * (newScale / oldScale);

        userZoomRef.current = newZoom;
        bg.set({
          scaleX: newScale,
          scaleY: newScale,
          left: newLeft,
          top: newTop,
        });

        clampImagePosition(bg, canvas.getWidth(), canvas.getHeight());
        canvas.requestRenderAll();
        onZoomChange?.(newZoom);
      };

      wrapper.addEventListener('wheel', handleWheel, { passive: false });
      return () => wrapper.removeEventListener('wheel', handleWheel);
    }, []);

    // Fit canvas whenever container resizes or image changes
    const fitCanvas = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas || !containerSize.w || !originalDimsRef.current.width) return;

      const { width: imgW, height: imgH } = originalDimsRef.current;
      const { w: containerW, h: containerH } = containerSize;

      // Compute crop dimensions
      const { cropW, cropH } = calculateCropDimensions(imgW, imgH, cropRatio);
      cropDimsRef.current = { cropW, cropH };

      const pad = 32;
      const availW = containerW - pad * 2;
      const availH = containerH - pad * 2;

      // Fit the CROP rect into the available space, not the full image
      const displayScale = Math.min(availW / cropW, availH / cropH, 1);
      displayScaleRef.current = displayScale;

      const displayW = Math.round(cropW * displayScale);
      const displayH = Math.round(cropH * displayScale);

      canvas.setDimensions({ width: displayW, height: displayH });

      // Scale background image — apply both display scale and user zoom
      const bg = bgImageRef.current;
      if (bg) {
        const combinedScale = displayScale * userZoomRef.current;
        bg.set({ scaleX: combinedScale, scaleY: combinedScale });

        // Center the bg image in the canvas when crop is active and zoom is 1
        if (cropRatio !== null && userZoomRef.current === 1) {
          const bgScaledW = imgW * combinedScale;
          const bgScaledH = imgH * combinedScale;
          bg.set({
            left: (displayW - bgScaledW) / 2,
            top: (displayH - bgScaledH) / 2,
          });
        }

        clampImagePosition(bg, displayW, displayH);
      }

      canvas.requestRenderAll();
    }, [containerSize, cropRatio]);

    // Load image when dataUrl changes
    useEffect(() => {
      const canvas = fabricRef.current;
      if (!canvas || !imageDataUrl) return;

      let cancelled = false;

      (async () => {
        // Clear previous
        canvas.clear();
        bgImageRef.current = null;
        logoRef.current = null;
        userZoomRef.current = 1;

        // Load background image
        const img = await fabric.FabricImage.fromURL(imageDataUrl);
        if (cancelled) return;

        const imgW = img.width!;
        const imgH = img.height!;
        originalDimsRef.current = { width: imgW, height: imgH };

        img.set({
          selectable: true,
          evented: true,
          hasControls: false,
          hasBorders: false,
          lockRotation: true,
          hoverCursor: 'grab',
          moveCursor: 'grabbing',
          originX: 'left',
          originY: 'top',
          left: 0,
          top: 0,
        });
        canvas.add(img);
        bgImageRef.current = img;

        // Load logo
        const logo = await fabric.FabricImage.fromURL(logoVariant.path);
        if (cancelled) return;

        logoRef.current = logo;
        logo.set({
          selectable: false,
          evented: false,
          originX: 'left',
          originY: 'top',
        });
        canvas.add(logo);

        // Fit canvas first (sets displayScale), then position logo
        fitCanvas();
        updateLogoPosition(constraints);
        onZoomChange?.(1);
      })();

      return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imageDataUrl]);

    // Reload logo when logoPath changes (without reloading the background image)
    useEffect(() => {
      const canvas = fabricRef.current;
      if (!canvas || !bgImageRef.current) return;

      let cancelled = false;

      (async () => {
        // Remove old logo
        if (logoRef.current) {
          canvas.remove(logoRef.current);
          logoRef.current = null;
        }

        const logo = await fabric.FabricImage.fromURL(logoVariant.path);
        if (cancelled) return;

        logoRef.current = logo;
        logo.set({
          selectable: false,
          evented: false,
          originX: 'left',
          originY: 'top',
        });
        canvas.add(logo);
        updateLogoPosition(constraints);
        onCanvasUpdate?.();  // re-capture preview now that logo is loaded
      })();

      return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [logoVariant]);

    // Reset zoom and refit when crop ratio changes
    useEffect(() => {
      if (!originalDimsRef.current.width) return;
      userZoomRef.current = 1;
      fitCanvas();
      updateLogoPosition(constraints);
      onZoomChange?.(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cropRatio]);

    // Update logo position when constraints change
    const updateLogoPosition = useCallback((c: LogoConstraints) => {
      const canvas = fabricRef.current;
      const logo = logoRef.current;
      if (!canvas || !logo || !originalDimsRef.current.width) return;

      // Use crop dimensions for logo positioning so logo is relative to visible crop area
      const { cropW, cropH } = cropDimsRef.current.cropW
        ? cropDimsRef.current
        : calculateCropDimensions(originalDimsRef.current.width, originalDimsRef.current.height, cropRatio);

      const logoNativeW = logo.width!;
      const logoNativeH = logo.height!;

      // Compute in crop-space
      const scaledLogoWidth = cropW * c.logoScale;
      const scale = scaledLogoWidth / logoNativeW;
      const { left, top } = calculateLogoPosition(cropW, cropH, logoNativeW, logoNativeH, c, logoVariant.opticalInsets);

      // Transform to display space
      const ds = displayScaleRef.current;
      logo.set({
        scaleX: scale * ds,
        scaleY: scale * ds,
        left: left * ds,
        top: top * ds,
        opacity: c.opacity,
      });

      canvas.requestRenderAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cropRatio, logoVariant]);

    // Refit canvas when container/crop changes (expensive, runs rarely)
    useEffect(() => {
      fitCanvas();
      updateLogoPosition(constraints);
    }, [fitCanvas]);

    // Reposition logo when constraints change (cheap, runs on every slider tick)
    useEffect(() => {
      updateLogoPosition(constraints);
    }, [constraints, updateLogoPosition]);

    // Export at original resolution by inverting the display scale
    useImperativeHandle(ref, () => ({
      exportPng: () => {
        const canvas = fabricRef.current;
        if (!canvas || !originalDimsRef.current.width) return null;

        const multiplier = 1 / displayScaleRef.current;

        const dataUrl = canvas.toDataURL({
          format: 'png',
          multiplier,
          width: canvas.getWidth(),
          height: canvas.getHeight(),
        });

        return dataUrl;
      },
      resetFraming: () => {
        const canvas = fabricRef.current;
        const bg = bgImageRef.current;
        if (!canvas || !bg) return;

        userZoomRef.current = 1;
        const ds = displayScaleRef.current;
        const { width: imgW, height: imgH } = originalDimsRef.current;
        const canvasW = canvas.getWidth();
        const canvasH = canvas.getHeight();

        // Center the image within the crop
        const bgScaledW = imgW * ds;
        const bgScaledH = imgH * ds;
        bg.set({
          scaleX: ds,
          scaleY: ds,
          left: (canvasW - bgScaledW) / 2,
          top: (canvasH - bgScaledH) / 2,
        });
        clampImagePosition(bg, canvasW, canvasH);
        canvas.requestRenderAll();
        onZoomChange?.(1);
      },
      zoomTo: (level: number) => {
        const canvas = fabricRef.current;
        const bg = bgImageRef.current;
        if (!canvas || !bg || !originalDimsRef.current.width) return;

        const clamped = Math.min(5.0, Math.max(1.0, level));
        const currentZoom = userZoomRef.current;
        if (clamped === currentZoom) return;

        const oldScale = displayScaleRef.current * currentZoom;
        const newScale = displayScaleRef.current * clamped;

        // Zoom toward canvas center
        const cx = canvas.getWidth() / 2;
        const cy = canvas.getHeight() / 2;

        const bgLeft = bg.left!;
        const bgTop = bg.top!;

        const newLeft = cx - (cx - bgLeft) * (newScale / oldScale);
        const newTop = cy - (cy - bgTop) * (newScale / oldScale);

        userZoomRef.current = clamped;
        bg.set({
          scaleX: newScale,
          scaleY: newScale,
          left: newLeft,
          top: newTop,
        });

        clampImagePosition(bg, canvas.getWidth(), canvas.getHeight());
        canvas.requestRenderAll();
        onZoomChange?.(clamped);
      },
      getPreview: () => {
        const canvas = fabricRef.current;
        if (!canvas || !originalDimsRef.current.width) return null;

        return canvas.toDataURL({
          format: 'png',
          multiplier: 1,  // display-res only — full-res export uses exportPng()
          width: canvas.getWidth(),
          height: canvas.getHeight(),
        });
      },
    }), [onZoomChange]);

    return (
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center bg-[#111111] overflow-hidden rounded-lg relative"
      >
        {!imageDataUrl && (
          <p className="text-pred-grey text-sm absolute">Upload an image to get started</p>
        )}
        <canvas ref={canvasElRef} />
      </div>
    );
  }
);

export default LogoCanvas;
