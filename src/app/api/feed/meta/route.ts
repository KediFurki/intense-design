import { and, desc, gt, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getLocaleValue } from "@/lib/i18n/get-locale-value";
import { db } from "@/server/db";
import { products } from "@/server/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeBaseUrl(url: string | undefined, fallback = ""): string {
  return (url?.trim() || fallback).replace(/\/$/, "");
}

function escapeXML(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function resolveAbsoluteUrl(path: string | null | undefined, baseUrl: string): string {
  const normalizedPath = path?.trim();

  if (!normalizedPath) {
    return "";
  }

  if (
    normalizedPath.startsWith("http://") ||
    normalizedPath.startsWith("https://")
  ) {
    return normalizedPath;
  }

  if (normalizedPath.startsWith("//")) {
    return `https:${normalizedPath}`;
  }

  if (!baseUrl) {
    return "";
  }

  return `${baseUrl}/${normalizedPath.replace(/^\/+/, "")}`;
}

function formatPrice(priceInCents: number): string {
  return `${(priceInCents / 100).toFixed(2)} EUR`;
}

export async function GET() {
  try {
    const appUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL, "http://localhost:3000");
    const bunnyUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_BUNNY_URL);

    const catalogProducts = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        slug: products.slug,
        price: products.price,
        stock: products.stock,
        images: products.images,
      })
      .from(products)
      .where(and(gt(products.price, 0), ne(products.slug, "")))
      .orderBy(desc(products.updatedAt), desc(products.createdAt));

    const itemsXml = catalogProducts
      .flatMap((product) => {
        const primaryImage = Array.isArray(product.images)
          ? product.images.find((image): image is string => typeof image === "string" && image.trim().length > 0)
          : undefined;

        const imageLink = resolveAbsoluteUrl(primaryImage, bunnyUrl);
        if (!imageLink) {
          return [];
        }

        const title = getLocaleValue(product.name, "en") || product.slug;
        const description = getLocaleValue(product.description, "en") || title;
        const availability = product.stock > 0 ? "in stock" : "out of stock";
        const productLink = `${appUrl}/en/product/${encodeURIComponent(product.slug)}`;

        return [
          `\n    <item>\n      <g:id>${escapeXML(product.id)}</g:id>\n      <g:title>${escapeXML(title)}</g:title>\n      <g:description>${escapeXML(description)}</g:description>\n      <g:link>${escapeXML(productLink)}</g:link>\n      <g:image_link>${escapeXML(imageLink)}</g:image_link>\n      <g:availability>${availability}</g:availability>\n      <g:condition>new</g:condition>\n      <g:price>${formatPrice(product.price)}</g:price>\n    </item>`,
        ];
      })
      .join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n  <channel>\n    <title>${escapeXML("Intense Design Product Feed")}</title>\n    <link>${escapeXML(appUrl)}</link>\n    <description>${escapeXML("Facebook Meta catalog feed for Intense Design products")}</description>${itemsXml}\n  </channel>\n</rss>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    console.error("Failed to generate Meta product feed", error);

    return NextResponse.json(
      { error: "Failed to generate Meta product feed" },
      { status: 500 },
    );
  }
}