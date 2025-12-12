import { ICheckinRepository, TicketForCheckin } from '../../../domain/repositories/ICheckinRepository.js';

export interface ValidateTicketInput {
  qrCode: string;
  performCheckin?: boolean;
  checkedInBy?: string;
}

export interface ValidateTicketOutput {
  valid: boolean;
  ticket: TicketForCheckin | null;
  message: string;
  alreadyCheckedIn: boolean;
}

export class ValidateTicketUseCase {
  constructor(
    private checkinRepository: ICheckinRepository
  ) {}

  async execute(input: ValidateTicketInput): Promise<ValidateTicketOutput> {
    const ticket = await this.checkinRepository.findTicketByQRCode(input.qrCode);

    if (!ticket) {
      return {
        valid: false,
        ticket: null,
        message: 'Ingresso não encontrado',
        alreadyCheckedIn: false,
      };
    }

    if (ticket.checkedIn) {
      return {
        valid: false,
        ticket,
        message: `Ingresso já validado em ${ticket.checkedInAt?.toLocaleString('pt-BR')}`,
        alreadyCheckedIn: true,
      };
    }

    // If performCheckin is true, do the check-in
    if (input.performCheckin) {
      await this.checkinRepository.performCheckin(ticket.id, input.checkedInBy);

      // Return updated ticket
      const updatedTicket = await this.checkinRepository.findTicketById(ticket.id);

      return {
        valid: true,
        ticket: updatedTicket,
        message: 'Check-in realizado com sucesso!',
        alreadyCheckedIn: false,
      };
    }

    return {
      valid: true,
      ticket,
      message: 'Ingresso válido',
      alreadyCheckedIn: false,
    };
  }
}
