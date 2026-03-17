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
  selectedColor?: string;
}

const bunnyBaseUrl = process.env.NEXT_PUBLIC_BUNNY_URL?.trim().replace(/\/$/, "");

function resolveMediaUrl(url: string): string {
  const normalizedUrl = url.trim();

  if (!normalizedUrl) {
    return "";
  }

  if (
    normalizedUrl.startsWith("http://") ||
    normalizedUrl.startsWith("https://") ||
    normalizedUrl.startsWith("//") ||
    normalizedUrl.startsWith("data:") ||
    normalizedUrl.startsWith("blob:")
  ) {
    return normalizedUrl;
  }

  if (!bunnyBaseUrl) {
    return normalizedUrl.startsWith("/") ? normalizedUrl : `/${normalizedUrl}`;
  }

  return `${bunnyBaseUrl}/${normalizedUrl.replace(/^\/+/, "")}`;
}

export default function ModelViewer(props: Readonly<ModelViewerProps>) {
  return (
    <ModelViewerCore
      {...props}
      src={resolveMediaUrl(props.src)}
      poster={resolveMediaUrl(props.poster)}
      selectedColor={props.selectedColor}
    />
  );
}