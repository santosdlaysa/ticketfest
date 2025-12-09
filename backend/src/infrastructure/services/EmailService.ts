import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD) {
      console.warn('⚠️  Email service not configured. Emails will be logged to console.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: parseInt(env.SMTP_PORT || '587'),
      secure: env.SMTP_SECURE === 'true',
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.transporter) {
      console.log('📧 Email (would be sent):');
      console.log(`   To: ${options.to}`);
      console.log(`   Subject: ${options.subject}`);
      console.log(`   Text: ${options.text || 'No text content'}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: env.EMAIL_FROM || 'noreply@Lumera.com',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      console.log(`✅ Email sent to ${options.to}`);
    } catch (error) {
      console.error('❌ Error sending email:', error);
      throw error;
    }
  }

  async sendOrderConfirmation(
    email: string,
    orderData: {
      orderId: string;
      eventName: string;
      eventDate: string;
      tickets: Array<{ name: string; quantity: number; price: number }>;
      total: number;
    }
  ): Promise<void> {
    const ticketsList = orderData.tickets
      .map(
        (t) =>
          `<li>${t.quantity}x ${t.name} - R$ ${t.price.toFixed(2)}</li>`
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3B82F6; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            ul { list-style: none; padding: 0; }
            li { padding: 5px 0; }
            .total { font-size: 18px; font-weight: bold; color: #3B82F6; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Pedido Confirmado!</h1>
            </div>
            <div class="content">
              <p>Olá!</p>
              <p>Seu pedido foi confirmado com sucesso!</p>

              <h3>Detalhes do Pedido</h3>
              <p><strong>Número do Pedido:</strong> ${orderData.orderId}</p>
              <p><strong>Evento:</strong> ${orderData.eventName}</p>
              <p><strong>Data:</strong> ${orderData.eventDate}</p>

              <h3>Ingressos</h3>
              <ul>${ticketsList}</ul>

              <p class="total">Total: R$ ${orderData.total.toFixed(2)}</p>

              <p>Seus ingressos com QR Code estão disponíveis no app e no site.</p>
              <p>Apresente o QR Code na entrada do evento.</p>
            </div>
            <div class="footer">
              <p>Lumera - Seus eventos favoritos em um só lugar</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: `Pedido Confirmado - ${orderData.eventName}`,
      html,
      text: `Seu pedido ${orderData.orderId} foi confirmado!`,
    });
  }

  async sendTickets(
    email: string,
    tickets: Array<{
      eventName: string;
      ticketName: string;
      qrCode: string;
    }>
  ): Promise<void> {
    const ticketsHtml = tickets
      .map(
        (t) => `
        <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd;">
          <h3>${t.eventName}</h3>
          <p>${t.ticketName}</p>
          <img src="${t.qrCode}" alt="QR Code" style="max-width: 200px;" />
        </div>
      `
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>🎫 Seus Ingressos</h2>
            ${ticketsHtml}
            <p>Apresente os QR Codes acima na entrada do evento.</p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Seus Ingressos - Lumera',
      html,
    });
  }
}
