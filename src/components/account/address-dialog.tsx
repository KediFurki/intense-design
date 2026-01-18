"use client";

import { useMemo, useState } from "react";
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

function normalize(v: AddressFormValues): AddressFormValues {
  return {
    title: v.title ?? "",
    address: v.address ?? "",
    city: v.city ?? "",
    state: v.state ?? "",
    zipCode: v.zipCode ?? "",
    country: v.country ?? "",
  };
}

export function AddressDialog() {
  const t = useTranslations("Account");
  const locale = useLocale();

  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus size={16} /> {t("addAddress")}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{t("addAddressTitle")}</DialogTitle>
        </DialogHeader>

        <form
          action={async (formData) => {
            const res = await addAddress(formData, locale);
            if (res.success) {
              toast.success(t("addressAdded"));
              setOpen(false);
            } else {
              toast.error(res.error || t("addressActionFailed"));
            }
          }}
          className="grid gap-4 py-2"
        >
          <div className="grid gap-2">
            <Label>{t("addrTitleLabel")}</Label>
            <Input name="title" required placeholder={t("addrTitlePh")} />
          </div>

          <div className="grid gap-2">
            <Label>{t("addrAddressLabel")}</Label>
            <Input name="address" required placeholder={t("addrAddressPh")} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>{t("addrCityLabel")}</Label>
              <Input name="city" required placeholder={t("addrCityPh")} />
            </div>
            <div className="grid gap-2">
              <Label>{t("addrStateLabel")}</Label>
              <Input name="state" placeholder={t("addrStatePh")} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>{t("addrZipLabel")}</Label>
              <Input name="zipCode" required placeholder={t("addrZipPh")} />
            </div>
            <div className="grid gap-2">
              <Label>{t("addrCountryLabel")}</Label>
              <Input name="country" required placeholder={t("addrCountryPh")} />
            </div>
          </div>

          <div className="pt-1 flex items-center justify-end gap-2">
            <Button type="submit" className="h-10">
              {t("save")}
            </Button>
          </div>
        </form>
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

  const initialSafe = useMemo(() => normalize(initial), [initial]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Pencil size={14} /> {t("edit")}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{t("editAddressTitle")}</DialogTitle>
        </DialogHeader>

        <form
          action={async (formData) => {
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
          className="grid gap-4 py-2"
        >
          <div className="grid gap-2">
            <Label>{t("addrTitleLabel")}</Label>
            <Input name="title" required defaultValue={initialSafe.title} />
          </div>

          <div className="grid gap-2">
            <Label>{t("addrAddressLabel")}</Label>
            <Input name="address" required defaultValue={initialSafe.address} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>{t("addrCityLabel")}</Label>
              <Input name="city" required defaultValue={initialSafe.city} />
            </div>
            <div className="grid gap-2">
              <Label>{t("addrStateLabel")}</Label>
              <Input name="state" defaultValue={initialSafe.state} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>{t("addrZipLabel")}</Label>
              <Input name="zipCode" required defaultValue={initialSafe.zipCode} />
            </div>
            <div className="grid gap-2">
              <Label>{t("addrCountryLabel")}</Label>
              <Input name="country" required defaultValue={initialSafe.country} />
            </div>
          </div>

          <div className="pt-1 flex items-center justify-end gap-2">
            <Button type="submit" className="h-10" disabled={saving}>
              {saving ? t("saving") : t("save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}