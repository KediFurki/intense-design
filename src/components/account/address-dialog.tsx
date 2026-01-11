"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"; // npx shadcn@latest add dialog
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addAddress } from "@/server/actions/account";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export function AddressDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2"><Plus size={16} /> Add New Address</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Address</DialogTitle>
        </DialogHeader>
        <form action={async (formData) => {
            const res = await addAddress(formData);
            if (res.success) {
                toast.success("Address added!");
                setOpen(false);
            } else {
                toast.error("Failed to add address.");
            }
        }} className="grid gap-4 py-4">
          <div className="grid gap-2"><Label>Title (e.g. Home)</Label><Input name="title" required /></div>
          <div className="grid gap-2"><Label>Address</Label><Input name="address" required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>City</Label><Input name="city" required /></div>
            <div className="grid gap-2"><Label>State</Label><Input name="state" required /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Zip Code</Label><Input name="zipCode" required /></div>
            <div className="grid gap-2"><Label>Country</Label><Input name="country" required /></div>
          </div>
          <Button type="submit">Save Address</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}