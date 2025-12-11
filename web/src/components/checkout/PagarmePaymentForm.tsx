import React, { useState } from 'react';
import { Button } from '@/components/common/Button';
import toast from 'react-hot-toast';
import { pagarmeApi } from '@/services/api';

interface PagarmePaymentFormProps {
  amount: number;
  onSuccess: (cardToken: string, installments: number) => void;
  onError: (error: string) => void;
  isProcessing: boolean;
}

interface CardData {
  number: string;
  holderName: string;
  expMonth: string;
  expYear: string;
  cvv: string;
}

export default function PagarmePaymentForm({
  amount,
  onSuccess,
  onError,
  isProcessing,
}: PagarmePaymentFormProps) {
  const [cardData, setCardData] = useState<CardData>({
    number: '',
    holderName: '',
    expMonth: '',
    expYear: '',
    cvv: '',
  });
  const [installments, setInstallments] = useState(1);
  const [errors, setErrors] = useState<Partial<CardData>>({});
  const [isTokenizing, setIsTokenizing] = useState(false);

  // Calculate installment options
  const getInstallmentOptions = () => {
    const options = [];
    const maxInstallments = amount >= 100 ? 12 : amount >= 50 ? 6 : 3;

    for (let i = 1; i <= maxInstallments; i++) {
      const installmentValue = amount / i;
      if (installmentValue >= 10) { // Minimum R$ 10 per installment
        options.push({
          value: i,
          label: i === 1
            ? `1x de R$ ${amount.toFixed(2)} (sem juros)`
            : `${i}x de R$ ${installmentValue.toFixed(2)} (sem juros)`,
        });
      }
    }
    return options;
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ').slice(0, 19) : cleaned;
  };

  const handleInputChange = (field: keyof CardData, value: string) => {
    let formattedValue = value;

    switch (field) {
      case 'number':
        formattedValue = formatCardNumber(value);
        break;
      case 'expMonth':
        formattedValue = value.replace(/\D/g, '').slice(0, 2);
        break;
      case 'expYear':
        formattedValue = value.replace(/\D/g, '').slice(0, 2);
        break;
      case 'cvv':
        formattedValue = value.replace(/\D/g, '').slice(0, 4);
        break;
    }

    setCardData(prev => ({ ...prev, [field]: formattedValue }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validateCard = (): boolean => {
    const newErrors: Partial<CardData> = {};

    const cardNumber = cardData.number.replace(/\s/g, '');
    if (!cardNumber || cardNumber.length < 13) {
      newErrors.number = 'Numero do cartao invalido';
    }

    if (!cardData.holderName.trim()) {
      newErrors.holderName = 'Nome do titular e obrigatorio';
    }

    const month = parseInt(cardData.expMonth, 10);
    if (!cardData.expMonth || month < 1 || month > 12) {
      newErrors.expMonth = 'Mes invalido';
    }

    const year = parseInt(cardData.expYear, 10);
    const currentYear = new Date().getFullYear() % 100;
    if (!cardData.expYear || year < currentYear) {
      newErrors.expYear = 'Ano invalido';
    }

    if (!cardData.cvv || cardData.cvv.length < 3) {
      newErrors.cvv = 'CVV invalido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateCard()) {
      return;
    }

    setIsTokenizing(true);

    try {
      // Create card token via backend
      const response = await pagarmeApi.createCardToken({
        number: cardData.number.replace(/\s/g, ''),
        holderName: cardData.holderName,
        expMonth: parseInt(cardData.expMonth, 10),
        expYear: 2000 + parseInt(cardData.expYear, 10),
        cvv: cardData.cvv,
      });

      onSuccess(response.token, installments);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Erro ao processar cartao';
      onError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsTokenizing(false);
    }
  };

  const installmentOptions = getInstallmentOptions();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Card Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Numero do Cartao
        </label>
        <input
          type="text"
          value={cardData.number}
          onChange={(e) => handleInputChange('number', e.target.value)}
          placeholder="0000 0000 0000 0000"
          className={`input w-full ${errors.number ? 'border-red-500' : ''}`}
          disabled={isProcessing || isTokenizing}
          maxLength={19}
        />
        {errors.number && (
          <p className="mt-1 text-sm text-red-600">{errors.number}</p>
        )}
      </div>

      {/* Cardholder Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nome do Titular
        </label>
        <input
          type="text"
          value={cardData.holderName}
          onChange={(e) => handleInputChange('holderName', e.target.value.toUpperCase())}
          placeholder="NOME COMO ESTA NO CARTAO"
          className={`input w-full ${errors.holderName ? 'border-red-500' : ''}`}
          disabled={isProcessing || isTokenizing}
        />
        {errors.holderName && (
          <p className="mt-1 text-sm text-red-600">{errors.holderName}</p>
        )}
      </div>

      {/* Expiry and CVC */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mes</label>
          <input
            type="text"
            value={cardData.expMonth}
            onChange={(e) => handleInputChange('expMonth', e.target.value)}
            placeholder="MM"
            className={`input w-full ${errors.expMonth ? 'border-red-500' : ''}`}
            disabled={isProcessing || isTokenizing}
            maxLength={2}
          />
          {errors.expMonth && (
            <p className="mt-1 text-sm text-red-600">{errors.expMonth}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ano</label>
          <input
            type="text"
            value={cardData.expYear}
            onChange={(e) => handleInputChange('expYear', e.target.value)}
            placeholder="AA"
            className={`input w-full ${errors.expYear ? 'border-red-500' : ''}`}
            disabled={isProcessing || isTokenizing}
            maxLength={2}
          />
          {errors.expYear && (
            <p className="mt-1 text-sm text-red-600">{errors.expYear}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
          <input
            type="text"
            value={cardData.cvv}
            onChange={(e) => handleInputChange('cvv', e.target.value)}
            placeholder="123"
            className={`input w-full ${errors.cvv ? 'border-red-500' : ''}`}
            disabled={isProcessing || isTokenizing}
            maxLength={4}
          />
          {errors.cvv && (
            <p className="mt-1 text-sm text-red-600">{errors.cvv}</p>
          )}
        </div>
      </div>

      {/* Installments */}
      {installmentOptions.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Parcelas
          </label>
          <select
            value={installments}
            onChange={(e) => setInstallments(parseInt(e.target.value, 10))}
            className="input w-full"
            disabled={isProcessing || isTokenizing}
          >
            {installmentOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Security Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="text-xs text-gray-600">
              <span className="font-semibold">Pagamento 100% seguro</span>
              <br />
              Seus dados sao criptografados e protegidos pela Pagar.me. Nao armazenamos
              informacoes do cartao.
            </p>
          </div>
        </div>
      </div>

      {/* Amount Info */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700">Total a pagar:</span>
          <span className="text-2xl font-bold text-primary-600">
            R$ {amount.toFixed(2)}
          </span>
        </div>
        {installments > 1 && (
          <p className="text-sm text-gray-600 mt-1">
            em {installments}x de R$ {(amount / installments).toFixed(2)}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full"
        size="lg"
        isLoading={isProcessing || isTokenizing}
        disabled={isProcessing || isTokenizing}
      >
        {isProcessing || isTokenizing
          ? 'Processando Pagamento...'
          : `Pagar R$ ${amount.toFixed(2)}`}
      </Button>

      {/* Accepted Cards */}
      <div className="text-center">
        <p className="text-xs text-gray-500 mb-2">Aceitamos:</p>
        <div className="flex justify-center gap-2">
          {['Visa', 'Mastercard', 'Elo', 'Amex', 'Hipercard'].map((card) => (
            <div
              key={card}
              className="px-3 py-1 bg-gray-100 rounded text-xs font-semibold text-gray-600"
            >
              {card}
            </div>
          ))}
        </div>
      </div>
    </form>
  );
}
