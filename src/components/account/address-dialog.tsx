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
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
};

function normalizeInitial(initial?: Partial<AddressFormValues>): AddressFormValues {
  return {
    title: initial?.title ?? "",
    address: initial?.address ?? "",
    city: initial?.city ?? "",
    state: initial?.state ?? "",
    zipCode: initial?.zipCode ?? "",
    country: initial?.country ?? "",
  };
}

/**
 * Create dialog
 */
export function AddressDialog() {
  const t = useTranslations("Account");
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <AddressFormDialog
      mode="create"
      locale={locale}
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button variant="outline" className="gap-2">
          <Plus size={16} /> {t("addNewAddress")}
        </Button>
      }
    />
  );
}

/**
 * Edit dialog
 */
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

  return (
    <AddressFormDialog
      mode="edit"
      addressId={addressId}
      initial={initial}
      locale={locale}
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button variant="outline" size="sm" className="gap-2">
          <Pencil size={14} /> {t("edit")}
        </Button>
      }
    />
  );
}

function AddressFormDialog({
  mode,
  addressId,
  initial,
  locale,
  trigger,
  open,
  onOpenChange,
}: {
  mode: "create" | "edit";
  addressId?: string;
  initial?: Partial<AddressFormValues>;
  locale: string;
  trigger: React.ReactNode;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const t = useTranslations("Account");
  const [submitting, setSubmitting] = useState(false);

  const init = normalizeInitial(initial);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? t("addNewAddress") : t("editAddress")}
          </DialogTitle>
        </DialogHeader>

        <form
          className="grid gap-4 py-2"
          action={async (formData) => {
            setSubmitting(true);
            try {
              const res =
                mode === "create"
                  ? await addAddress(formData, locale)
                  : await updateAddress(String(addressId), formData, locale);

              if (res.success) {
                toast.success(mode === "create" ? t("addressAdded") : t("addressUpdated"));
                onOpenChange(false);
              } else {
                toast.error(res.error || t("addressActionFailed"));
              }
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="title">{t("addressTitle")}</Label>
            <Input id="title" name="title" defaultValue={init.title} required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">{t("addressLine")}</Label>
            <Input id="address" name="address" defaultValue={init.address} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="city">{t("city")}</Label>
              <Input id="city" name="city" defaultValue={init.city} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="state">{t("state")}</Label>
              <Input id="state" name="state" defaultValue={init.state} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="zipCode">{t("zip")}</Label>
              <Input id="zipCode" name="zipCode" defaultValue={init.zipCode} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="country">{t("country")}</Label>
              <Input id="country" name="country" defaultValue={init.country} required />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? t("saving") : t("save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}