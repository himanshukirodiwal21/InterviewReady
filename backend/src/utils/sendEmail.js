import "dotenv/config";
import nodemailer from "nodemailer";

console.log("GMAIL_USER:", process.env.GMAIL_USER);
console.log(
    "GMAIL_APP_PASSWORD:",
    process.env.GMAIL_APP_PASSWORD ? "FOUND" : "MISSING"
);

// Render's network has been confirmed (via real ENETUNREACH errors in
// production logs) to be unable to reach Gmail's default SSL port (465).
// Port 587 with STARTTLS is the standard fallback. We also set explicit
// timeouts so that if 587 is ALSO blocked, the request fails within a few
// seconds with a clear error — instead of hanging forever the way it did
// on port 465, which left the frontend stuck on "Sending OTP..." with no
// feedback at all.
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // STARTTLS, not SSL — required for port 587
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
    connectionTimeout: 8000, // fail fast instead of hanging if the port is blocked
    greetingTimeout: 8000,
    socketTimeout: 8000,
});

transporter.verify((error, success) => {
    if (error) {
        console.log("SMTP ERROR:", error);
    } else {
        console.log("SMTP READY");
    }
});

export const sendOTPEmail = async (toEmail, otp) => {
    await transporter.sendMail({
        from: `"InterviewReady" <${process.env.GMAIL_USER}>`,
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
};