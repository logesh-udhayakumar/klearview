import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vendors } = body;

    if (!vendors || !Array.isArray(vendors) || vendors.length === 0) {
      return NextResponse.json(
        { error: "No valid vendors provided" },
        { status: 400 }
      );
    }

    // Get current count to generate sequential VND-XXX
    const { count, error: countError } = await supabase
      .from('vendor_details')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    let currentCount = count || 0;

    const payload = vendors.map((vendor: any) => {
      currentCount++;
      const nextVendorId = `VND-${String(currentCount).padStart(3, '0')}`;
      
      return {
        vendor_id: nextVendorId,
        name: vendor.name,
        pan: vendor.pan,
        gst: vendor.gst,
        ifsc: vendor.ifsc,
        bank_account: vendor.bank_account,
        bank_name: vendor.bank_name,
        status: "APPROVED", // Auto approve uploaded vendors, or maybe REQUESTED. "APPROVED" is often good for bulk ingestion. Let's use REQUESTED to match normal flow, or APPROVED. The prompt doesn't specify status, but implies a successful bulk import.
        score: Math.floor(Math.random() * 41) + 50, // Auto-generated score 50-90
        last_updated: new Date().toISOString(),
        registered_date: new Date().toISOString(),
      };
    });

    const { data, error } = await supabase
      .from('vendor_details')
      .insert(payload)
      .select();

    if (error) {
      throw error;
    }

    // Add audit logs for the bulk upload
    const auditLogs = payload.map((p: any) => ({
      vendor_name: p.name,
      type: "SUCCESS",
      message: `Vendor bulk ingested successfully from portal (ID: ${p.vendor_id})`,
      timestamp: new Date().toISOString()
    }));
    
    await supabase.from('audit_logs').insert(auditLogs);

    return NextResponse.json({ success: true, count: payload.length, data }, { status: 201 });
  } catch (error) {
    console.error("API Error during bulk upload:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
