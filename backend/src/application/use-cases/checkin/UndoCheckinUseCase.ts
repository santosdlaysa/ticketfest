import { ICheckinRepository, TicketForCheckin } from '../../../domain/repositories/ICheckinRepository.js';

export interface UndoCheckinInput {
  ticketInstanceId: string;
}

export interface UndoCheckinOutput {
  success: boolean;
  ticket: TicketForCheckin;
  message: string;
}

export class UndoCheckinUseCase {
  constructor(
    private checkinRepository: ICheckinRepository
  ) {}

  async execute(input: UndoCheckinInput): Promise<UndoCheckinOutput> {
    const ticket = await this.checkinRepository.findTicketById(input.ticketInstanceId);

    if (!ticket) {
      throw new Error('Ingresso não encontrado');
    }

    if (!ticket.checkedIn) {
      throw new Error('Ingresso não foi validado');
    }

    await this.checkinRepository.undoCheckin(input.ticketInstanceId);

    const updatedTicket = await this.checkinRepository.findTicketById(input.ticketInstanceId);

    return {
      success: true,
      ticket: updatedTicket!,
      message: 'Check-in desfeito com sucesso',
    };
  }
}
