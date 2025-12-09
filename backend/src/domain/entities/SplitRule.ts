export interface SplitRuleProps {
  id: string;
  eventId: string;
  organizerAccountId: string;
  platformPercentage: number; // Ex: 10 (representa 10%)
  organizerPercentage: number; // Ex: 90 (representa 90%)
  platformFixedFee: number; // Taxa fixa adicional
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SplitCalculation {
  totalAmount: number;
  platformAmount: number;
  organizerAmount: number;
  platformFee: number;
}

export class SplitRule {
  private constructor(private props: SplitRuleProps) {}

  static create(
    props: Omit<SplitRuleProps, 'id' | 'active' | 'createdAt' | 'updatedAt'> & {
      id?: string;
      active?: boolean;
    }
  ): SplitRule {
    // Validar que as porcentagens somam 100%
    const totalPercentage = props.platformPercentage + props.organizerPercentage;
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error('Platform and organizer percentages must sum to 100%');
    }

    // Validar que as porcentagens são positivas
    if (props.platformPercentage < 0 || props.organizerPercentage < 0) {
      throw new Error('Percentages must be positive');
    }

    // Validar que a taxa fixa não é negativa
    if (props.platformFixedFee < 0) {
      throw new Error('Platform fixed fee must be non-negative');
    }

    return new SplitRule({
      id: props.id || crypto.randomUUID(),
      eventId: props.eventId,
      organizerAccountId: props.organizerAccountId,
      platformPercentage: props.platformPercentage,
      organizerPercentage: props.organizerPercentage,
      platformFixedFee: props.platformFixedFee,
      active: props.active ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static restore(props: SplitRuleProps): SplitRule {
    return new SplitRule(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get eventId(): string {
    return this.props.eventId;
  }

  get organizerAccountId(): string {
    return this.props.organizerAccountId;
  }

  get platformPercentage(): number {
    return this.props.platformPercentage;
  }

  get organizerPercentage(): number {
    return this.props.organizerPercentage;
  }

  get platformFixedFee(): number {
    return this.props.platformFixedFee;
  }

  get active(): boolean {
    return this.props.active;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business Logic Methods

  isActive(): boolean {
    return this.props.active;
  }

  /**
   * Calcula a divisão de um valor total
   * @param totalAmount Valor total a ser dividido
   * @returns Objeto com os valores calculados
   */
  calculateSplit(totalAmount: number): SplitCalculation {
    if (totalAmount <= 0) {
      throw new Error('Total amount must be positive');
    }

    if (!this.props.active) {
      throw new Error('Split rule is not active');
    }

    // Calcula o valor da plataforma (percentual + taxa fixa)
    const platformPercentageAmount = (totalAmount * this.props.platformPercentage) / 100;
    const platformAmount = platformPercentageAmount + this.props.platformFixedFee;

    // Calcula o valor do organizador
    const organizerAmount = totalAmount - platformAmount;

    // Validar que o organizador não fica com valor negativo
    if (organizerAmount < 0) {
      throw new Error('Split calculation resulted in negative organizer amount');
    }

    return {
      totalAmount,
      platformAmount: Math.round(platformAmount * 100) / 100, // Arredonda para 2 casas decimais
      organizerAmount: Math.round(organizerAmount * 100) / 100,
      platformFee: this.props.platformFixedFee,
    };
  }

  /**
   * Atualiza as porcentagens de divisão
   */
  updatePercentages(platformPercentage: number, organizerPercentage: number): void {
    const totalPercentage = platformPercentage + organizerPercentage;
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error('Platform and organizer percentages must sum to 100%');
    }

    if (platformPercentage < 0 || organizerPercentage < 0) {
      throw new Error('Percentages must be positive');
    }

    this.props.platformPercentage = platformPercentage;
    this.props.organizerPercentage = organizerPercentage;
    this.props.updatedAt = new Date();
  }

  /**
   * Atualiza a taxa fixa da plataforma
   */
  updatePlatformFixedFee(fee: number): void {
    if (fee < 0) {
      throw new Error('Platform fixed fee must be non-negative');
    }
    this.props.platformFixedFee = fee;
    this.props.updatedAt = new Date();
  }

  /**
   * Ativa a regra de split
   */
  activate(): void {
    this.props.active = true;
    this.props.updatedAt = new Date();
  }

  /**
   * Desativa a regra de split
   */
  deactivate(): void {
    this.props.active = false;
    this.props.updatedAt = new Date();
  }

  toJSON(): SplitRuleProps {
    return { ...this.props };
  }
}
