"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function PrintOrderButton() {
  return (
    <Button variant="outline" size="icon" className="h-8 w-8 border-stone-300 text-stone-600 hover:bg-stone-100 cursor-pointer" onClick={() => window.print()}>
      <Printer className="h-4 w-4" />
    </Button>
  );
}