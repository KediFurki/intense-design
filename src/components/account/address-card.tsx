"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Trash2, MapPin } from "lucide-react";

import { AddressEditDialog, type AddressFormValues } from "@/components/account/address-dialog";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { deleteAddress } from "@/server/actions/account";

export function AddressCard({
  addr,
}: Readonly<{
  addr: {
    id: string;
    title: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}>) {
  const t = useTranslations("Account");
  const locale = useLocale();

  const [deleting, setDeleting] = useState(false);

  const initial: AddressFormValues = {
    title: addr.title,
    firstName: addr.firstName ?? "",
    lastName: addr.lastName ?? "",
    email: addr.email ?? "",
    phone: addr.phone ?? "",
    address: addr.address,
    city: addr.city,
    state: addr.state ?? "",
    zipCode: addr.zipCode,
    country: addr.country,
  };

  const stateSuffix = addr.state ? `, ${addr.state}` : "";
  const cityLine = `${addr.zipCode} ${addr.city}${stateSuffix}`;

  return (
    <div className="rounded-[24px] border border-stone-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#eadfce] bg-[#faf4ea]">
              <MapPin size={16} className="text-[#8b5e34]" />
            </div>
            <div className="min-w-0">
              <div className="truncate font-semibold text-stone-900">{addr.title}</div>
              <div className="truncate text-xs text-stone-500">
                {addr.city}, {addr.country}
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm leading-6 text-stone-600">
            {(addr.firstName || addr.lastName || addr.phone || addr.email) ? (
              <div className="mb-2 text-sm">
                <div className="font-medium text-stone-900">
                  {[addr.firstName, addr.lastName].filter(Boolean).join(" ")}
                </div>
                {addr.phone ? <div className="text-stone-600">{addr.phone}</div> : null}
                {addr.email ? <div className="text-stone-600">{addr.email}</div> : null}
              </div>
            ) : null}
            <div>{addr.address}</div>
            <div className="text-stone-600">{cityLine}</div>
            <div className="text-stone-600">{addr.country}</div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 self-start">
          <AddressEditDialog addressId={addr.id} initial={initial} />

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 rounded-full border-stone-300 bg-white text-stone-700 hover:bg-stone-50">
                <Trash2 size={14} /> {t("delete")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("deleteAddressTitle")}</DialogTitle>
              </DialogHeader>
              <div className="text-sm text-slate-600">{t("deleteAddressDesc")}</div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" type="button" disabled={deleting}>
                    {t("cancel")}
                  </Button>
                </DialogClose>
                <Button
                  type="button"
                  disabled={deleting}
                  onClick={async () => {
                    setDeleting(true);
                    try {
                      const res = await deleteAddress(addr.id, locale);
                      if (res.success) toast.success(t("addressDeleted"));
                      else toast.error(res.error || t("addressActionFailed"));
                    } finally {
                      setDeleting(false);
                    }
                  }}
                >
                  {deleting ? t("deleting") : t("confirmDelete")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}