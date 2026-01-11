"use client";

import { Button } from "@/components/ui/button";
import { TrendingUp, FileText } from "lucide-react";
import { toast } from "sonner";

export function DashboardActions() {
  const handleDownloadReport = () => {
    console.log("Generating report...");
    toast.success("Sales report downloaded (Mock)");
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" className="gap-2" onClick={handleDownloadReport}>
        <TrendingUp size={16} /> Reports (CSV)
      </Button>
      <Button className="gap-2 bg-slate-900 text-white hover:bg-slate-800" onClick={handlePrintPDF}>
        <FileText size={16} /> Download PDF
      </Button>
    </div>
  );
}