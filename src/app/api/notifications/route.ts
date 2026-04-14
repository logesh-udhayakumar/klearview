import { NextResponse } from "next/server";
import { getVendorAuditLogs } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const vendorName = searchParams.get("vendorName");

  if (!vendorName) {
    return NextResponse.json({ error: "Vendor name is required" }, { status: 400 });
  }

  try {
    const logs = await getVendorAuditLogs(vendorName);
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
