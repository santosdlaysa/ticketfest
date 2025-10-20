import React, { useState } from 'react';
import {
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/common/Button';
import toast from 'react-hot-toast';

interface StripePaymentFormProps {
  amount: number;
  onSuccess: (paymentMethodId: string) => void;
  onError: (error: string) => void;
  isProcessing: boolean;
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1f2937',
      '::placeholder': {
        color: '#9ca3af',
      },
    },
    invalid: {
      color: '#ef4444',
    },
  },
};

export default function StripePaymentForm({
  amount,
  onSuccess,
  onError,
  isProcessing,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardholderName, setCardholderName] = useState('');
  const [errors, setErrors] = useState<{
    cardNumber?: string;
    cardExpiry?: string;
    cardCvc?: string;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    if (!cardholderName.trim()) {
      toast.error('Digite o nome do titular do cartão');
      return;
    }

    const cardNumberElement = elements.getElement(CardNumberElement);
    if (!cardNumberElement) {
      return;
    }

    try {
      // Create payment method
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardNumberElement,
        billing_details: {
          name: cardholderName,
        },
      });

      if (error) {
        onError(error.message || 'Erro ao processar pagamento');
        toast.error(error.message || 'Erro ao processar pagamento');
      } else if (paymentMethod) {
        onSuccess(paymentMethod.id);
      }
    } catch (err: any) {
      onError('Erro ao processar pagamento');
      toast.error('Erro ao processar pagamento');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Cardholder Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nome do Titular
        </label>
        <input
          type="text"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          placeholder="Nome como está no cartão"
          className="input w-full"
          disabled={isProcessing}
          required
        />
      </div>

      {/* Card Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Número do Cartão
        </label>
        <div className="input p-3">
          <CardNumberElement
            options={CARD_ELEMENT_OPTIONS}
            onChange={(e) => {
              if (e.error) {
                setErrors((prev) => ({ ...prev, cardNumber: e.error?.message }));
              } else {
                setErrors((prev) => ({ ...prev, cardNumber: undefined }));
              }
            }}
          />
        </div>
        {errors.cardNumber && (
          <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>
        )}
      </div>

      {/* Expiry and CVC */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Validade</label>
          <div className="input p-3">
            <CardExpiryElement
              options={CARD_ELEMENT_OPTIONS}
              onChange={(e) => {
                if (e.error) {
                  setErrors((prev) => ({ ...prev, cardExpiry: e.error?.message }));
                } else {
                  setErrors((prev) => ({ ...prev, cardExpiry: undefined }));
                }
              }}
            />
          </div>
          {errors.cardExpiry && (
            <p className="mt-1 text-sm text-red-600">{errors.cardExpiry}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
          <div className="input p-3">
            <CardCvcElement
              options={CARD_ELEMENT_OPTIONS}
              onChange={(e) => {
                if (e.error) {
                  setErrors((prev) => ({ ...prev, cardCvc: e.error?.message }));
                } else {
                  setErrors((prev) => ({ ...prev, cardCvc: undefined }));
                }
              }}
            />
          </div>
          {errors.cardCvc && <p className="mt-1 text-sm text-red-600">{errors.cardCvc}</p>}
        </div>
      </div>

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
              Seus dados são criptografados e protegidos pelo Stripe. Não armazenamos
              informações do cartão.
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
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full"
        size="lg"
        isLoading={isProcessing}
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? 'Processando Pagamento...' : `Pagar R$ ${amount.toFixed(2)}`}
      </Button>

      {/* Accepted Cards */}
      <div className="text-center">
        <p className="text-xs text-gray-500 mb-2">Aceitamos:</p>
        <div className="flex justify-center gap-2">
          {['Visa', 'Mastercard', 'Elo', 'Amex'].map((card) => (
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
