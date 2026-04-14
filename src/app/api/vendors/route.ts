import { NextRequest, NextResponse } from "next/server";
import { createVendor, supabase } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const isCountOnly = searchParams.get('count') === 'true';

    if (isCountOnly) {
      let query = supabase.from('vendor_details').select('*', { count: 'exact', head: true });
      if (status) query = query.eq('status', status);
      
      const { count, error } = await query;
      if (error) throw error;
      return NextResponse.json({ count: count || 0 });
    }

    let query = supabase.from('vendor_details').select('*');
    if (status) query = query.eq('status', status);
    
    const { data, error } = await query.order('name');
    if (error) throw error;

    const vendors = (data || []).map(row => ({
      id: row.id,
      vendorId: row.vendor_id,
      name: row.name,
      status: row.status,
      pan: row.pan,
      gst: row.gst,
      bankAccount: row.bank_account
    }));

    return NextResponse.json(vendors);
  } catch (error) {
    console.error("API Error fetching vendors:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, pan, gst, ifsc, bankAccount, bankName, status, userEmail } = body;

    if (!name || !pan || !gst || !ifsc || !bankAccount || !bankName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const vendor = await createVendor({
      name,
      pan,
      gst,
      ifsc,
      bankAccount,
      bankName,
    }, status, userEmail);

    if (!vendor) {
      return NextResponse.json(
        { error: "Failed to create vendor" },
        { status: 500 }
      );
    }

    return NextResponse.json(vendor, { status: 201 });
  } catch (error) {
    console.error("API Error creating vendor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
