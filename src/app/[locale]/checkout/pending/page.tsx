import { db } from "@/server/db";
import { orders } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export default async function CheckoutPendingPage({
  searchParams,
}: {
  searchParams: Promise<{ oid?: string }> | { oid?: string };
}) {
  const sp = await Promise.resolve(searchParams);
  const oid = sp?.oid;

  if (!oid) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white border rounded-lg p-6">
          Missing order id.
        </div>
      </div>
    );
  }

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, oid),
    columns: {
      id: true,
      paymentMethod: true,
      paymentDueAt: true,
      totalAmount: true,
      remainingAmount: true,
      depositPercent: true,
    },
  });

  const iban = process.env.NEXT_PUBLIC_COMPANY_IBAN || "IBAN_NOT_SET";
  const beneficiary = process.env.NEXT_PUBLIC_COMPANY_BENEFICIARY || "Intense Design";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-white border rounded-lg p-6 space-y-3">
        <h1 className="text-2xl font-semibold">Order Created</h1>

        <p className="text-slate-600">
          Order ID: <b>{order?.id}</b>
        </p>

        {order?.paymentMethod === "iban" ? (
          <>
            <p className="text-slate-600">
              Please complete the bank transfer within <b>3 days</b> to keep the reservation.
            </p>
            <div className="bg-slate-50 border rounded p-3 text-sm space-y-1">
              <div>
                <b>Beneficiary:</b> {beneficiary}
              </div>
              <div>
                <b>IBAN:</b> {iban}
              </div>
              <div>
                <b>Reference:</b> INTENSE-{order?.id}
              </div>
              <div>
                <b>Amount:</b> €{((order?.totalAmount ?? 0) / 100).toFixed(2)}
              </div>
              {order?.paymentDueAt ? (
                <div>
                  <b>Due:</b> {new Date(order.paymentDueAt).toLocaleString()}
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <p className="text-slate-600">
              You will pay the remaining amount at installation (link / IBAN / cash).
            </p>
            <div className="bg-slate-50 border rounded p-3 text-sm">
              <div>
                <b>Remaining Amount:</b> €{((order?.remainingAmount ?? 0) / 100).toFixed(2)}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}