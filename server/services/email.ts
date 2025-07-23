import { MailService } from '@sendgrid/mail';
import { v4 as uuidv4 } from 'uuid';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable not set. Email functionality will be disabled.");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn("SendGrid API key not configured, skipping email send");
    return false;
  }

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

export async function sendEmailVerification(email: string, token: string, baseUrl: string): Promise<boolean> {
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Verifica la tua email</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Verifica la tua email</h2>
        <p>Grazie per esserti registrato su Pokemon Card Album!</p>
        <p>Per completare la registrazione, clicca sul link seguente per verificare la tua email:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Verifica Email
          </a>
        </div>
        <p>Se non riesci a cliccare il pulsante, copia e incolla questo link nel tuo browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          Questo link scadrà tra 24 ore. Se non hai richiesto questa verifica, puoi ignorare questa email.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    from: 'noreply@pokemoncardalabum.com', // You can configure this
    subject: 'Verifica la tua email - Pokemon Card Album',
    html,
    text: `Verifica la tua email cliccando su questo link: ${verificationUrl}`
  });
}

export async function sendPasswordReset(email: string, token: string, baseUrl: string): Promise<boolean> {
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Password</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Reset della Password</h2>
        <p>Hai richiesto di reimpostare la password per il tuo account Pokemon Card Album.</p>
        <p>Clicca sul link seguente per reimpostare la tua password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reimposta Password
          </a>
        </div>
        <p>Se non riesci a cliccare il pulsante, copia e incolla questo link nel tuo browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          Questo link scadrà tra 1 ora. Se non hai richiesto questo reset, puoi ignorare questa email.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    from: 'noreply@pokemoncardalabum.com', // You can configure this
    subject: 'Reset Password - Pokemon Card Album',
    html,
    text: `Reimposta la tua password cliccando su questo link: ${resetUrl}`
  });
}

export function generateSecureToken(): string {
  return uuidv4() + '-' + Date.now().toString(36);
}