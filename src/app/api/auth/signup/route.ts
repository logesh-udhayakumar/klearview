import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import bcrypt from "bcryptjs";
import { otpStore } from "@/lib/otp-store";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, user_type, google_id, otp } = body;

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }



    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email, google_id')
      .eq('email', email)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking user:", checkError);
      return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }

    if (existingUser) {
      // If doing a Google signup finalize flow, they might already have a google_id or are just linking it.
      // But typically we don't allow re-signup if email exists.
      // Let's handle if it's the finalize google signup step
      if (google_id && !existingUser.google_id) {
         // Link google to existing email account, we can update it
         const { error: updateError } = await supabase
           .from('users')
           .update({ google_id, user_type }) // maybe update role if requested
           .eq('id', existingUser.id);
           
         if (updateError) throw updateError;
         return NextResponse.json({ message: "User updated successfully" }, { status: 200 });
      }

      return NextResponse.json({ message: "User already exists with this email" }, { status: 400 });
    }

    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    } else if (!google_id) {
      return NextResponse.json({ message: "Password is required for standard signups" }, { status: 400 });
    }

    // OTP validation for standard email signups
    if (!google_id) {
      if (!otp) {
        return NextResponse.json({ message: "OTP is required for email signup" }, { status: 400 });
      }

      const record = otpStore.get(email);
      if (!record) {
        return NextResponse.json({ message: "No OTP requested or OTP has expired" }, { status: 400 });
      }

      if (Date.now() > record.expiresAt) {
        otpStore.delete(email);
        return NextResponse.json({ message: "OTP has expired" }, { status: 400 });
      }

      if (record.otp !== otp) {
        return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
      }

      // OTP is valid
      otpStore.delete(email);
    }

    const { error: insertError } = await supabase
      .from('users')
      .insert({
        name: name || email.split('@')[0],
        email,
        password: hashedPassword,
        user_type: "Vendor",
        google_id: google_id || null,
      });

    if (insertError) {
      console.error("Error inserting user:", insertError);
      return NextResponse.json({ message: `Failed to create user: ${insertError.message}` }, { status: 500 });
    }

    return NextResponse.json({ message: "User created successfully" }, { status: 201 });
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
