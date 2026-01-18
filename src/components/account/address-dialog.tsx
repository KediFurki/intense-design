"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
}: {
  initial: AddressFormValues;
  submitLabel: string;
  onSubmit: (formData: FormData) => Promise<void>;
  disabled?: boolean;
}) {
  const t = useTranslations("Account");

  return (
    <form action={onSubmit} className="grid gap-4 py-4">
      {/* Title */}
      <div className="grid gap-2">
        <Label>{t("addressTitle")}</Label>
        <Input name="title" defaultValue={initial.title} required disabled={disabled} />
      </div>

      {/* Contact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>{t("firstName")}</Label>
          <Input name="firstName" defaultValue={initial.firstName} required disabled={disabled} />
        </div>
        <div className="grid gap-2">
          <Label>{t("lastName")}</Label>
          <Input name="lastName" defaultValue={initial.lastName} required disabled={disabled} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>{t("email")}</Label>
          <Input type="email" name="email" defaultValue={initial.email} required disabled={disabled} />
        </div>
        <div className="grid gap-2">
          <Label>{t("phone")}</Label>
          <Input name="phone" defaultValue={initial.phone} required disabled={disabled} />
        </div>
      </div>

      {/* Location */}
      <div className="grid gap-2">
        <Label>{t("address")}</Label>
        <Input name="address" defaultValue={initial.address} required disabled={disabled} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>{t("country")}</Label>
          <Input name="country" defaultValue={initial.country} required disabled={disabled} />
        </div>
        <div className="grid gap-2">
          <Label>{t("state")}</Label>
          {/* state optional: keep empty string for countries without provinces */}
          <Input name="state" defaultValue={initial.state} disabled={disabled} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>{t("city")}</Label>
          <Input name="city" defaultValue={initial.city} required disabled={disabled} />
        </div>
        <div className="grid gap-2">
          <Label>{t("zip")}</Label>
          <Input name="zipCode" defaultValue={initial.zipCode} required disabled={disabled} />
        </div>
      </div>

      <Button type="submit" disabled={disabled}>
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
        <Button variant="outline" className="gap-2">
          <Plus size={16} /> {t("addNewAddress")}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{t("addNewAddress")}</DialogTitle>
        </DialogHeader>

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
      </DialogContent>
    </Dialog>
  );
}

export function AddressEditDialog({
  addressId,
  initial,
}: {
  addressId: string;
  initial: AddressFormValues;
}) {
  const t = useTranslations("Account");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Pencil size={14} /> {t("edit")}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{t("editAddressTitle")}</DialogTitle>
        </DialogHeader>

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
      </DialogContent>
    </Dialog>
  );
}
