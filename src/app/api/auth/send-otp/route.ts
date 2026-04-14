import { NextResponse } from "next/server";
import { otpStore } from "@/lib/otp-store";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store it with a 5-minute expiry
    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    // In development/testing, logging it to terminal is still helpful
    console.log(`\n======================================`);
    console.log(`[REAL EMAIL] Sending OTP for ${email}: ${otp}`);
    console.log(`======================================\n`);

    try {
      const { data, error: emailError } = await resend.emails.send({
        from: 'Vendor Portal <onboarding@resend.dev>',
        to: email,
        subject: 'Verify Your Email',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #1a202c; text-align: center;">Email Verification</h2>
            <p style="color: #4a5568; line-height: 1.6;">Welcome to our portal! Please enter the 6-digit verification code below to complete your registration.</p>
            <div style="background-color: #f7fafc; padding: 20px; text-align: center; border-radius: 8px; margin: 24px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 12px; color: #2b6cb0;">${otp}</span>
            </div>
            <p style="color: #718096; font-size: 14px; text-align: center;">This code will expire in 5 minutes. If you didn't request this, you can ignore this email.</p>
          </div>
        `,
      });

      if (emailError) {
        console.error("Resend API Error Details:", JSON.stringify(emailError, null, 2));
        
        // If we're in development and it's just a Resend restriction, 
        // allow the request to "succeed" so the user can use the console OTP.
        if (process.env.NODE_ENV !== "production" && (emailError as any).statusCode === 403) {
          console.warn("\n[DEVELOPMENT NOTICE] Resend is in testing mode. Using console OTP instead.");
          return NextResponse.json({ 
            message: "OTP sent (Development Mode: Check server console for code)",
            devMode: true
          }, { status: 200 });
        }

        return NextResponse.json({ 
          message: `Email could not be sent: ${emailError.message}. Please use ${emailError.message.includes('own email address') ? 'your Resend account email' : 'a valid address'}.` 
        }, { status: 400 });
      }

      console.log("Resend Success Response:", data);
    } catch (err: any) {
      console.error("Unexpected Resend SDK Error:", err.message);
      return NextResponse.json({ message: "Failed to connect to email service" }, { status: 500 });
    }

    return NextResponse.json({ message: "OTP sent successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Send OTP error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
