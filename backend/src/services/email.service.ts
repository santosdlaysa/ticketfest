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
      eventDate?: string;
      eventLocation?: string;
      ticketName: string;
      qrCode: string;
      ticketCode?: string;
    }>
  ): Promise<void> {
    const ticketsHtml = tickets
      .map(
        (t, index) => `
        <div style="margin: 20px 0; padding: 20px; border: 2px solid #3B82F6; border-radius: 12px; background: #fff;">
          <div style="border-bottom: 2px dashed #e5e7eb; padding-bottom: 15px; margin-bottom: 15px;">
            <h2 style="margin: 0 0 5px 0; color: #1f2937;">${t.eventName}</h2>
            ${t.eventDate ? `<p style="margin: 0; color: #6b7280; font-size: 14px;">📅 ${t.eventDate}</p>` : ''}
            ${t.eventLocation ? `<p style="margin: 0; color: #6b7280; font-size: 14px;">📍 ${t.eventLocation}</p>` : ''}
          </div>

          <div style="text-align: center; padding: 20px 0;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #3B82F6;">${t.ticketName}</p>
            <p style="margin: 0 0 5px 0; font-size: 12px; color: #6b7280;">Ingresso ${index + 1} de ${tickets.length}</p>

            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; display: inline-block; margin: 15px 0;">
              <img src="${t.qrCode}" alt="QR Code" style="width: 200px; height: 200px;" />
            </div>

            ${t.ticketCode ? `
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #9ca3af;">
                Codigo: <strong>${t.ticketCode}</strong>
              </p>
            ` : ''}
          </div>

          <div style="background: #fef3c7; padding: 10px; border-radius: 6px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #92400e;">
              ⚠️ Apresente este QR Code na entrada do evento
            </p>
          </div>
        </div>
      `
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f3f4f6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0; }
            .content { background: #f9fafb; padding: 20px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; background: #f3f4f6; border-radius: 0 0 12px 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🎫 Seus Ingressos</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Guarde este email - voce precisara dele no evento!</p>
            </div>
            <div class="content">
              ${ticketsHtml}

              <div style="margin-top: 30px; padding: 20px; background: #ecfdf5; border-radius: 8px; border-left: 4px solid #10b981;">
                <h3 style="margin: 0 0 10px 0; color: #065f46;">📱 Dicas importantes:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #047857;">
                  <li>Salve este email ou tire um print dos QR Codes</li>
                  <li>Chegue com antecedencia ao evento</li>
                  <li>Tenha o celular carregado para mostrar o ingresso</li>
                  <li>Cada QR Code so pode ser usado uma vez</li>
                </ul>
              </div>
            </div>
            <div class="footer">
              <p>Lumera - Seus eventos favoritos em um so lugar</p>
              <p style="margin-top: 10px;">Duvidas? Entre em contato pelo nosso suporte.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: `🎫 Seus Ingressos - ${tickets[0]?.eventName || 'Lumera'}`,
      html,
      text: `Seus ingressos estao prontos! Apresente os QR Codes na entrada do evento.`,
    });
  }

  async sendEventReminder(
    email: string,
    data: {
      eventName: string;
      eventDate: string;
      eventTime: string;
      eventLocation: string;
      ticketCount: number;
      hoursUntilEvent: number;
    }
  ): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f3f4f6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0; }
            .content { background: white; padding: 30px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">⏰ Lembrete de Evento!</h1>
              <p style="margin: 10px 0 0 0;">Faltam ${data.hoursUntilEvent} horas!</p>
            </div>
            <div class="content">
              <h2 style="color: #1f2937;">${data.eventName}</h2>

              <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0;"><strong>📅 Data:</strong> ${data.eventDate}</p>
                <p style="margin: 0 0 10px 0;"><strong>🕐 Horario:</strong> ${data.eventTime}</p>
                <p style="margin: 0;"><strong>📍 Local:</strong> ${data.eventLocation}</p>
              </div>

              <p>Voce tem <strong>${data.ticketCount} ingresso(s)</strong> para este evento.</p>

              <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 20px;">
                <p style="margin: 0; color: #92400e;">
                  <strong>Nao esqueca:</strong> Tenha seus ingressos (QR Code) prontos na entrada!
                </p>
              </div>
            </div>
            <div class="footer">
              <p>Lumera - Seus eventos favoritos em um so lugar</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: `⏰ Lembrete: ${data.eventName} em ${data.hoursUntilEvent}h!`,
      html,
      text: `Lembrete: ${data.eventName} acontece em ${data.hoursUntilEvent} horas! Local: ${data.eventLocation}`,
    });
  }
}
