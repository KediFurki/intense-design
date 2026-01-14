import { Link } from "@/lib/i18n/routing";

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: { oid?: string } }) {
  const oid = searchParams?.oid;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white border rounded-lg p-6 space-y-3">
        <h1 className="text-2xl font-semibold">Payment Successful</h1>
        <p className="text-slate-600">
          Your payment has been received. We will contact you for production and installation details.
        </p>
        {oid ? <p className="text-sm text-slate-500">Order ID: <b>{oid}</b></p> : null}
        <div className="pt-2">
          <Link href="/" className="underline">Back to home</Link>
        </div>
      </div>
    </div>
  );
}