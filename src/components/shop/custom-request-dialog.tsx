"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { sendCustomRequest } from "@/server/actions/custom-request";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type CustomRequestDialogProps = {
  productName: string;
};

const initialForm = {
  customerName: "",
  email: "",
  phone: "",
  message: "",
};

export default function CustomRequestDialog({ productName }: Readonly<CustomRequestDialogProps>) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState(initialForm);

  function updateField(field: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setForm(initialForm);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await sendCustomRequest({
        productName,
        customerName: form.customerName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        message: form.message.trim(),
      });

      if (!result.success) {
        toast.error(result.error || "Failed to send request");
        return;
      }

      toast.success("Request sent successfully");
      resetForm();
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-14 rounded-xl border-slate-200 px-6 text-base font-medium text-slate-700 hover:bg-slate-50"
        >
          Request Custom Size/Color
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl rounded-3xl border-slate-200 bg-white p-0 shadow-2xl">
        <DialogHeader className="border-b border-slate-100 px-6 py-5">
          <DialogTitle className="text-2xl text-slate-900">Custom Request</DialogTitle>
          <DialogDescription className="text-slate-500">
            Tell us what you need for {productName} and we&apos;ll get back to you.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5 px-6 py-6" onSubmit={handleSubmit}>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="custom-request-name">Name</Label>
              <Input
                id="custom-request-name"
                value={form.customerName}
                onChange={(event) => updateField("customerName", event.target.value)}
                placeholder="Your name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-request-phone">Phone</Label>
              <Input
                id="custom-request-phone"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="WhatsApp or phone number"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-request-email">Email</Label>
            <Input
              id="custom-request-email"
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-request-message">Request Details</Label>
            <Textarea
              id="custom-request-message"
              value={form.message}
              onChange={(event) => updateField("message", event.target.value)}
              placeholder="Share preferred size, fabric, color, finish, delivery notes, or any other question."
              className="min-h-36"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-xl px-6" disabled={isPending}>
              {isPending ? "Sending..." : "Send Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}