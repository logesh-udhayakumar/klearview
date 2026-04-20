import { createClient } from '@supabase/supabase-js';

export type VendorStatus = "APPROVED" | "HOLD" | "REJECTED" | "REQUESTED" | "BLOCKED";

export interface Vendor {
  id: string;
  vendorId: string;
  name: string;
  pan: string;
  gst: string;
  ifsc: string;
  bankAccount: string;
  bankName: string;
  status: VendorStatus;
  score: number;
  lastUpdated: string;
  registeredDate: string;
}

export interface AuditLog {
  id: string;
  vendorName: string;
  type: "ALERT" | "SUCCESS" | "ERROR";
  message: string;
  timestamp: string;
}

export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED";

export interface Payment {
  id: string;
  paymentId: string;
  vendorId: string;
  vendor?: {
    name: string;
    vendorId: string;
  };
  amount: number;
  invoiceNumber: string;
  remarks: string | null;
  status: PaymentStatus;
  createdAt: string;
  bulkId?: string | null;
}

export interface CreatePaymentDTO {
  vendorId: string;
  amount: number;
  invoiceNumber: string;
  remarks?: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'vendor'
  },
});

export async function getVendors(): Promise<Vendor[]> {
  try {
    const { data, error } = await supabase
      .from('vendor_details')
      .select('id, vendor_id, name, pan, gst, ifsc, bank_account, bank_name, status, score, last_updated, registered_date')
      .order('registered_date', { ascending: false });

    if (error) throw error;

    return (data ?? []).map((row: any) => ({
      id: row.id,
      vendorId: row.vendor_id,
      name: row.name,
      pan: row.pan,
      gst: row.gst,
      ifsc: row.ifsc,
      bankAccount: row.bank_account,
      bankName: row.bank_name,
      status: row.status,
      score: row.score,
      lastUpdated: new Date(row.last_updated).toISOString(),
      registeredDate: new Date(row.registered_date).toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return [];
  }
}

export async function getVendorCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('vendor_details')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error("Error fetching vendor count:", error);
    return 0;
  }
}

export async function getVendorById(id: string): Promise<Vendor | null> {
  try {
    let query = supabase
      .from('vendor_details')
      .select('id, vendor_id, name, pan, gst, ifsc, bank_account, bank_name, status, score, last_updated, registered_date')

    if (id.startsWith('VND-')) {
      query = query.eq('vendor_id', id);
    } else {
      query = query.eq('id', id);
    }

    const { data, error } = await query.maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      vendorId: data.vendor_id,
      name: data.name,
      pan: data.pan,
      gst: data.gst,
      ifsc: data.ifsc,
      bankAccount: data.bank_account,
      bankName: data.bank_name,
      status: data.status,
      score: data.score,
      lastUpdated: new Date(data.last_updated).toISOString(),
      registeredDate: new Date(data.registered_date).toISOString(),
    };
  } catch (error) {
    console.error(`Error fetching vendor with ID ${id}:`, error);
    return null;
  }
}

export async function getAuditLogs(limit: number = 6): Promise<AuditLog[]> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('id, vendor_name, type, message, timestamp')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data ?? []).map((row: any) => ({
      id: row.id,
      vendorName: row.vendor_name,
      type: row.type,
      message: row.message,
      timestamp: row.timestamp || "",
    }));
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return [];
  }
}

export async function getLatestVendorAuditLog(vendorName: string): Promise<AuditLog | null> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('id, vendor_name, type, message, timestamp')
      .eq('vendor_name', vendorName)
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      vendorName: data.vendor_name,
      type: data.type,
      message: data.message,
      timestamp: data.timestamp || "",
    };
  } catch (error) {
    console.error("Error fetching vendor audit log:", error);
    return null;
  }
}

export async function getVendorAuditLogs(vendorName: string): Promise<AuditLog[]> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('id, vendor_name, type, message, timestamp')
      .eq('vendor_name', vendorName)
      .order('timestamp', { ascending: false });

    if (error) throw error;

    return (data ?? []).map((row: any) => ({
      id: row.id,
      vendorName: row.vendor_name,
      type: row.type,
      message: row.message,
      timestamp: row.timestamp || "",
    }));
  } catch (error) {
    console.error(`Error fetching audit logs for vendor ${vendorName}:`, error);
    return [];
  }
}

export async function getChartData() {
  try {
    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('type, timestamp')
      .order('timestamp', { ascending: true });

    if (error) throw error;

    // Generate last 30 days
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }

    // Process counts (non-cumulative, daily validation activity)
    const chartData = days.map(dateStr => {
      // Filter logs that fall on this specific day
      const logsOnDay = (logs ?? []).filter(l => l.timestamp && l.timestamp.startsWith(dateStr));
      
      const approved = logsOnDay.filter(l => l.type === "SUCCESS").length;
      const hold = logsOnDay.filter(l => l.type === "ALERT").length;
      const rejected = logsOnDay.filter(l => l.type === "ERROR").length;

      return {
        date: new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
        approved,
        hold,
        rejected,
        total: approved + hold + rejected
      };
    });

    return chartData;
  } catch (error) {
    console.error("Error generating activity chart data:", error);
    return [];
  }
}

export async function createVendor(
  vendor: Omit<Vendor, 'id' | 'vendorId' | 'lastUpdated' | 'registeredDate' | 'score' | 'status'>,
  status: VendorStatus = "REQUESTED",
  userEmail?: string
): Promise<Vendor | null> {
  try {
    // 1. Get current count to generate sequential VND-XXX
    const { count, error: countError } = await supabase
      .from('vendor_details')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    const nextVendorId = `VND-${String((count || 0) + 1).padStart(3, '0')}`;

    const { data, error } = await supabase
      .from('vendor_details')
      .insert({
        vendor_id: nextVendorId,
        name: vendor.name,
        pan: vendor.pan,
        gst: vendor.gst,
        ifsc: vendor.ifsc,
        bank_account: vendor.bankAccount,
        bank_name: vendor.bankName,
        status: status,
        score: Math.floor(Math.random() * 41) + 50, // Random score between 50-90
        last_updated: new Date().toISOString(),
        registered_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) return null;

    const createdVendor: Vendor = {
      id: data.id,
      vendorId: data.vendor_id,
      name: data.name,
      pan: data.pan,
      gst: data.gst,
      ifsc: data.ifsc,
      bankAccount: data.bank_account,
      bankName: data.bank_name,
      status: data.status,
      score: data.score,
      lastUpdated: new Date(data.last_updated).toISOString(),
      registeredDate: new Date(data.registered_date).toISOString(),
    };

    // 2. Map vendor_id to user if userEmail is provided
    if (userEmail) {
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({ vendor_id: createdVendor.id })
        .eq('email', userEmail);

      if (userUpdateError) {
        console.error("Error mapping vendor to user:", userUpdateError);
        // We don't necessarily want to fail the whole vendor creation if this fails,
        // but it is a critical step for the user experience.
      }
    }

    return createdVendor;
  } catch (error) {
    console.error("Error creating vendor:", error);
    return null;
  }
}

export async function getDuplicateVendor(excludeId: string, gst: string, pan: string): Promise<Vendor | null> {
  try {
    const { data, error } = await supabase
      .from('vendor_details')
      .select('id, vendor_id, name, pan, gst, ifsc, bank_account, bank_name, status, score, last_updated, registered_date')
      .or(`gst.ilike.${gst},pan.ilike.${pan}`)
      .neq('id', excludeId)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      vendorId: data.vendor_id,
      name: data.name,
      pan: data.pan,
      gst: data.gst,
      ifsc: data.ifsc,
      bankAccount: data.bank_account,
      bankName: data.bank_name,
      status: data.status,
      score: data.score,
      lastUpdated: new Date(data.last_updated).toISOString(),
      registeredDate: new Date(data.registered_date).toISOString(),
    };
  } catch (error) {
    console.error("Error checking for duplicate vendor:", error);
    return null;
  }
}

export async function updateVendorStatus(id: string, status: VendorStatus, vendorName: string, remarks: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('vendor_details')
      .update({
        status,
        last_updated: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    // Log the action
    await supabase
      .from('audit_logs')
      .insert({
        vendor_name: vendorName,
        type: status === "APPROVED" ? "SUCCESS" : (status === "REJECTED" || status === "BLOCKED" ? "ERROR" : "ALERT"),
        message: `Admin updated status to ${status}. Remarks: ${remarks}`,
        timestamp: new Date().toISOString()
      });

    return true;
  } catch (error) {
    console.error(`Error updating status for vendor ${id}:`, error);
    return false;
  }
}

export async function getApprovedVendors(): Promise<{ id: string; name: string; vendorId: string }[]> {
  try {
    const { data, error } = await supabase
      .from('vendor_details')
      .select('id, name, vendor_id')
      .eq('status', 'APPROVED');

    if (error) throw error;

    return (data ?? []).map((row: any) => ({
      id: row.id,
      name: row.name,
      vendorId: row.vendor_id,
    }));
  } catch (error) {
    console.error("Error fetching approved vendors:", error);
    return [];
  }
}

export async function getPayments(): Promise<Payment[]> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        id, payment_id, vendor_id, amount, invoice_number, remarks, status, created_at, bulk_id,
        vendor_details ( name, vendor_id )
      `)
      .order('payment_id', { ascending: false });

    if (error) {
      console.warn("Error fetching payments (table might not exist):", error);
      return [];
    }

    return (data ?? []).map((row: any) => ({
      id: row.id,
      paymentId: row.payment_id,
      vendorId: row.vendor_id,
      vendor: row.vendor_details ? { name: row.vendor_details.name, vendorId: row.vendor_details.vendor_id } : undefined,
      amount: parseFloat(row.amount),
      invoiceNumber: row.invoice_number,
      remarks: row.remarks,
      status: row.status,
      createdAt: row.created_at,
      bulkId: row.bulk_id,
    }));
  } catch (error) {
    console.error("Error fetching payments:", error);
    return [];
  }
}

export async function getPaymentsByVendorId(vendorId: string): Promise<Payment[]> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        id, payment_id, vendor_id, amount, invoice_number, remarks, status, created_at, bulk_id,
        vendor_details ( name, vendor_id )
      `)
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn(`Error fetching payments for vendor ${vendorId}:`, error);
      return [];
    }

    return (data ?? []).map((row: any) => ({
      id: row.id,
      paymentId: row.payment_id,
      vendorId: row.vendor_id,
      vendor: row.vendor_details ? { name: row.vendor_details.name, vendorId: row.vendor_details.vendor_id } : undefined,
      amount: parseFloat(row.amount),
      invoiceNumber: row.invoice_number,
      remarks: row.remarks,
      status: row.status,
      createdAt: row.created_at,
      bulkId: row.bulk_id,
    }));
  } catch (error) {
    console.error(`Error fetching payments for vendor ${vendorId}:`, error);
    return [];
  }
}


export async function createPayments(paymentsData: CreatePaymentDTO[]): Promise<boolean> {
  try {
    const { count, error: countError } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true });

    let currentCount = count || 0;

    let bulkIdStr: string | null = null;
    if (paymentsData.length > 1) {
      let nextBulkIdNum = 1;
      const { data: lastBulkData } = await supabase
        .from('payments')
        .select('bulk_id')
        .not('bulk_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastBulkData && lastBulkData.bulk_id) {
        const match = lastBulkData.bulk_id.match(/\d+$/);
        if (match) {
          nextBulkIdNum = parseInt(match[0], 10) + 1;
        }
      }
      bulkIdStr = `BULK${String(nextBulkIdNum).padStart(3, '0')}`;
    }

    const itemsToInsert = paymentsData.map((p, index) => {
      const pId = `PAYGEN${String(currentCount + index + 1).padStart(3, '0')}`;
      return {
        payment_id: pId,
        vendor_id: p.vendorId,
        amount: p.amount,
        invoice_number: p.invoiceNumber,
        remarks: p.remarks || null,
        status: "PENDING",
        bulk_id: bulkIdStr
      };
    });

    const { error } = await supabase
      .from('payments')
      .insert(itemsToInsert);

    if (error) throw error;
    
    return true;
  } catch (error) {
    return false;
  }
}

export async function updatePaymentStatus(id: string, status: PaymentStatus): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('payments')
      .update({ status, modified_at: new Date().toISOString() })
      .eq('id', id)
      .eq('status', 'PENDING');

    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error updating payment ${id}:`, error);
    return false;
  }
}

export async function updateBulkPaymentStatus(bulkId: string, status: PaymentStatus): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('payments')
      .update({ status, modified_at: new Date().toISOString() })
      .eq('bulk_id', bulkId)
      .eq('status', 'PENDING');

    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error updating bulk payments ${bulkId}:`, error);
    return false;
  }
}

export async function globalSearch(query: string) {
  try {
    const searchTerm = `%${query}%`;
    
    // Search vendors
    const { data: vendors, error: vendorError } = await supabase
      .from('vendor_details')
      .select('id, vendor_id, name, pan, gst')
      .or(`name.ilike.${searchTerm},pan.ilike.${searchTerm},gst.ilike.${searchTerm},vendor_id.ilike.${searchTerm}`)
      .limit(5);

    if (vendorError) throw vendorError;

    // Search payments
    const { data: payments, error: paymentError } = await supabase
      .from('payments')
      .select(`
        id, 
        payment_id, 
        invoice_number, 
        vendor_details ( name )
      `)
      .or(`payment_id.ilike.${searchTerm},invoice_number.ilike.${searchTerm}`)
      .limit(5);

    if (paymentError) throw paymentError;

    const results = [
      ...(vendors || []).map(v => ({
        id: v.id,
        title: v.name,
        subtitle: v.vendor_id,
        type: 'Vendor',
        href: `/vendors/${v.id}`
      })),
      ...(payments || []).map((p: any) => ({
        id: p.id,
        title: p.payment_id,
        subtitle: `Inv: ${p.invoice_number} - ${p.vendor_details?.name || 'N/A'}`,
        type: 'Payment',
        href: `/payments`
      }))
    ];

    return results;
  } catch (error) {
    console.error("Global search error:", error);
    return [];
  }
}

