"use client";

import dynamic from "next/dynamic";

// Asıl bileşeni (Core) burada dinamik olarak ve SSR KAPALI şekilde çağırıyoruz.
// Bu dosya "use client" olduğu için Next.js buna izin verir.
const ModelViewerCore = dynamic(() => import("./model-viewer-core"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
      Loading 3D Model...
    </div>
  ),
});

interface ModelViewerProps {
  src: string;
  poster: string;
  alt: string;
}

export default function ModelViewer(props: ModelViewerProps) {
  return <ModelViewerCore {...props} />;
}