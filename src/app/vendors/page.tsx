import { VendorsClient } from "./vendors-client"
import { getVendors } from "@/lib/db"

export const dynamic = "force-dynamic";

export default async function VendorsPage() {
  const vendors = await getVendors();

  return <VendorsClient initialVendors={vendors} />
}
