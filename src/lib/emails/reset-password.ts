export function resetPasswordHtml(name: string, resetLink: string): string {
  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #000; color: #FACC15; padding: 20px; border-radius: 8px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          .button { background: #000; color: #FACC15; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ARBITRARY</h1>
            <p>Reset Your Password</p>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>We received a request to reset your password. Click the button below to set a new password.</p>
            <p style="text-align:center;"><a href="${resetLink}" class="button">Reset Password</a></p>
            <p>This link will expire in 30 minutes. If you didn't request this, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2026 Arbitrary. All rights reserved.</p>
            <p>This is an automated email. Please do not reply directly.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
