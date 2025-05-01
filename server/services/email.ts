import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable is not set, email functionality may not work properly");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY || '');

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export async function sendPasswordResetEmail(email: string, resetToken: string, appUrl: string): Promise<boolean> {
  const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;
  
  return sendEmail({
    to: email,
    from: 'noreply@pokemonbinder.com', // Use a verified sender in your SendGrid account
    subject: 'Reset Your Pokémon Card Album Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563EB;">Reset Your Password</h2>
        <p>We received a request to reset your password for your Pokémon Card Album account.</p>
        <p>To reset your password, click the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Reset Password</a>
        </div>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, you can safely ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #E5E7EB;" />
        <p style="color: #6B7280; font-size: 12px;">This is an automated email from Pokémon Card Album. Please do not reply to this message.</p>
      </div>
    `,
    text: `Reset Your Password: We received a request to reset your password for your Pokémon Card Album account. To reset your password, visit: ${resetUrl} This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.`
  });
}
