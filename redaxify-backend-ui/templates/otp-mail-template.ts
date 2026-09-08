export default function otpMailTemplate(userName: string, otpCode: number) {
  return `<!DOCTYPE html>
  <html>
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>OTP Verification</title>
      <style>
          body {
              font-family: Arial, sans-serif;
                background:#0A0D22;
              margin: 0;
              padding: 0;
              color: #ffffff;
              text-align: center;
          }
          .container {
              max-width: 500px;
              margin: 40px auto;
  background: linear-gradient(135deg, #242648, #1C1C3A);
              padding: 30px;
              border-radius: 12px;
              box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
          }
          .header {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 12px;
              margin-bottom: 20px;
          }
          .logo {
              width: 50px;
          }
          .company-name {
              font-size: 22px;
              font-weight: bold;
          }
          h2 {
              color: #4A90E2;
              font-size: 22px;
          }
          .otp {
              font-size: 26px;
              font-weight: bold;
              color: #ffffff;
              background: linear-gradient(135deg, #4A90E2, #3B82F6);
              padding: 14px 24px;
              display: inline-block;
              border-radius: 8px;
              margin: 20px 0;
              letter-spacing: 2px;
          }
          p {
              font-size: 16px;
              line-height: 1.6;
              color: #D1D5DB;
          }
          .footer {
              font-size: 13px;
              color: #94A3B8;
              margin-top: 30px;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">

         <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <polygon points="50,10 70,50 50,90 30,50" fill="white"/>
</svg>

              <div class="company-name">Redaxify</div>
          </div>
  
          <h2>Hello, ${userName} 👋</h2>
          <p>Your One-Time Password (OTP) for verification is:</p>
          <div class="otp">${otpCode}</div>
          <p>This OTP is valid for 10 minutes. Please do not share it with anyone.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <div class="footer">© 2025 Redaxify. All rights reserved.</div>
      </div>
  </body>
  </html>
  

  `;
}
