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
}: {
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
}) {
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

  const cityLine = `${addr.zipCode} ${addr.city}${addr.state ? `, ${addr.state}` : ""}`;

  return (
    <div className="border rounded-xl bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-slate-50 border flex items-center justify-center">
              <MapPin size={16} className="text-slate-700" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-slate-900 truncate">{addr.title}</div>
              <div className="text-xs text-slate-500 truncate">
                {addr.city}, {addr.country}
              </div>
            </div>
          </div>

          <div className="mt-3 text-sm text-slate-700 leading-5">
            {(addr.firstName || addr.lastName || addr.phone || addr.email) ? (
              <div className="mb-2 text-sm">
                <div className="font-medium text-slate-800">
                  {[addr.firstName, addr.lastName].filter(Boolean).join(" ")}
                </div>
                {addr.phone ? <div className="text-slate-600">{addr.phone}</div> : null}
                {addr.email ? <div className="text-slate-600">{addr.email}</div> : null}
              </div>
            ) : null}
            <div>{addr.address}</div>
            <div className="text-slate-600">{cityLine}</div>
            <div className="text-slate-600">{addr.country}</div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <AddressEditDialog addressId={addr.id} initial={initial} />

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
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