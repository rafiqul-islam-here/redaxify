import { mailOptions, transporter } from "@/configs/nodemailer.config";


export const sendSubscriptionEmail = async (toEmail: string) => {
  try {
    await transporter.sendMail({
      ...mailOptions,
      to: toEmail,
      subject: "Subscription Confirmation",
      text: "Thank you for subscribing! You will receive updates from us.",
      html: "<h1>Thank you for subscribing!</h1><p>You will receive updates from us.</p>",
    });

    return { success: true, message: "Email sent successfully." };
  } catch (error) {
    console.error("Email sending error:", error);
    return { success: false, message: "Failed to send email." };
  }
};
