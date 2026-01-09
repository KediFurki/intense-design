"use client";

import "@google/model-viewer";
import { Box } from "lucide-react";

interface ModelViewerCoreProps {
  src: string;
  poster: string;
  alt: string;
}

const ModelViewerCore = ({ src, poster, alt }: ModelViewerCoreProps) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ModelViewerElement = "model-viewer" as any;

  return (
    <div className="w-full h-full relative">
      <ModelViewerElement
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