import { mailOptions, transporter } from "@/configs/nodemailer.config";

export const sendFeedbackMail = async (
  toEmail: string,
  message: string,
  subject: string
) => {
  try {
    await transporter.sendMail({
      ...mailOptions,
      to: toEmail,
      subject: subject,
      html: `<p>${message}</p>`,
    });

    return { success: true, message: "Email sent successfully." };
  } catch (error) {
    console.error("Email sending error:", error);
    return { success: false, message: "Failed to send email." };
  }
};
