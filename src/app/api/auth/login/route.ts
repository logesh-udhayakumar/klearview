import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    if (!user.password) {
      return NextResponse.json({ message: "This account uses Google Sign-In" }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    // Usually we would set a JWT or session cookie here.
    // For this demonstration, we'll return success to let the client redirect.
    let blockedInfo = null;

    if (user.user_type?.toLowerCase() === 'vendor' && user.vendor_id) {
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendor_details')
        .select('name, status')
        .eq('id', user.vendor_id)
        .maybeSingle();

      if (vendorError) {
        console.error("Error fetching vendor_details:", vendorError);
      }

      if (!vendorError && vendorData && vendorData.status?.toLowerCase() === 'blocked') {
        let remarks = "No reason provided";
        
        const { data: auditLog } = await supabase
          .from('audit_logs')
          .select('message')
          .eq('vendor_name', vendorData.name)
          .ilike('message', '%BLOCKED%Remarks:%')
          .order('timestamp', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (auditLog && auditLog.message.includes("Remarks:")) {
           remarks = auditLog.message.split("Remarks:")[1].trim();
        }

        return NextResponse.json({ 
          message: "Account Blocked", 
          isBlocked: true, 
          remarks: remarks 
        }, { status: 403 });
      }
    }

    return NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        user_type: user.user_type,
        vendor_id: user.vendor_id || null,
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
