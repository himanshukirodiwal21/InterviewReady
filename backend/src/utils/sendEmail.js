import "dotenv/config";
import nodemailer from "nodemailer";

console.log("GMAIL_USER:", process.env.GMAIL_USER);
console.log(
    "GMAIL_APP_PASSWORD:",
    process.env.GMAIL_APP_PASSWORD ? "FOUND" : "MISSING"
);

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
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