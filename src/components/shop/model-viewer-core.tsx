"use client";

import "@google/model-viewer";
import { useEffect, useRef } from "react";
import { Box } from "lucide-react";

interface ModelViewerCoreProps {
  src: string;
  poster: string;
  alt: string;
  selectedColor?: string;
}

function hexToBaseColorFactor(color: string): [number, number, number, number] | null {
  const normalized = color.trim();

  if (!normalized.startsWith("#")) {
    return null;
  }

  const hex = normalized.slice(1);
  const isShort = hex.length === 3;
  const isLong = hex.length === 6;

  if (!isShort && !isLong) {
    return null;
  }

  const expanded = isShort
    ? hex
        .split("")
        .map((segment) => `${segment}${segment}`)
        .join("")
    : hex;

  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);

  if ([red, green, blue].some((channel) => Number.isNaN(channel))) {
    return null;
  }

  return [red / 255, green / 255, blue / 255, 1];
}

const ModelViewerCore = ({ src, poster, alt, selectedColor }: ModelViewerCoreProps) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ModelViewerElement = "model-viewer" as any;
  const modelRef = useRef<any>(null);

  useEffect(() => {
    const viewer = modelRef.current;
    const baseColorFactor = selectedColor ? hexToBaseColorFactor(selectedColor) : null;

    if (!viewer || !baseColorFactor) {
      return;
    }

    const applySelectedColor = () => {
      const material = viewer?.model?.materials?.[0];

      material?.pbrMetallicRoughness?.setBaseColorFactor?.(baseColorFactor);
    };

    applySelectedColor();
    viewer.addEventListener?.("load", applySelectedColor);

    return () => {
      viewer.removeEventListener?.("load", applySelectedColor);
    };
  }, [selectedColor]);

  return (
    <div className="w-full h-full relative">
      <ModelViewerElement
        ref={modelRef}
        src={src}
        poster={poster}
        alt={alt}
        shadow-intensity="1"
        camera-controls
        auto-rotate
        ar
        ar-modes="webxr scene-viewer quick-look"
        style={{ width: "100%", height: "100%" }}
      >
        <button
          slot="ar-button"
          className="absolute bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 hover:bg-blue-700 transition-colors z-50 cursor-pointer"
        >
          <Box size={20} />
          View in AR
        </button>
      </ModelViewerElement>
    </div>
  );
};

export default ModelViewerCore;