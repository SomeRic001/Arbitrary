// src/lib/emails/tilt-otp.ts
// Tilt-branded OTP email — bottle-green / lime-yellow / red-stripe theme.

export function tiltOtpHtml(name: string, otp: string): string {
    return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background: #0a160b; color: #e8f5e9; margin: 0; padding: 0; }
          .wrapper { max-width: 560px; margin: 32px auto; border-radius: 16px; overflow: hidden;
                     border: 1.5px solid rgba(200,230,60,0.18); }
          .header  { background: linear-gradient(135deg, #1a4a1f 0%, #0e2b10 100%);
                     padding: 32px 32px 24px; text-align: center; position: relative; }
          .red-stripe { height: 3px; background: linear-gradient(90deg, transparent, #d42b2b 20%, #d42b2b 80%, transparent); }
          .logo-box { width: 56px; height: 56px; background: #c8e63c; border-radius: 12px;
                      display: inline-flex; align-items: center; justify-content: center;
                      box-shadow: 0 0 24px rgba(200,230,60,0.4); margin-bottom: 12px; }
          .logo-char { font-size: 30px; font-weight: 900; color: #0e1f10; line-height: 1; }
          .brand { font-size: 22px; font-weight: 900; letter-spacing: 0.25em;
                   text-transform: uppercase; color: #fff; margin: 0; }
          .tagline { font-size: 10px; font-weight: 700; letter-spacing: 0.3em;
                     text-transform: uppercase; color: rgba(200,230,60,0.65); margin: 6px 0 0; }
          .body    { background: #0e1f10; padding: 32px; }
          .greeting { font-size: 15px; color: #c8d8c9; margin: 0 0 16px; }
          .otp-box { background: rgba(200,230,60,0.08); border: 1.5px solid rgba(200,230,60,0.25);
                     border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
          .otp-label { font-size: 10px; font-weight: 900; letter-spacing: 0.25em;
                       text-transform: uppercase; color: rgba(200,230,60,0.55); margin: 0 0 10px; }
          .otp-code { font-size: 42px; font-weight: 900; letter-spacing: 0.35em;
                      color: #c8e63c; margin: 0; font-family: 'Courier New', monospace; }
          .note { font-size: 12px; color: rgba(200,230,60,0.5); margin: 10px 0 0; }
          .body-text { font-size: 13px; color: #9eb49f; line-height: 1.6; margin: 0 0 12px; }
          .footer { background: #0a160b; padding: 18px 32px; text-align: center;
                    font-size: 11px; color: rgba(255,255,255,0.25); border-top: 1px solid rgba(200,230,60,0.08); }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="header">
            <div class="logo-box"><span class="logo-char">~</span></div>
            <p class="brand">tilt</p>
            <p class="tagline">Email Verification</p>
          </div>
          <div class="red-stripe"></div>
          <div class="body">
            <p class="greeting">Hi ${name},</p>
            <p class="body-text">
              Use the one-time code below to verify your email address and complete your Tilt account setup.
            </p>
            <div class="otp-box">
              <p class="otp-label">Your verification code</p>
              <p class="otp-code">${otp}</p>
              <p class="note">Expires in 10 minutes</p>
            </div>
            <p class="body-text">
              Enter this code on the verification screen. If you didn't request this, you can safely ignore this email — no account will be created.
            </p>
          </div>
          <div class="footer">
            © 2026 Tilt · This is an automated email, please do not reply.
          </div>
        </div>
      </body>
    </html>
    `;
}