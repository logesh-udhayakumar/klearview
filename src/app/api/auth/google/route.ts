import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email, google_id, action } = await req.json();

    if (!email || !google_id) {
      return NextResponse.json({ message: "Missing Google auth payload" }, { status: 400 });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user:", error);
      return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }

    if (user && user.user_type?.toLowerCase() === 'vendor' && user.vendor_id) {
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendor_details')
        .select('name, status')
        .eq('id', user.vendor_id)
        .maybeSingle();

      if (vendorError) {
        console.error("Error fetching vendor_details in Google login:", vendorError);
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

    if (action === "login") {
      if (!user) {
         // User trying to log in but account doesn't exist
         return NextResponse.json({ isNewUser: true, message: "Account not found, please sign up." }, { status: 200 });
      } else {
         // Proceed with login
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
      }
    }

    // Default action (signup / general oauth callback)
    if (!user) {
      // It's a new account
      return NextResponse.json({ 
        isNewUser: true, 
        message: "New user detected, creating account..." 
      }, { status: 200 });
    }

    // Existing user found, treat as typical login
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
    console.error("Google auth logic error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
