import { NextResponse } from 'next/server';
import { supabase, createPayments, getApprovedVendors } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { payments } = await request.json();

    if (!Array.isArray(payments) || payments.length === 0) {
      return NextResponse.json({ error: 'Expected an array of payments' }, { status: 400 });
    }

    // 1. Fetch all approved vendors to resolve vendor_id (human-readable) to UUID id
    const approvedVendors = await getApprovedVendors();
    const vendorMap = new Map(approvedVendors.map(v => [v.vendorId, v.id]));

    // 2. Map the incoming data to CreatePaymentDTO
    const paymentsToCreate = payments.map((p: any) => {
      const dbId = vendorMap.get(p.vendor_id);
      if (!dbId) {
        throw new Error(`Vendor ${p.vendor_id} not found or not approved`);
      }
      return {
        vendorId: dbId,
        amount: parseFloat(p.amount),
        invoiceNumber: p.invoice_no,
        remarks: p.remarks || ""
      };
    });

    // 3. Create the payments
    const success = await createPayments(paymentsToCreate);

    if (!success) {
      return NextResponse.json({ error: 'Failed to create payments in database' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      count: paymentsToCreate.length 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error in batch payment upload:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal Server Error' 
    }, { status: 500 });
  }
}
