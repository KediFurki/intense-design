"use client";

import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Building2, CreditCard, Lock, Truck } from "lucide-react";
import { Link as I18nLink, useRouter } from "@/lib/i18n/routing";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { AddressSelector } from "@/components/checkout/address-selector";

type PaymentChoice =
  | "stripe_full"
  | "stripe_deposit"
  | "iban"
  | "cash_on_installation";

type SavedAddress = {
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

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Checkout failed.";
}

function normalizePathWithoutDoubleLocale(path: string, locale: string) {
  const double = `/${locale}/${locale}/`;
  if (path.startsWith(double)) return path.replace(`/${locale}/`, "/");
  return path;
}

function formatMoneyEUR(locale: string, amountInCents: number) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format((amountInCents ?? 0) / 100);
}

export default function CheckoutPage() {
  const t = useTranslations("Checkout");
  const locale = useLocale();

  const { items, removeAll } = useCart();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [paymentChoice, setPaymentChoice] =
    useState<PaymentChoice>("stripe_full");
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [saveAddress, setSaveAddress] = useState(true);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "Bulgaria",
    state: "",
    city: "",
    address: "",
    zipCode: "",
    invoiceType: "individual",
    companyName: "",
    taxId: "",
    taxOffice: "",
  });

  const totalPrice = items.reduce((acc, it) => acc + it.price * it.quantity, 0);
  const shippingPrice = 0;
  const finalTotal = totalPrice + shippingPrice;

  useEffect(() => {
    let mounted = true;

    async function loadAddresses() {
      setAddressesLoading(true);
      try {
        const res = await fetch("/api/account/addresses", { method: "GET" });
        if (!res.ok) {
          return;
        }
        const data = (await res.json()) as { addresses?: SavedAddress[] };
        if (mounted && Array.isArray(data.addresses)) {
          setSavedAddresses(data.addresses);
        }
      } catch {
      } finally {
        if (mounted) setAddressesLoading(false);
      }
    }

    loadAddresses();
    return () => {
      mounted = false;
    };
  }, []);

  const addressMap = useMemo(() => {
    const m = new Map<string, SavedAddress>();
    for (const a of savedAddresses) m.set(a.id, a);
    return m;
  }, [savedAddresses]);

  function applySavedAddress(addrId: string) {
    setSelectedAddressId(addrId);

    const a = addressMap.get(addrId);
    if (!a) return;

    setForm((prev) => ({
      ...prev,
      firstName: a.firstName || prev.firstName,
      lastName: a.lastName || prev.lastName,
      email: a.email || prev.email,
      phone: a.phone || prev.phone,
      country: a.country,
      state: a.state,
      city: a.city,
      address: a.address,
      zipCode: a.zipCode,
    }));
    setSaveAddress(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (items.length === 0) {
      toast.error(t("cartEmpty"));
      return;
    }

    setIsLoading(true);
    try {
      const customer = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        country: form.country,
        state: form.state,
        city: form.city,
        address: form.address,
        zipCode: form.zipCode,
        invoiceType:
          (form.invoiceType as "individual" | "corporate") ?? "individual",
        companyName: form.companyName || null,
        taxId: form.taxId || null,
        taxOffice: form.taxOffice || null,
      };

      const payloadItems = items.map((it) => ({
        id: it.id,
        variantId: it.variantId,
        variantName: it.variantName,
        price: it.price,
        quantity: it.quantity,
      }));

      if (
        paymentChoice === "stripe_full" ||
        paymentChoice === "stripe_deposit"
      ) {
        const res = await fetch("/api/stripe/checkout-session", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-app-locale": locale,
          },
          body: JSON.stringify({
            locale,
            saveAddress,
            customer,
            items: payloadItems,
            paymentType: paymentChoice === "stripe_deposit" ? "deposit" : "full",
          }),
        });

        const data: { url?: string; error?: string } = await res.json();
        if (!res.ok) throw new Error(data?.error || t("stripeCreateFailed"));
        if (!data.url) throw new Error(t("stripeUrlMissing"));

        globalThis.location.href = data.url;
        return;
      }

      const res = await fetch("/api/checkout/offline", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-app-locale": locale,
        },
        body: JSON.stringify({
          locale,
          saveAddress,
          customer,
          items: payloadItems,
          paymentMethod: paymentChoice === "iban" ? "iban" : "cash_on_installation",
        }),
      });

      const data: { orderId?: string; error?: unknown } = await res.json();
      if (!res.ok) {
        const msg =
          typeof data?.error === "string" ? data.error : t("offlineCreateFailed");
        throw new Error(msg);
      }
      if (!data.orderId) throw new Error(t("orderIdMissing"));

      removeAll();
      const target = normalizePathWithoutDoubleLocale(
        `/checkout/pending?oid=${data.orderId}`,
        locale
      );
      router.push(target);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
      setIsLoading(false);
    }
  }

  const showSavedAddressSelect = savedAddresses.length > 0;

  return (
    <div className="min-h-screen bg-stone-50 py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-6 sm:mb-8">
          <I18nLink
            href="/cart"
            className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition-colors hover:text-stone-900"
          >
            <ArrowLeft size={16} /> {t("backToCart")}
          </I18nLink>
        </div>

        <section className="mb-6 rounded-[32px] border border-[#eadfce] bg-[linear-gradient(135deg,#fffaf3_0%,#f6edde_55%,#efe3d2_100%)] px-5 py-6 shadow-[0_28px_80px_-48px_rgba(120,91,60,0.35)] sm:px-8 sm:py-8">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center rounded-full border border-white/70 bg-white/75 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-stone-600 shadow-sm">
              {t("securePayment")}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
              {t("title")}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
              {t("shippingInfo")} · {t("paymentMethod")} · {t("securePayment")}
            </p>
          </div>
        </section>

        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="space-y-6 lg:col-span-8">
            <Card className="rounded-[28px] border border-stone-100 bg-white shadow-sm">
              <CardHeader className="border-b border-stone-100 px-5 py-5 sm:px-8 sm:py-7">
                <CardTitle className="text-xl font-semibold text-stone-900 sm:text-2xl">
                  {t("shippingInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 py-5 sm:px-8 sm:py-8">
                {showSavedAddressSelect ? (
                  <div className="mb-6 rounded-2xl border border-stone-100 bg-stone-50/70 p-4 sm:p-5">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <Label className="text-sm font-semibold text-stone-800">{t("savedAddresses")}</Label>
                      {addressesLoading ? (
                        <span className="text-xs text-stone-500">{t("loading")}</span>
                      ) : null}
                    </div>
                    <Select value={selectedAddressId} onValueChange={(value) => applySavedAddress(value)}>
                      <SelectTrigger className="h-12 w-full rounded-xl border-stone-200 bg-white">
                        <SelectValue placeholder={t("selectSavedAddress")} />
                      </SelectTrigger>
                      <SelectContent>
                        {savedAddresses.map((address) => (
                          <SelectItem key={address.id} value={address.id}>
                            {address.title} — {address.city}, {address.country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="mb-6 rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-4 text-sm text-stone-500 sm:px-5">
                    {t("noSavedAddresses")}
                  </div>
                )}

                <form id="checkout-form" onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
                    <div className="space-y-2">
                      <Label>{t("firstName")}</Label>
                      <Input className="h-12 rounded-xl border-stone-200 bg-stone-50/40" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("lastName")}</Label>
                      <Input className="h-12 rounded-xl border-stone-200 bg-stone-50/40" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("email")}</Label>
                      <Input className="h-12 rounded-xl border-stone-200 bg-stone-50/40" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("phone")}</Label>
                      <Input className="h-12 rounded-xl border-stone-200 bg-stone-50/40" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                    </div>
                  </div>

                  <AddressSelector
                    value={{ country: form.country, state: form.state, city: form.city }}
                    onChange={(next) => setForm((prev) => ({ ...prev, ...next }))}
                    labels={{
                      country: t("country"),
                      state: t("state"),
                      city: t("city"),
                      selectCountry: t("selectCountry"),
                      selectState: t("selectState"),
                      selectCity: t("selectCity"),
                      cityManualPlaceholder: t("cityManualPlaceholder"),
                      stateManualPlaceholder: t("stateManualPlaceholder"),
                      stateNotAvailableHint: t("stateNotAvailableHint"),
                      cityNotAvailableHint: t("cityNotAvailableHint"),
                      cityManualLabel: t("cityManualLabel"),
                    }}
                    requiredCity
                  />

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
                    <div className="space-y-2">
                      <Label>{t("zip")}</Label>
                      <Input className="h-12 rounded-xl border-stone-200 bg-stone-50/40" value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value })} required />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>{t("address")}</Label>
                      <Input className="h-12 rounded-xl border-stone-200 bg-stone-50/40" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-stone-100 bg-stone-50/70 p-4 sm:p-5">
                    <div className="mb-4">
                      <h2 className="text-lg font-semibold text-stone-900">{t("invoiceTitle")}</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
                      <div className="space-y-2">
                        <Label>{t("invoiceType")}</Label>
                        <Select value={form.invoiceType} onValueChange={(value) => setForm((prev) => ({ ...prev, invoiceType: value }))}>
                          <SelectTrigger className="h-12 w-full rounded-xl border-stone-200 bg-white">
                            <SelectValue placeholder={t("selectInvoiceType")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="individual">{t("invoiceIndividual")}</SelectItem>
                            <SelectItem value="corporate">{t("invoiceCorporate")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {form.invoiceType === "corporate" ? (
                      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
                        <div className="space-y-2">
                          <Label>{t("companyName")}</Label>
                          <Input className="h-12 rounded-xl border-stone-200 bg-white" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("taxId")}</Label>
                          <Input className="h-12 rounded-xl border-stone-200 bg-white" value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} required />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>{t("taxOffice")}</Label>
                          <Input className="h-12 rounded-xl border-stone-200 bg-white" value={form.taxOffice} onChange={(e) => setForm({ ...form, taxOffice: e.target.value })} />
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl border border-stone-100 bg-stone-50/70 px-4 py-4">
                    <Checkbox id="saveAddress" checked={saveAddress} onCheckedChange={(checked) => setSaveAddress(checked === true)} className="mt-0.5" />
                    <Label htmlFor="saveAddress" className="text-sm leading-6 text-stone-700">
                      {t("saveAddress")}
                    </Label>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border border-stone-100 bg-white shadow-sm">
              <CardHeader className="border-b border-stone-100 px-5 py-5 sm:px-8 sm:py-7">
                <CardTitle className="text-xl font-semibold text-stone-900 sm:text-2xl">
                  {t("paymentMethod")}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 py-5 sm:px-8 sm:py-8">
                <div className="space-y-3">
                  <Label>{t("paymentMethod")}</Label>
                  <Select value={paymentChoice} onValueChange={(value) => setPaymentChoice(value as PaymentChoice)}>
                    <SelectTrigger className="h-12 w-full rounded-xl border-stone-200 bg-stone-50/40">
                      <SelectValue placeholder={t("selectPayment")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stripe_full">{t("payCardFull")}</SelectItem>
                      <SelectItem value="stripe_deposit">{t("payCardDeposit")}</SelectItem>
                      <SelectItem value="iban">{t("payIban")}</SelectItem>
                      <SelectItem value="cash_on_installation">{t("payAtInstall")}</SelectItem>
                    </SelectContent>
                  </Select>

                  {paymentChoice === "iban" ? (
                    <div className="flex items-start gap-3 rounded-2xl border border-stone-100 bg-stone-50 px-4 py-4 text-sm leading-6 text-stone-600">
                      <Building2 className="mt-0.5 size-4 shrink-0" />
                      <span>{t("ibanHint")}</span>
                    </div>
                  ) : null}

                  {paymentChoice === "cash_on_installation" ? (
                    <div className="flex items-start gap-3 rounded-2xl border border-stone-100 bg-stone-50 px-4 py-4 text-sm leading-6 text-stone-600">
                      <Truck className="mt-0.5 size-4 shrink-0" />
                      <span>{t("installHint")}</span>
                    </div>
                  ) : null}

                  {(paymentChoice === "stripe_full" || paymentChoice === "stripe_deposit") ? (
                    <div className="flex items-start gap-3 rounded-2xl border border-stone-100 bg-stone-50 px-4 py-4 text-sm leading-6 text-stone-600">
                      <CreditCard className="mt-0.5 size-4 shrink-0" />
                      <span>{t("stripeHint")}</span>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="mt-6 lg:col-span-4 lg:mt-0">
            <Card className="rounded-[28px] border border-stone-100 bg-white shadow-sm lg:sticky lg:top-24">
              <CardHeader className="border-b border-stone-100 px-5 py-5 sm:px-6 sm:py-6">
                <CardTitle className="text-xl font-semibold text-stone-900">
                  {t("orderSummary")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
                {items.map((it) => (
                  <div
                    key={`${it.id}:${it.variantId || "base"}`}
                    className="flex gap-3 rounded-2xl bg-stone-50 px-3 py-3"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-white">
                      {it.image ? (
                        <Image
                          src={it.image}
                          alt={it.name}
                          fill
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-stone-900">{it.name}</div>
                      {it.variantName ? (
                        <div className="text-xs text-stone-500">
                          {it.variantName}
                        </div>
                      ) : null}
                      <div className="text-sm text-stone-600">
                        {t("qty")}: {it.quantity}
                      </div>
                    </div>
                    <div className="text-right font-medium text-stone-900">
                      {formatMoneyEUR(locale, it.price * it.quantity)}
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="space-y-3 text-sm text-stone-600">
                  <div className="flex items-center justify-between">
                    <span>{t("subtotal")}</span>
                    <span>{formatMoneyEUR(locale, totalPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t("shipping")}</span>
                    <span>{t("shippingFree")}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between text-lg font-semibold text-stone-900">
                  <span>{t("total")}</span>
                  <span>{formatMoneyEUR(locale, finalTotal)}</span>
                </div>

                <Button
                  type="submit"
                  form="checkout-form"
                  className="w-full rounded-2xl bg-[#b05c45] py-6 text-base font-semibold text-white shadow-[0_18px_40px_-20px_rgba(176,92,69,0.75)] hover:bg-[#8c4734]"
                  disabled={isLoading}
                >
                  {isLoading ? t("processing") : t("placeOrder")}
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs font-medium text-stone-500">
                  <Lock className="size-3.5" />
                  <span>{t("securePayment")}</span>
                </div>
              </CardContent>
            </Card>

            <div className="mt-3 text-xs text-stone-500">
              {t("freeShipping")}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}