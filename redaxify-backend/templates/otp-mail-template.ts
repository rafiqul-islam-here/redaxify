export default function otpMailTemplate(userName: string, otpCode: number, link: string) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
 <meta charset="UTF-8">
 <meta name="viewport" content="width=device-width, initial-scale=1.0">
 <meta http-equiv="X-UA-Compatible" content="IE=edge">
 <title>OTP Verification - Redaxify</title>
 <style>
   body {
     font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
     background: #f4f4f4;
     margin: 0;
     padding: 0;
     color: #333333;
     text-align: center;
   }
   .container {
     max-width: 600px;
     margin: 20px auto;
     background: #ffffff;
     padding: 20px;
     border-radius: 8px;
     box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
   }
   .header {
     display: flex;
     align-items: center;
     justify-content: center;
     gap: 10px;
     margin-bottom: 20px;
   }
   .logo {
     width: 40px;
   }
   .company-name {
     font-size: 20px;
     font-weight: 600;
     color: #333333;
   }
   h2 {
     font-size: 24px;
     color: #1f2a44;
     margin: 0 0 20px;
   }
   .otp {
     font-size: 28px;
     font-weight: bold;
     color: #1f2a44;
     background: #e6f0fa;
     padding: 12px 20px;
     display: inline-block;
     border-radius: 6px;
     margin: 20px 0;
     letter-spacing: 1px;
   }
   p {
     font-size: 16px;
     line-height: 1.5;
     color: #555555;
     margin: 10px 0;
   }
   a {
     color: #4A90E2;
     text-decoration: none;
     font-weight: 500;
   }
   .footer {
     font-size: 12px;
     color: #888888;
     margin-top: 20px;
     border-top: 1px solid #e0e0e0;
     padding-top: 10px;
   }
   @media only screen and (max-width: 600px) {
     .container {
       width: 100%;
       padding: 15px;
     }
     .otp {
       font-size: 24px;
     }
   }
 </style>
</head>
<body>
 <div class="container">
   <div class="header">
     <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 100 100">
       <polygon points="50,10 70,50 50,90 30,50" fill="#4A90E2"/>
     </svg>
     <div class="company-name">Redaxify</div>
   </div>
   <h2>Hello, ${userName}</h2>
   <p>Your One-Time Password (OTP) for ${link.includes('VERIFY') ? 'verifying your Redaxify account' : 'resetting your Redaxify password'} is:</p>
   <div class="otp">${otpCode}</div>
   <p>This OTP is valid for 10 minutes. For security, do not share it with anyone.</p>
   <p>Click <a href="${link}">here</a> to proceed.</p>
   <p>If you didn’t request this OTP, please ignore this email or contact our <a href="mailto:support@redaxify.com">support team</a>.</p>
   <div class="footer">
     © 2025 Redaxify. All rights reserved.<br>
     <a href="https://www.redaxify.com">Redaxify</a> | <a href="mailto:support@redaxify.com">Contact Us</a>
   </div>
 </div>
</body>
</html>`;
}
