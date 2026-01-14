import { Link } from "@/lib/i18n/routing";

export default async function CheckoutCancelPage({ searchParams }: { searchParams: { oid?: string } }) {
  const oid = searchParams?.oid;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white border rounded-lg p-6 space-y-3">
        <h1 className="text-2xl font-semibold">Payment Cancelled</h1>
        <p className="text-slate-600">
          The payment was cancelled. You can try again.
        </p>
        {oid ? <p className="text-sm text-slate-500">Order ID: <b>{oid}</b></p> : null}
        <div className="pt-2">
          <Link href="/checkout" className="underline">Return to checkout</Link>
        </div>
      </div>
    </div>
  );
}