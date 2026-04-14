
import { getPaymentsByVendorId, getVendorById } from "@/lib/db";
import { notFound } from "next/navigation";
import { VendorPaymentsClient } from "./vendor-payments-client";

export const dynamic = "force-dynamic";

export default async function VendorPaymentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vendor = await getVendorById(id);
  
  if (!vendor) {
    return notFound();
  }

  const payments = await getPaymentsByVendorId(vendor.id);

  return (
    <VendorPaymentsClient 
      payments={payments} 
      vendorName={vendor.name} 
      vendorIdString={vendor.vendorId} 
    />
  );
}
