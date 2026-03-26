import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const BUNNY_STORAGE_API_KEY = process.env.BUNNY_STORAGE_API_KEY!;
const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE!;
const BUNNY_STORAGE_REGION = process.env.BUNNY_STORAGE_REGION || "";
const BUNNY_CDN_URL = process.env.NEXT_PUBLIC_BUNNY_URL!;

function getStorageHost() {
  if (!BUNNY_STORAGE_REGION || BUNNY_STORAGE_REGION === "de") {
    return "storage.bunnycdn.com";
  }
  return `${BUNNY_STORAGE_REGION}.storage.bunnycdn.com`;
}

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
];

const ALLOWED_MODEL_TYPES = [
  "model/gltf-binary",
  "application/octet-stream",
];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_MODEL_SIZE = 50 * 1024 * 1024; // 50 MB

export async function POST(req: NextRequest) {
  // Auth check — only logged-in users can upload
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!BUNNY_STORAGE_API_KEY) {
    return NextResponse.json(
      { error: "Bunny.net storage is not configured" },
      { status: 500 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const folder = formData.get("folder") as string | null; // e.g. "products", "categories"

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Determine upload type from file extension
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const isModel = ["glb", "gltf"].includes(ext);

  // Validate file type
  if (isModel) {
    if (!ALLOWED_MODEL_TYPES.includes(file.type) && !file.name.endsWith(".glb") && !file.name.endsWith(".gltf")) {
      return NextResponse.json({ error: "Invalid model file type" }, { status: 400 });
    }
    if (file.size > MAX_MODEL_SIZE) {
      return NextResponse.json({ error: "Model file too large (max 50MB)" }, { status: 400 });
    }
  } else {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid image file type" }, { status: 400 });
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: "Image file too large (max 10MB)" }, { status: 400 });
    }
  }

  // Build unique file name
  const timestamp = Date.now();
  const safeName = file.name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .toLowerCase();
  const uploadPath = folder
    ? `${folder}/${timestamp}-${safeName}`
    : `${timestamp}-${safeName}`;

  // Upload to Bunny.net Storage
  const storageHost = getStorageHost();
  const url = `https://${storageHost}/${BUNNY_STORAGE_ZONE}/${uploadPath}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      AccessKey: BUNNY_STORAGE_API_KEY,
      "Content-Type": "application/octet-stream",
    },
    body: buffer,
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Bunny.net upload failed:", response.status, text);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }

  // Return CDN URL
  const cdnUrl = `${BUNNY_CDN_URL}/${uploadPath}`;

  return NextResponse.json({ url: cdnUrl });
}
