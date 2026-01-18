"use client";

import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CreditCard, Building2, Truck } from "lucide-react";
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

type PaymentChoice =
  | "stripe_full"
  | "stripe_deposit"
  | "iban"
  | "cash_on_installation";

type SavedAddress = {
  id: string;
  title: string;
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
  // "/tr/tr/checkout/pending" gibi saçmalıkları önlemek için
  const double = `/${locale}/${locale}/`;
  if (path.startsWith(double)) return path.replace(`/${locale}/`, "/");
  return path;
}

export default function CheckoutPage() {
  const t = useTranslations("Checkout");
  const locale = useLocale();

  const { items, removeAll } = useCart();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [paymentChoice, setPaymentChoice] =
    useState<PaymentChoice>("stripe_full");

  // Address selection
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");

  // Save address checkbox (default true; saved address seçilince false olur)
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

  // Saved addresses load (logged-in ise gelir; guest ise 401 -> sessiz geç)
  useEffect(() => {
    let mounted = true;

    async function loadAddresses() {
      setAddressesLoading(true);
      try {
        const res = await fetch("/api/account/addresses", { method: "GET" });
        if (!res.ok) {
          // guest veya unauthorized => normal
          return;
        }
        const data = (await res.json()) as { addresses?: SavedAddress[] };
        if (mounted && Array.isArray(data.addresses)) {
          setSavedAddresses(data.addresses);
        }
      } catch {
        // sessiz
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
      country: a.country,
      state: a.state,
      city: a.city,
      address: a.address,
      zipCode: a.zipCode,
    }));

    // Saved address seçildiyse default olarak yeni adres kaydetmeyi kapat
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

        window.location.href = data.url;
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

      // locale prefix'i next-intl router ekler; burada locale basma.
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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <I18nLink
            href="/cart"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={16} /> {t("backToCart")}
          </I18nLink>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  id="checkout-form"
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  {/* Saved addresses */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-800">{t("savedAddresses")}</Label>
                      {addressesLoading ? (
                        <span className="text-xs text-slate-500">{t("loading")}</span>
                      ) : null}
                    </div>

                    {showSavedAddressSelect ? (
                      <Select
                        value={selectedAddressId}
                        onValueChange={(v) => applySavedAddress(v)}
                      >
                        <SelectTrigger className="w-full bg-white">
                          <SelectValue placeholder={t("selectSavedAddress")} />
                        </SelectTrigger>
                        <SelectContent>
                          {savedAddresses.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.title} — {a.city}, {a.country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm text-slate-500">
                        {t("noSavedAddresses")}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Customer */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>{t("firstName")}</Label>
                      <Input
                        value={form.firstName}
                        onChange={(e) =>
                          setForm({ ...form, firstName: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label>{t("lastName")}</Label>
                      <Input
                        value={form.lastName}
                        onChange={(e) =>
                          setForm({ ...form, lastName: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label>{t("email")}</Label>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label>{t("phone")}</Label>
                      <Input
                        value={form.phone}
                        onChange={(e) =>
                          setForm({ ...form, phone: e.target.value })
                        }
                        required
                      />
                    </div>

                    {/* Address fields */}
                    <div>
                      <Label>{t("country")}</Label>
                      <Input
                        value={form.country}
                        onChange={(e) =>
                          setForm({ ...form, country: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label>{t("state")}</Label>
                      <Input
                        value={form.state}
                        onChange={(e) =>
                          setForm({ ...form, state: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>{t("city")}</Label>
                      <Input
                        value={form.city}
                        onChange={(e) =>
                          setForm({ ...form, city: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label>{t("zip")}</Label>
                      <Input
                        value={form.zipCode}
                        onChange={(e) =>
                          setForm({ ...form, zipCode: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>{t("address")}</Label>
                      <Input
                        value={form.address}
                        onChange={(e) =>
                          setForm({ ...form, address: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      id="saveAddress"
                      type="checkbox"
                      checked={saveAddress}
                      onChange={(e) => setSaveAddress(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <Label
                      htmlFor="saveAddress"
                      className="text-sm text-slate-700"
                    >
                      {t("saveAddress")}
                    </Label>
                  </div>

                  <Separator />

                  {/* Payment */}
                  <div className="space-y-2">
                    <Label>{t("paymentMethod")}</Label>
                    <Select
                      value={paymentChoice}
                      onValueChange={(v) => setPaymentChoice(v as PaymentChoice)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("selectPayment")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stripe_full">
                          {t("payCardFull")}
                        </SelectItem>
                        <SelectItem value="stripe_deposit">
                          {t("payCardDeposit")}
                        </SelectItem>
                        <SelectItem value="iban">{t("payIban")}</SelectItem>
                        <SelectItem value="cash_on_installation">
                          {t("payAtInstall")}
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {paymentChoice === "iban" && (
                      <p className="text-sm text-slate-600 flex items-center gap-2">
                        <Building2 size={14} />
                        {t("ibanHint")}
                      </p>
                    )}

                    {paymentChoice === "cash_on_installation" && (
                      <p className="text-sm text-slate-600 flex items-center gap-2">
                        <Truck size={14} />
                        {t("installHint")}
                      </p>
                    )}

                    {(paymentChoice === "stripe_full" ||
                      paymentChoice === "stripe_deposit") && (
                      <p className="text-sm text-slate-600 flex items-center gap-2">
                        <CreditCard size={14} />
                        {t("stripeHint")}
                      </p>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>{t("summary")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((it) => (
                  <div
                    key={`${it.id}:${it.variantId || "base"}`}
                    className="flex gap-3"
                  >
                    <div className="relative w-16 h-16 bg-white rounded border overflow-hidden">
                      {it.image ? (
                        <Image
                          src={it.image}
                          alt={it.name}
                          fill
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{it.name}</div>
                      {it.variantName ? (
                        <div className="text-xs text-slate-500">
                          {it.variantName}
                        </div>
                      ) : null}
                      <div className="text-sm text-slate-600">
                        {t("qty")}: {it.quantity}
                      </div>
                    </div>
                    <div className="font-medium">
                      €{((it.price * it.quantity) / 100).toFixed(2)}
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>{t("total")}</span>
                  <span>€{(totalPrice / 100).toFixed(2)}</span>
                </div>

                <Button
                  type="submit"
                  form="checkout-form"
                  className="w-full h-12 text-lg"
                  disabled={isLoading}
                >
                  {isLoading ? t("processing") : t("continue")}
                </Button>
              </CardContent>
            </Card>

            <div className="text-xs text-slate-500 mt-3">
              {t("freeShipping")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}