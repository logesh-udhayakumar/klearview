import { NextResponse } from 'next/server';
import { getPayments, createPayments } from '@/lib/db';

export async function GET() {
  try {
    const payments = await getPayments();
    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const paymentsData = await request.json();
    
    if (!Array.isArray(paymentsData)) {
      return NextResponse.json({ error: 'Expected an array of payments' }, { status: 400 });
    }

    if (paymentsData.length === 0) {
      return NextResponse.json({ error: 'No payments provided' }, { status: 400 });
    }

    const success = await createPayments(paymentsData);
    if (!success) {
      return NextResponse.json({ error: 'Failed to create payments' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error in payments POST:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, bulkId, status } = await request.json();
    const { updatePaymentStatus, updateBulkPaymentStatus } = await import('@/lib/db');

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    let success = false;
    if (bulkId) {
      success = await updateBulkPaymentStatus(bulkId, status);
    } else if (id) {
      success = await updatePaymentStatus(id, status);
    } else {
      return NextResponse.json({ error: 'Either id or bulkId is required' }, { status: 400 });
    }

    if (!success) {
      return NextResponse.json({ error: 'Failed to update payment(s)' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in payments PATCH:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
