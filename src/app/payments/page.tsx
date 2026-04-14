
import { PaymentsClient } from "@/app/payments/payments-client";
import { getPayments, getApprovedVendors } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const initialPayments = await getPayments();
  const approvedVendors = await getApprovedVendors();

  return <PaymentsClient initialPayments={initialPayments} approvedVendors={approvedVendors} />;
}
