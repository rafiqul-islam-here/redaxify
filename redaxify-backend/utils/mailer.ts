import { transporter } from '@/configs/nodemailer.config';
import prisma from '@/lib/prisma';
import otpMailTemplate from '@/templates/otp-mail-template';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

export const sendmail = async ({
  email,
  emailType,
  userID,
}: {
  email: string;
  emailType: 'VERIFY' | 'RESET';
  userID: number;
}) => {
  try {
    // Generate a 6-digit OTP
    const OTP = Math.floor(100000 + Math.random() * 900000);
    const hashedToken = await bcryptjs.hash(userID.toString(), 10);
    console.log('Hashed token:', hashedToken);

    if (!email) {
      throw new Error('Recipient email is missing or invalid.');
    }


    // Update the user with the OTP and expiration time
    if (emailType === 'VERIFY') {
      await prisma.users.update({
        where: { id: userID },
        data: {
          otp: OTP.toString(),
          otpExpires: new Date(Date.now() + 600000), // 10 minutes
          mailVerifytoken: hashedToken,
          mailVerifytokenExpires: new Date(Date.now() + 600000),
        },
      });
    } else if (emailType === 'RESET') {
      await prisma.users.update({
        where: { id: userID },
        data: {
          otp: OTP.toString(),
          otpExpires: new Date(Date.now() + 600000), // 10 minutes
          mailVerifytoken: hashedToken,
          mailVerifytokenExpires: new Date(Date.now() + 600000),
        },
      });
    }
    console.log('OTP and token updated in the database.');

    const link = `${process.env.NEXT_PUBLIC_SITE_URL}/otp?email=${encodeURIComponent(email)}&source=${emailType}`;
    console.log('Generated link:', link);
    const mailOptions = {
      from: `"Redaxify" <${process.env.EMAIL}>`, // Professional sender name
      to: email,
      subject: emailType === 'VERIFY' ? 'Verify Your Redaxify Account' : 'Reset Your Redaxify Password',
      text: `Hello,\n\nYour One-Time Password (OTP) for ${emailType === 'VERIFY' ? 'verifying your Redaxify account' : 'resetting your Redaxify password'} is: ${OTP}\n\nThis OTP is valid for 10 minutes. Do not share it with anyone.\n\nClick here to proceed: ${link}\n\nIf you didn’t request this, please ignore this email or contact support@redaxify.com.\n\n© 2025 Redaxify. All rights reserved.`,
      html: otpMailTemplate(email, OTP, link),
      headers: {
        'X-Priority': '3', // Normal priority
        'X-Mailer': 'Redaxify Mailer', // Custom mailer identifier
      },
    };
    console.log('🚀 Sending email to:', email);
    const mailResponse = await transporter.sendMail(mailOptions);
    console.log('Email sent:', mailResponse.messageId);
    return mailResponse;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error sending email:', error.message);
      throw new Error(error.message);
    }
    console.error('An unknown error occurred:', error);
    throw new Error('An unknown error occurred.');
  }
};
