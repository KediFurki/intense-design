"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

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
        "block text-sm text-left w-full transition-colors py-1.5 px-2 rounded-md",
        isActive ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-600 hover:bg-slate-50"
      )}
    >
      {label}
    </button>
  );
}

function FilterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentMin = searchParams.get("min");
  const currentMax = searchParams.get("max");
  const currentInstock = searchParams.get("instock");

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

  const isLinkActive = (pMin: string, pMax: string) => {
    // link aktifliği sadece URL değerleriyle hesaplanmalı
    const urlMin = currentMin ?? "";
    const urlMax = currentMax ?? "";
    return urlMin === pMin && urlMax === pMax;
  };

  const isAllPricesActive = !currentMin && !currentMax;

  return (
    <div className="space-y-8 border p-5 rounded-xl bg-white shadow-sm">
      {/* 1. PRICE RANGE */}
      <div>
        <h3 className="font-bold mb-4 text-slate-900">Price Range</h3>

        <div className="space-y-1 mb-6">
          <button
            type="button"
            onClick={clearPriceOnly}
            className={cn(
              "block text-sm text-left w-full py-1.5 px-2 rounded-md",
              isAllPricesActive
                ? "bg-blue-50 text-blue-700 font-semibold"
                : "text-slate-600 hover:bg-slate-50"
            )}
          >
            All Prices
          </button>

          <PresetLink
            label="Under €200"
            pMin="0"
            pMax="200"
            isActive={isLinkActive("0", "200")}
            onSelect={applyFilter}
          />
          <PresetLink
            label="€200 - €500"
            pMin="200"
            pMax="500"
            isActive={isLinkActive("200", "500")}
            onSelect={applyFilter}
          />
          <PresetLink
            label="€500 - €1,000"
            pMin="500"
            pMax="1000"
            isActive={isLinkActive("500", "1000")}
            onSelect={applyFilter}
          />
          <PresetLink
            label="€1,000+"
            pMin="1000"
            pMax="1000000"
            isActive={isLinkActive("1000", "1000000")}
            onSelect={applyFilter}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">Min</Label>
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
            <Label className="text-xs text-slate-400">Max</Label>
            <div className="relative">
              <span className="absolute left-2 top-1.5 text-slate-400 text-xs">€</span>
              <Input
                type="number"
                value={max}
                onChange={(e) => setMax(e.target.value)}
                className="pl-5 h-8 text-sm"
                placeholder="Any"
                min={0}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. AVAILABILITY */}
      <div>
        <h3 className="font-bold mb-4 text-slate-900">Availability</h3>
        <div className="flex items-center space-x-2">
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
              instock ? "text-blue-700" : "text-slate-700"
            )}
          >
            In Stock Only
          </label>
        </div>
      </div>

      <Button
        type="button"
        onClick={() => applyFilter()}
        className="w-full cursor-pointer h-10 bg-slate-900 hover:bg-slate-800"
      >
        Apply Filter
      </Button>
    </div>
  );
}

export function FilterSidebar() {
  return (
    <Suspense fallback={<div className="p-4 border rounded-xl h-64 bg-slate-50 animate-pulse" />}>
      <FilterContent />
    </Suspense>
  );
}