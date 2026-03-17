"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";

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
import { Label } from "@/components/ui/label";

import { addAddress, updateAddress } from "@/server/actions/account";

export type AddressFormValues = {
  title: string;
  // Contact
  firstName: string;
  lastName: string;
  email: string;
  phone: string;

  // Location
  country: string;
  state: string;
  city: string;
  address: string;
  zipCode: string;
};

function AddressForm({
  initial,
  submitLabel,
  onSubmit,
  disabled,
}: Readonly<{
  initial: AddressFormValues;
  submitLabel: string;
  onSubmit: (formData: FormData) => Promise<void>;
  disabled?: boolean;
}>) {
  const t = useTranslations("Account");

  return (
    <form action={onSubmit} className="grid gap-3 py-1 sm:gap-4">
      {/* Title */}
      <div className="grid gap-2">
        <Label>{t("addressTitle")}</Label>
        <Input name="title" defaultValue={initial.title} required disabled={disabled} className="h-11 rounded-xl" />
      </div>

      {/* Contact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>{t("firstName")}</Label>
          <Input name="firstName" defaultValue={initial.firstName} required disabled={disabled} className="h-11 rounded-xl" />
        </div>
        <div className="grid gap-2">
          <Label>{t("lastName")}</Label>
          <Input name="lastName" defaultValue={initial.lastName} required disabled={disabled} className="h-11 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>{t("email")}</Label>
          <Input type="email" name="email" defaultValue={initial.email} required disabled={disabled} className="h-11 rounded-xl" />
        </div>
        <div className="grid gap-2">
          <Label>{t("phone")}</Label>
          <Input name="phone" defaultValue={initial.phone} required disabled={disabled} className="h-11 rounded-xl" />
        </div>
      </div>

      {/* Location */}
      <div className="grid gap-2">
        <Label>{t("address")}</Label>
        <Input name="address" defaultValue={initial.address} required disabled={disabled} className="h-11 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>{t("country")}</Label>
          <Input name="country" defaultValue={initial.country} required disabled={disabled} className="h-11 rounded-xl" />
        </div>
        <div className="grid gap-2">
          <Label>{t("state")}</Label>
          {/* state optional: keep empty string for countries without provinces */}
          <Input name="state" defaultValue={initial.state} disabled={disabled} className="h-11 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>{t("city")}</Label>
          <Input name="city" defaultValue={initial.city} required disabled={disabled} className="h-11 rounded-xl" />
        </div>
        <div className="grid gap-2">
          <Label>{t("zip")}</Label>
          <Input name="zipCode" defaultValue={initial.zipCode} required disabled={disabled} className="h-11 rounded-xl" />
        </div>
      </div>

      <Button type="submit" disabled={disabled} className="mt-2 h-11 rounded-xl">
        {submitLabel}
      </Button>
    </form>
  );
}

export function AddressDialog() {
  const t = useTranslations("Account");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const initial: AddressFormValues = {
    title: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "",
    state: "",
    city: "",
    address: "",
    zipCode: "",
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-11 w-full gap-2 rounded-full border-stone-300 bg-white text-stone-700 hover:bg-stone-50 sm:w-auto">
          <Plus size={16} /> {t("addAddress")}
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[calc(100vw-1rem)] max-w-[560px] overflow-hidden rounded-[28px] border-stone-200 p-0 sm:w-full">
        <DialogHeader className="border-b border-stone-100 px-5 py-4 sm:px-6">
          <DialogTitle>{t("addNewAddress")}</DialogTitle>
          <DialogDescription>{t("addressesDesc")}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[80svh] overflow-y-auto px-5 pb-5 pt-4 sm:max-h-[78vh] sm:px-6 sm:pb-6">
          <AddressForm
            initial={initial}
            submitLabel={saving ? t("saving") : t("saveAddress")}
            disabled={saving}
            onSubmit={async (formData) => {
              setSaving(true);
              try {
                const res = await addAddress(formData, locale);
                if (res.success) {
                  toast.success(t("addressAdded"));
                  setOpen(false);
                } else {
                  toast.error(res.error || t("addressActionFailed"));
                }
              } finally {
                setSaving(false);
              }
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AddressEditDialog({
  addressId,
  initial,
}: Readonly<{
  addressId: string;
  initial: AddressFormValues;
}>) {
  const t = useTranslations("Account");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-10 gap-2 rounded-full border-stone-300 bg-white text-stone-700 hover:bg-stone-50">
          <Pencil size={14} /> {t("edit")}
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[calc(100vw-1rem)] max-w-[560px] overflow-hidden rounded-[28px] border-stone-200 p-0 sm:w-full">
        <DialogHeader className="border-b border-stone-100 px-5 py-4 sm:px-6">
          <DialogTitle>{t("editAddressTitle")}</DialogTitle>
          <DialogDescription>{t("addressesDesc")}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[80svh] overflow-y-auto px-5 pb-5 pt-4 sm:max-h-[78vh] sm:px-6 sm:pb-6">
          <AddressForm
            initial={initial}
            submitLabel={saving ? t("saving") : t("saveChanges")}
            disabled={saving}
            onSubmit={async (formData) => {
              setSaving(true);
              try {
                const res = await updateAddress(addressId, formData, locale);
                if (res.success) {
                  toast.success(t("addressUpdated"));
                  setOpen(false);
                } else {
                  toast.error(res.error || t("addressActionFailed"));
                }
              } finally {
                setSaving(false);
              }
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
