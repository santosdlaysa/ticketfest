import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useCartStore } from '@/contexts/CartContext';
import { useAuthStore } from '@/contexts/AuthContext';
import { ordersApi } from '@/services/api';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import StripePaymentForm from '@/components/checkout/StripePaymentForm';

// Initialize Stripe (replace with your publishable key)
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_demo_key'
);

interface CheckoutForm {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  paymentMethod: 'CREDIT_CARD' | 'PIX' | 'BOLETO';
  couponCode?: string;
}

export default function Checkout() {
  const router = useRouter();
  const { cart, clearCart, fetchCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showStripeForm, setShowStripeForm] = useState(false);
  const [pendingOrderData, setPendingOrderData] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CheckoutForm>({
    defaultValues: {
      paymentMethod: 'PIX',
    },
  });

  const selectedPaymentMethod = watch('paymentMethod');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Faça login para finalizar a compra');
      router.push('/auth/login?redirect=/checkout');
    }
  }, [isAuthenticated, router]);

  // Pre-fill form with user data
  useEffect(() => {
    if (user) {
      setValue('name', user.name);
      setValue('email', user.email);
      if (user.cpf) setValue('cpf', user.cpf);
      if (user.phone) setValue('phone', user.phone);
    }
  }, [user, setValue]);

  // Fetch cart
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Redirect if cart is empty
  useEffect(() => {
    if (cart && cart.items.length === 0) {
      toast.error('Seu carrinho está vazio');
      router.push('/events');
    }
  }, [cart, router]);

  const onSubmit = async (data: CheckoutForm) => {
    if (!cart || cart.items.length === 0) {
      toast.error('Seu carrinho está vazio');
      return;
    }

    // If credit card, show Stripe form instead of creating order immediately
    if (data.paymentMethod === 'CREDIT_CARD') {
      setPendingOrderData(data);
      setShowStripeForm(true);
      return;
    }

    setIsProcessing(true);

    try {
      // Prepare order data
      const orderData = {
        items: cart.items.map((item) => ({
          ticketId: item.ticket.id,
          quantity: item.quantity,
        })),
        paymentMethod: data.paymentMethod,
        couponCode: data.couponCode || undefined,
      };

      // Create order
      const response = await ordersApi.create(orderData);
      const { order, payment } = response;

      toast.success('Pedido criado com sucesso!');

      // Clear cart after successful order
      await clearCart();

      // Handle different payment methods
      if (data.paymentMethod === 'PIX') {
        router.push(`/checkout/success?orderId=${order.id}&method=pix`);
      } else if (data.paymentMethod === 'BOLETO') {
        router.push(`/checkout/success?orderId=${order.id}&method=boleto`);
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.response?.data?.error || 'Erro ao processar pedido');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStripePaymentSuccess = async (paymentMethodId: string) => {
    if (!cart || !pendingOrderData) return;

    setIsProcessing(true);

    try {
      // Create order with Stripe payment method
      const orderData = {
        items: cart.items.map((item) => ({
          ticketId: item.ticket.id,
          quantity: item.quantity,
        })),
        paymentMethod: 'CREDIT_CARD' as const,
        couponCode: pendingOrderData.couponCode || undefined,
      };

      const response = await ordersApi.create(orderData);
      const { order } = response;

      // In a real implementation, you would confirm the payment with Stripe here
      // await ordersApi.confirmPayment(order.id, paymentMethodId);

      toast.success('Pagamento processado com sucesso!');
      await clearCart();
      router.push(`/checkout/success?orderId=${order.id}&method=card`);
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.error || 'Erro ao processar pagamento');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStripePaymentError = (error: string) => {
    setIsProcessing(false);
    // Error is already shown via toast in StripePaymentForm
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  if (!cart || !isAuthenticated) {
    return null; // Loading or redirecting
  }

  return (
    <>
      <Head>
        <title>Finalizar Compra - TicketFest</title>
      </Head>

      <div className="container-custom py-8">
        <h1 className="text-3xl font-bold mb-8">Finalizar Compra</h1>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column - Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Data */}
              <div className="card p-6">
                <h2 className="text-xl font-bold mb-4">Dados Pessoais</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      label="Nome Completo"
                      {...register('name', { required: 'Nome é obrigatório' })}
                      error={errors.name?.message}
                    />
                  </div>
                  <Input
                    label="Email"
                    type="email"
                    {...register('email', {
                      required: 'Email é obrigatório',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Email inválido',
                      },
                    })}
                    error={errors.email?.message}
                  />
                  <Input
                    label="CPF"
                    {...register('cpf', {
                      required: 'CPF é obrigatório',
                      minLength: { value: 11, message: 'CPF inválido' },
                    })}
                    onChange={(e) => {
                      const formatted = formatCPF(e.target.value);
                      setValue('cpf', formatted);
                    }}
                    error={errors.cpf?.message}
                    placeholder="000.000.000-00"
                  />
                  <Input
                    label="Telefone"
                    {...register('phone', { required: 'Telefone é obrigatório' })}
                    onChange={(e) => {
                      const formatted = formatPhone(e.target.value);
                      setValue('phone', formatted);
                    }}
                    error={errors.phone?.message}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="card p-6">
                <h2 className="text-xl font-bold mb-4">Forma de Pagamento</h2>

                <div className="space-y-3">
                  {/* PIX */}
                  <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:border-primary-500 transition">
                    <input
                      type="radio"
                      value="PIX"
                      {...register('paymentMethod')}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-grow">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">PIX</span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          Aprovação imediata
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Pague com QR Code ou Pix Copia e Cola
                      </p>
                    </div>
                  </label>

                  {/* Boleto */}
                  <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:border-primary-500 transition">
                    <input
                      type="radio"
                      value="BOLETO"
                      {...register('paymentMethod')}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-grow">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Boleto Bancário</span>
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                          Até 3 dias úteis
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Vencimento em 3 dias úteis
                      </p>
                    </div>
                  </label>

                  {/* Credit Card */}
                  <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:border-primary-500 transition">
                    <input
                      type="radio"
                      value="CREDIT_CARD"
                      {...register('paymentMethod')}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-grow">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Cartão de Crédito</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          Aprovação imediata
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Visa, Mastercard, Elo, American Express
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Coupon (Optional) */}
              <div className="card p-6">
                <h2 className="text-xl font-bold mb-4">Cupom de Desconto (Opcional)</h2>
                <div className="flex gap-2">
                  <Input
                    {...register('couponCode')}
                    placeholder="Digite o código do cupom"
                    className="flex-grow"
                  />
                  <Button type="button" variant="outline">
                    Aplicar
                  </Button>
                </div>
              </div>

              {/* Stripe Credit Card Form */}
              {showStripeForm && selectedPaymentMethod === 'CREDIT_CARD' && (
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Dados do Cartão</h2>
                    <button
                      type="button"
                      onClick={() => setShowStripeForm(false)}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      ← Voltar
                    </button>
                  </div>
                  <Elements stripe={stripePromise}>
                    <StripePaymentForm
                      amount={cart?.total || 0}
                      onSuccess={handleStripePaymentSuccess}
                      onError={handleStripePaymentError}
                      isProcessing={isProcessing}
                    />
                  </Elements>
                </div>
              )}
            </div>

            {/* Right column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="card p-6 sticky top-24">
                <h2 className="text-xl font-bold mb-4">Resumo do Pedido</h2>

                {/* Items */}
                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex gap-3 pb-3 border-b">
                      <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0">
                        {item.ticket.event.images[0] ? (
                          <Image
                            src={item.ticket.event.images[0]}
                            alt={item.ticket.event.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200" />
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <h4 className="font-semibold text-sm truncate">
                          {item.ticket.event.name}
                        </h4>
                        <p className="text-xs text-gray-600">{item.ticket.name}</p>
                        <p className="text-xs text-gray-500">
                          {item.quantity}x R$ {item.ticket.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>R$ {cart.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Taxa de serviço</span>
                    <span>R$ 0,00</span>
                  </div>
                </div>

                <div className="border-t pt-4 mb-6">
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold">Total</span>
                    <span className="text-2xl font-bold text-primary-600">
                      R$ {cart.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Submit Button - Hidden when Stripe form is shown */}
                {!showStripeForm && (
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    isLoading={isProcessing}
                    disabled={isProcessing}
                  >
                    {isProcessing
                      ? 'Processando...'
                      : selectedPaymentMethod === 'CREDIT_CARD'
                      ? 'Continuar para Pagamento'
                      : 'Confirmar Pedido'}
                  </Button>
                )}

                <p className="text-xs text-gray-500 text-center mt-4">
                  Ao confirmar, você concorda com nossos Termos de Uso
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
