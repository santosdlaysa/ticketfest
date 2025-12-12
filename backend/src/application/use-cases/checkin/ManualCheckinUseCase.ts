import { ICheckinRepository, TicketForCheckin } from '../../../domain/repositories/ICheckinRepository.js';

export interface ManualCheckinInput {
  ticketInstanceId: string;
  checkedInBy?: string;
}

export interface ManualCheckinOutput {
  success: boolean;
  ticket: TicketForCheckin;
  message: string;
}

export class ManualCheckinUseCase {
  constructor(
    private checkinRepository: ICheckinRepository
  ) {}

  async execute(input: ManualCheckinInput): Promise<ManualCheckinOutput> {
    const ticket = await this.checkinRepository.findTicketById(input.ticketInstanceId);

    if (!ticket) {
      throw new Error('Ingresso não encontrado');
    }

    if (ticket.checkedIn) {
      throw new Error(`Ingresso já validado em ${ticket.checkedInAt?.toLocaleString('pt-BR')}`);
    }

    await this.checkinRepository.performCheckin(input.ticketInstanceId, input.checkedInBy);

    const updatedTicket = await this.checkinRepository.findTicketById(input.ticketInstanceId);

    return {
      success: true,
      ticket: updatedTicket!,
      message: 'Check-in realizado com sucesso!',
    };
  }
}
