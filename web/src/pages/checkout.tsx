import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useCartStore } from '@/contexts/CartContext';
import { useAuthStore } from '@/contexts/AuthContext';
import { ordersApi } from '@/services/api';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import PagarmePaymentForm from '@/components/checkout/PagarmePaymentForm';

interface CheckoutForm {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  paymentMethod: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX';
  couponCode?: string;
}

export default function Checkout() {
  const router = useRouter();
  const { cart, clearCart, fetchCart } = useCartStore();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [pendingOrderData, setPendingOrderData] = useState<CheckoutForm | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.error('Faca login para finalizar a compra');
      router.push('/auth/login?redirect=/checkout');
    }
  }, [authLoading, isAuthenticated, router]);

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

  // Pre-fill form with user data
  useEffect(() => {
    if (user) {
      setValue('name', user.name);
      setValue('email', user.email);
      if (user.cpf) setValue('cpf', user.cpf);
      if (user.phone) setValue('phone', user.phone);
    }
  }, [user, setValue]);

  const [cartLoaded, setCartLoaded] = useState(false);

  // Fetch cart
  useEffect(() => {
    const loadCart = async () => {
      await fetchCart();
      setCartLoaded(true);
    };
    loadCart();
  }, [fetchCart]);

  // Redirect if cart is empty (only after cart has been loaded)
  useEffect(() => {
    if (cartLoaded && cart && cart.items.length === 0) {
      toast.error('Seu carrinho esta vazio');
      router.push('/events');
    }
  }, [cart, router, cartLoaded]);

  const onSubmit = async (data: CheckoutForm) => {
    if (!cart || cart.items.length === 0) {
      toast.error('Seu carrinho esta vazio');
      return;
    }

    // If credit/debit card, show card form instead of creating order immediately
    if (data.paymentMethod === 'CREDIT_CARD' || data.paymentMethod === 'DEBIT_CARD') {
      setPendingOrderData(data);
      setShowCardForm(true);
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

      // Handle PIX payment
      if (data.paymentMethod === 'PIX' && payment?.pix) {
        const pixParams = new URLSearchParams({
          orderId: order.id,
          method: 'pix',
          pixCode: payment.pix.qrCode,
          pixUrl: payment.pix.qrCodeUrl,
          pixExpires: payment.pix.expiresAt,
        });
        router.push(`/checkout/success?${pixParams.toString()}`);
      } else if (data.paymentMethod === 'PIX') {
        router.push(`/checkout/success?orderId=${order.id}&method=pix`);
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.response?.data?.error || 'Erro ao processar pedido');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCardPaymentSuccess = async (cardToken: string, installments: number) => {
    if (!cart || !pendingOrderData) return;

    setIsProcessing(true);

    try {
      // Create order with card token
      const orderData = {
        items: cart.items.map((item) => ({
          ticketId: item.ticket.id,
          quantity: item.quantity,
        })),
        paymentMethod: pendingOrderData.paymentMethod,
        couponCode: pendingOrderData.couponCode || undefined,
        cardToken,
        installments,
      };

      const response = await ordersApi.create(orderData);
      const { order, payment } = response;

      // Check if payment was immediately approved
      if (payment?.card?.status === 'paid') {
        toast.success('Pagamento aprovado!');
      } else {
        toast.success('Pedido criado com sucesso!');
      }

      await clearCart();
      router.push(`/checkout/success?orderId=${order.id}&method=card`);
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.error || 'Erro ao processar pagamento');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCardPaymentError = (error: string) => {
    setIsProcessing(false);
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

  // Show loading while checking auth or cart
  if (authLoading || !cartLoaded || !isAuthenticated) {
    return (
      <div className="container-custom py-16 text-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Carregando...</p>
      </div>
    );
  }

  if (!cart) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Finalizar Compra - Lumera</title>
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
                      {...register('name', { required: 'Nome e obrigatorio' })}
                      error={errors.name?.message}
                    />
                  </div>
                  <Input
                    label="Email"
                    type="email"
                    {...register('email', {
                      required: 'Email e obrigatorio',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Email invalido',
                      },
                    })}
                    error={errors.email?.message}
                  />
                  <Input
                    label="CPF"
                    {...register('cpf', {
                      required: 'CPF e obrigatorio',
                      minLength: { value: 11, message: 'CPF invalido' },
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
                    {...register('phone', { required: 'Telefone e obrigatorio' })}
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
                          Aprovacao imediata
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Pague com QR Code ou Pix Copia e Cola
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
                        <span className="font-semibold">Cartao de Credito</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          Ate 12x sem juros
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Visa, Mastercard, Elo, American Express, Hipercard
                      </p>
                    </div>
                  </label>

                  {/* Debit Card */}
                  <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:border-primary-500 transition">
                    <input
                      type="radio"
                      value="DEBIT_CARD"
                      {...register('paymentMethod')}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-grow">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Cartao de Debito</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          Aprovacao imediata
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Visa, Mastercard, Elo
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
                    placeholder="Digite o codigo do cupom"
                    className="flex-grow"
                  />
                  <Button type="button" variant="outline">
                    Aplicar
                  </Button>
                </div>
              </div>

              {/* Pagar.me Card Form */}
              {showCardForm && (selectedPaymentMethod === 'CREDIT_CARD' || selectedPaymentMethod === 'DEBIT_CARD') && (
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Dados do Cartao</h2>
                    <button
                      type="button"
                      onClick={() => setShowCardForm(false)}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      Voltar
                    </button>
                  </div>
                  <PagarmePaymentForm
                    amount={cart?.total || 0}
                    onSuccess={handleCardPaymentSuccess}
                    onError={handleCardPaymentError}
                    isProcessing={isProcessing}
                  />
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
                          {item.quantity}x R$ {Number(item.ticket.price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>R$ {Number(cart.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Taxa de serviço</span>
                    <span>R$ 0,00</span>
                  </div>
                </div>

                <div className="border-t pt-4 mb-6">
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold">Total</span>
                    <span className="text-2xl font-bold text-primary-500">
                      R$ {Number(cart.total).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Submit Button - Hidden when card form is shown */}
                {!showCardForm && (
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    isLoading={isProcessing}
                    disabled={isProcessing}
                  >
                    {isProcessing
                      ? 'Processando...'
                      : selectedPaymentMethod === 'CREDIT_CARD' || selectedPaymentMethod === 'DEBIT_CARD'
                      ? 'Continuar para Pagamento'
                      : 'Confirmar Pedido'}
                  </Button>
                )}

                <p className="text-xs text-gray-500 text-center mt-4">
                  Ao confirmar, voce concorda com nossos Termos de Uso
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
