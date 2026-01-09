import QRCode from 'qrcode';
import crypto from 'crypto';

export interface QRCodeData {
  ticketId: string;
  orderId: string;
  userId: string;
  eventId: string;
  timestamp: number;
}

export class QRCodeService {
  private readonly SECRET_KEY = process.env.JWT_SECRET || 'fallback-secret';

  /**
   * Encrypt QR code data
   */
  private encrypt(data: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(this.SECRET_KEY).slice(0, 32),
      iv
    );

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt QR code data
   */
  decrypt(encryptedData: string): QRCodeData {
    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');

    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(this.SECRET_KEY).slice(0, 32),
      iv
    );

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }

  /**
   * Generate QR code data for a ticket
   * Returns a short unique code and encrypted data
   * The actual QR image is generated on-demand via generateQRCodeImage()
   */
  generateQRCode(data: QRCodeData): { code: string; data: string } {
    const jsonData = JSON.stringify(data);
    const encryptedData = this.encrypt(jsonData);

    // Generate a short unique code for database storage
    const shortCode = `TKT-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    return {
      code: shortCode, // Short unique code for DB index
      data: encryptedData, // Encrypted string for validation
    };
  }

  /**
   * Generate QR code image as Base64 Data URL
   * Call this on-demand when displaying the QR code to users
   */
  async generateQRCodeImage(encryptedData: string): Promise<string> {
    return QRCode.toDataURL(encryptedData, {
      errorCorrectionLevel: 'H',
      width: 300,
      margin: 2,
    });
  }

  /**
   * Validate QR code data
   */
  validateQRCode(encryptedData: string): {
    valid: boolean;
    data?: QRCodeData;
    error?: string;
  } {
    try {
      const data = this.decrypt(encryptedData);

      // Validate structure
      if (!data.ticketId || !data.orderId || !data.userId || !data.eventId) {
        return {
          valid: false,
          error: 'Invalid QR code structure',
        };
      }

      return {
        valid: true,
        data,
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid or corrupted QR code',
      };
    }
  }

  /**
   * Generate unique ticket ID
   */
  generateTicketId(): string {
    return `TKT-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  }
}
