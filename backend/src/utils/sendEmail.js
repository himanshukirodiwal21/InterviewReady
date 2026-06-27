import "dotenv/config";
import { Resend } from "resend";

console.log(
    "RESEND_API_KEY:",
    process.env.RESEND_API_KEY ? "FOUND" : "MISSING"
);

// Render's network has confirmed-blocked outbound SMTP on both port 465
// (ENETUNREACH) and port 587 (ETIMEDOUT) — this isn't a port-specific
// issue, Render blocks outbound SMTP entirely on this plan. Resend sends
// email over a normal HTTPS API call instead of SMTP, so it isn't
// affected by this class of network restriction at all.
const resend = new Resend(process.env.RESEND_API_KEY);

// onboarding@resend.dev is Resend's shared test sender — works immediately
// with no domain setup. Once you verify your own domain in the Resend
// dashboard, swap this for something like "InterviewReady <noreply@yourdomain.com>".
const FROM_ADDRESS = "InterviewReady <onboarding@resend.dev>";

export const sendOTPEmail = async (toEmail, otp) => {
    const { data, error } = await resend.emails.send({
        from: FROM_ADDRESS,
        to: toEmail,
        subject: "Your InterviewReady verification code",
        html: `
      <div style="font-family: sans-serif; max-width: 420px;">
        <h2 style="color: #2D5A4A;">Verify your email</h2>
        <p>Your InterviewReady verification code is:</p>
        <p style="font-size: 28px; font-weight: 600; letter-spacing: 4px;">
          ${otp}
        </p>
        <p style="color: #666; font-size: 13px;">
          This code expires in 10 minutes. If you didn't request this,
          you can ignore this email.
        </p>
      </div>
    `,
    });

    if (error) {
        console.log("RESEND ERROR:", error);
        throw new Error(error.message || "Failed to send OTP email");
    }

    console.log("Email sent via Resend, id:", data?.id);
};