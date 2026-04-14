import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { resetStore } from "@/lib/reset-store";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ message: "Token and password are required" }, { status: 400 });
    }

    // 1. Verify the token in the store
    const record = resetStore.get(token);
    if (!record) {
      return NextResponse.json({ message: "Invalid or expired reset token" }, { status: 400 });
    }

    if (Date.now() > record.expiresAt) {
      resetStore.delete(token);
      return NextResponse.json({ message: "Reset token has expired" }, { status: 400 });
    }

    // 2. Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Update the user's password in the database
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password: hashedPassword,
        // We could also clear any google_id if we want to force them to use password from now on,
        // but it's better to keep it if they want both.
      })
      .eq('email', record.email);

    if (updateError) {
      console.error("Error updating password:", updateError);
      return NextResponse.json({ message: "Failed to update password" }, { status: 500 });
    }

    // 4. Remove the token from the store
    resetStore.delete(token);

    return NextResponse.json({ message: "Password updated successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Reset password API error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
