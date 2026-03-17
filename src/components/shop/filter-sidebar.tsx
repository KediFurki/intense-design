"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { PackageCheck, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

interface FilterSidebarProps {
  className?: string;
}

interface PresetLinkProps {
  label: string;
  pMin: string;
  pMax: string;
  isActive: boolean;
  onSelect: (min: string, max: string) => void;
}

function PresetLink({ label, pMin, pMax, isActive, onSelect }: PresetLinkProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(pMin, pMax)}
      className={cn(
        "flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-sm transition-all",
        isActive
          ? "border-[#9a5f2f]/25 bg-[#fff6ec] text-[#8b5e34] shadow-sm"
          : "border-stone-200 bg-white text-slate-600 hover:border-stone-300 hover:bg-stone-50"
      )}
    >
      <span className="font-medium">{label}</span>
      <span className={cn("size-2 rounded-full", isActive ? "bg-[#9a5f2f]" : "bg-stone-300")} />
    </button>
  );
}

function FilterContent({ className }: FilterSidebarProps) {
  const t = useTranslations("Category");
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentMin = searchParams.get("min");
  const currentMax = searchParams.get("max");
  const currentInstock = searchParams.get("instock");
  const currentQuery = searchParams.get("q")?.trim() ?? "";

  const [min, setMin] = useState(currentMin || "");
  const [max, setMax] = useState(currentMax || "");
  const [instock, setInstock] = useState(currentInstock === "true");

  useEffect(() => {
    // sadece farklıysa sync et (loop olmasın)
    if ((currentMin ?? "") !== min) setMin(currentMin ?? "");
    if ((currentMax ?? "") !== max) setMax(currentMax ?? "");
    if ((currentInstock === "true") !== instock) setInstock(currentInstock === "true");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMin, currentMax, currentInstock]);

  const applyFilter = useCallback(
    (customMin?: string, customMax?: string, customStock?: boolean) => {
      const params = new URLSearchParams(searchParams.toString());

      const targetMin = customMin !== undefined ? customMin : min;
      const targetMax = customMax !== undefined ? customMax : max;
      const targetStock = customStock !== undefined ? customStock : instock;

      if (targetMin) params.set("min", targetMin);
      else params.delete("min");

      if (targetMax) params.set("max", targetMax);
      else params.delete("max");

      if (targetStock) params.set("instock", "true");
      else params.delete("instock");

      const s = params.toString();
      router.push(s ? `?${s}` : "?");
    },
    [instock, max, min, router, searchParams]
  );

  const clearPriceOnly = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("min");
    params.delete("max");
    const s = params.toString();
    router.push(s ? `?${s}` : "?");
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("min");
    params.delete("max");
    params.delete("instock");
    const s = params.toString();
    router.push(s ? `?${s}` : "?");
  };

  const isLinkActive = (pMin: string, pMax: string) => {
    // link aktifliği sadece URL değerleriyle hesaplanmalı
    const urlMin = currentMin ?? "";
    const urlMax = currentMax ?? "";
    return urlMin === pMin && urlMax === pMax;
  };

  const isAllPricesActive = !currentMin && !currentMax;
  const activeFilterCount = [currentMin || currentMax, currentInstock === "true"].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0;
  const activePriceLabel = currentMin || currentMax
    ? `${currentMin || "0"}€ - ${currentMax || t("anyPrice")}`
    : null;
  const presets = [
    { label: t("underAmount", { amount: 200 }), pMin: "0", pMax: "200" },
    { label: t("betweenAmounts", { min: 200, max: 500 }), pMin: "200", pMax: "500" },
    { label: t("betweenAmounts", { min: 500, max: 1000 }), pMin: "500", pMax: "1000" },
    { label: t("aboveAmount", { amount: 1000 }), pMin: "1000", pMax: "1000000" },
  ];

  return (
    <div className={cn("space-y-6 rounded-[28px] border border-stone-200 bg-white p-5 shadow-[0_24px_60px_-32px_rgba(68,64,60,0.35)]", className)}>
      <div className="rounded-3xl border border-[#ecdcc7] bg-[linear-gradient(135deg,#fffaf3_0%,#f7efe3_100%)] p-5 text-slate-900">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="mb-2 inline-flex rounded-full bg-white/80 p-2 text-[#9a5f2f] shadow-sm">
              <SlidersHorizontal className="size-4" />
            </div>
            <h3 className="text-lg font-semibold">{t("filterTitle")}</h3>
            <p className="mt-1 text-sm text-slate-600">{t("filterDescription")}</p>
          </div>
          {hasActiveFilters ? (
            <Badge className="rounded-full bg-[#9a5f2f] text-white">
              {t("activeFilterCount", { count: activeFilterCount })}
            </Badge>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {currentQuery ? (
            <Badge variant="secondary" className="rounded-full border border-white/70 bg-white/80 px-3 py-1 text-slate-700">
              <Search className="mr-1 size-3.5" />
              {t("queryChip", { query: currentQuery })}
            </Badge>
          ) : null}

          {activePriceLabel ? (
            <Badge variant="secondary" className="rounded-full border border-white/70 bg-white/80 px-3 py-1 text-slate-700">
              <Sparkles className="mr-1 size-3.5" />
              {t("priceChip", { range: activePriceLabel })}
            </Badge>
          ) : null}

          {currentInstock === "true" ? (
            <Badge variant="secondary" className="rounded-full border border-white/70 bg-white/80 px-3 py-1 text-slate-700">
              <PackageCheck className="mr-1 size-3.5" />
              {t("inStockOnly")}
            </Badge>
          ) : null}

          {!currentQuery && !hasActiveFilters ? (
            <p className="text-sm text-slate-600">{t("filterIdle")}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="font-semibold text-slate-900">{t("priceRange")}</h4>
            <p className="text-sm text-slate-500">{t("priceRangeHint")}</p>
          </div>

          <button
            type="button"
            onClick={clearPriceOnly}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm transition-colors",
              isAllPricesActive
                ? "bg-[#f3e7d7] text-[#8b5e34]"
                : "bg-stone-100 text-slate-600 hover:bg-stone-200"
            )}
          >
            {t("allPrices")}
          </button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {presets.map((preset) => (
            <PresetLink
              key={`${preset.pMin}-${preset.pMax}`}
              label={preset.label}
              pMin={preset.pMin}
              pMax={preset.pMax}
              isActive={isLinkActive(preset.pMin, preset.pMax)}
              onSelect={applyFilter}
            />
          ))}
        </div>

        <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
          <div className="mb-3">
            <h5 className="font-medium text-slate-900">{t("customRange")}</h5>
            <p className="text-sm text-slate-500">{t("customRangeHint")}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-slate-400">{t("minPrice")}</Label>
              <div className="relative">
                <span className="absolute left-2 top-1.5 text-slate-400 text-xs">€</span>
                <Input
                  type="number"
                  value={min}
                  onChange={(e) => setMin(e.target.value)}
                  className="pl-5 h-8 text-sm"
                  placeholder="0"
                  min={0}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-slate-400">{t("maxPrice")}</Label>
              <div className="relative">
                <span className="absolute left-2 top-1.5 text-slate-400 text-xs">€</span>
                <Input
                  type="number"
                  value={max}
                  onChange={(e) => setMax(e.target.value)}
                  className="pl-5 h-8 text-sm"
                  placeholder={t("anyPrice")}
                  min={0}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-4">
        <div className="mb-4">
          <h4 className="font-semibold text-slate-900">{t("availability")}</h4>
          <p className="text-sm text-slate-500">{t("availabilityHint")}</p>
        </div>

        <div className="flex items-center space-x-3 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-3">
          <Checkbox
            id="instock"
            checked={instock}
            onCheckedChange={(checked) => {
              const val = checked === true;
              setInstock(val);
              applyFilter(undefined, undefined, val);
            }}
          />
          <label
            htmlFor="instock"
            className={cn(
              "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer",
              instock ? "text-[#8b5e34]" : "text-slate-700"
            )}
          >
            {t("inStockOnly")}
          </label>
        </div>

        <p className="mt-3 text-xs text-slate-500">{t("stockReady")}</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <Button
          type="button"
          variant="outline"
          onClick={clearAllFilters}
          className="h-11 cursor-pointer rounded-xl border-stone-300 bg-white text-slate-700 hover:bg-stone-50"
        >
          {t("clearFilters")}
        </Button>

        <Button
          type="button"
          onClick={() => applyFilter()}
          className="h-11 cursor-pointer rounded-xl bg-slate-900 hover:bg-slate-800"
        >
          {t("applyFilters")}
        </Button>
      </div>
    </div>
  );
}

export function FilterSidebar({ className }: FilterSidebarProps) {
  return (
    <Suspense fallback={<div className="p-4 border rounded-xl h-64 bg-slate-50 animate-pulse" />}>
      <FilterContent className={className} />
    </Suspense>
  );
}