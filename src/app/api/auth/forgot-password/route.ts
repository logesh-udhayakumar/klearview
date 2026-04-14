import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { resetStore } from "@/lib/reset-store";
import nodemailer from "nodemailer";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    // 1. Check if user exists in the database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name')
      .eq('email', email)
      .maybeSingle();

    if (userError) {
      console.error("Database error while checking user:", userError);
      return NextResponse.json({ message: "Error checking your account. Please try again later." }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ message: "No account found with this email address. Please sign up first." }, { status: 404 });
    }

    // 2. Generate a unique reset token
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes expiry

    // 3. Store the token (in-memory resetStore for now)
    resetStore.set(token, {
      email,
      expiresAt,
    });

    const origin = req.headers.get("origin") || "http://localhost:3000";
    const resetLink = `${origin}/reset-password?token=${token}`;

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #1a202c; text-align: center;">Reset Your Password</h2>
        <p style="color: #4a5568; line-height: 1.6;">Hello ${user.name},</p>
        <p style="color: #4a5568; line-height: 1.6;">We received a request to reset your password. Click the button below to choose a new password. This link will expire in 30 minutes.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #718096; font-size: 14px; text-align: center;">If you didn't request this, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #a0aec0; font-size: 12px; text-align: center;">Link not working? Copy and paste this URL into your browser:<br/>${resetLink}</p>
      </div>
    `;

    // 4. Try sending via Nodemailer (Gmail) first if EMAIL_PASS is present
    if (process.env.EMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true, // true for 465, false for other ports
          auth: {
            user: 'klearview.fromofficials@gmail.com',
            pass: process.env.EMAIL_PASS.replace(/\s/g, ""), // Remove spaces if user pasted with spaces
          },
        });

        await transporter.sendMail({
          from: '"Klear View" <klearview.fromofficials@gmail.com>',
          to: email,
          subject: 'Password Reset Request',
          html: emailHtml,
        });
        
        console.log(`Email sent via Gmail to ${email}`);
        return NextResponse.json({ message: "Reset link sent successfully to your gmail." }, { status: 200 });
      } catch (err: any) {
        console.error("Gmail SMTP failed:", err.message);
        // If it's an auth error, we fall back to Resend but log clearly
        if (err.message.includes('Invalid login') || err.message.includes('Username and Password not accepted')) {
          console.warn("Gmail Authentication failed. Please ensure 2FA is on and using an App Password.");
        }
      }
    }

    // 5. Fallback to Resend (Using existing API Key)
    try {
      const { error: resendError } = await resend.emails.send({
        from: 'Vendor Portal <onboarding@resend.dev>',
        to: email,
        subject: 'Password Reset Request',
        html: emailHtml,
      });

      if (resendError) throw resendError;

      console.log(`Email sent via Resend to ${email}`);
      return NextResponse.json({ message: "Reset link sent! Please check your inbox (onboarding@resend.dev)." }, { status: 200 });
    } catch (resendError: any) {
      console.error("Resend delivery failed:", resendError);
      
      // Final Fallback for Development: Log to console
      if (process.env.NODE_ENV !== "production") {
        console.log("\n======================================");
        console.log(`[DEVELOPMENT] Delivery Failed. Use this link: ${resetLink}`);
        console.log("======================================\n");
        return NextResponse.json({ 
          message: "Reset link generated! (Development Mode: Link logged to server console)",
          devMode: true 
        }, { status: 200 });
      }
      
      return NextResponse.json({ 
        message: "Email service temporarily unavailable. Please try again later." 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

