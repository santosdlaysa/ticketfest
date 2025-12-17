import React, { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { ordersApi } from '@/services/api';
import { Button } from '@/components/common/Button';
import type { Order } from '@/types';

interface PixData {
  qrCode: string;
  qrCodeUrl: string;
  expiresAt: string;
}

export default function CheckoutSuccess() {
  const router = useRouter();
  const { orderId, method, pixCode: pixCodeParam, pixUrl, pixExpires } = router.query;
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  useEffect(() => {
    if (orderId && typeof orderId === 'string') {
      fetchOrder(orderId);
    }
  }, [orderId]);

  useEffect(() => {
    // Get PIX data from URL params if available
    if (method === 'pix' && pixCodeParam) {
      setPixData({
        qrCode: pixCodeParam as string,
        qrCodeUrl: (pixUrl as string) || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixCodeParam as string)}`,
        expiresAt: (pixExpires as string) || new Date(Date.now() + 3600000).toISOString(),
      });
    }
  }, [method, pixCodeParam, pixUrl, pixExpires]);

  const fetchOrder = async (id: string) => {
    try {
      setIsLoading(true);
      const orderData = await ordersApi.getById(id);
      setOrder(orderData);

      // If PIX and no URL params, generate fallback QR code
      if (method === 'pix' && !pixCodeParam) {
        const fallbackPixCode = `00020126580014br.gov.bcb.pix0136${id}520400005303986540${orderData.total.toFixed(
          2
        )}5802BR5925Lumera TECNOLOGIA6009SAO PAULO62070503***6304`;
        setPixData({
          qrCode: fallbackPixCode,
          qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(fallbackPixCode)}`,
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        });
      }
    } catch (error: any) {
      console.error('Error fetching order:', error);
      toast.error('Erro ao carregar pedido');
    } finally {
      setIsLoading(false);
    }
  };

  const copyPixCode = () => {
    if (pixData?.qrCode) {
      navigator.clipboard.writeText(pixData.qrCode);
      toast.success('Codigo PIX copiado!');
    }
  };

  const downloadBoleto = () => {
    toast.success('Download do boleto iniciado');
    // In a real implementation, this would download the actual boleto PDF
  };

  const checkPaymentStatus = useCallback(async () => {
    if (!orderId || typeof orderId !== 'string' || isCheckingPayment || paymentConfirmed) return;

    setIsCheckingPayment(true);
    try {
      const result = await ordersApi.checkPaymentStatus(orderId);

      if (result.status === 'PAID') {
        setPaymentConfirmed(true);
        toast.success(result.message);
        // Refresh order data
        fetchOrder(orderId);
      } else {
        toast.info(result.message);
      }
    } catch (error: any) {
      console.error('Error checking payment:', error);
      toast.error('Erro ao verificar pagamento');
    } finally {
      setIsCheckingPayment(false);
    }
  }, [orderId, isCheckingPayment, paymentConfirmed]);

  // Auto-check payment status every 30 seconds for PIX
  useEffect(() => {
    if (method === 'pix' && orderId && !paymentConfirmed) {
      const interval = setInterval(() => {
        checkPaymentStatus();
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, [method, orderId, paymentConfirmed, checkPaymentStatus]);

  if (isLoading) {
    return (
      <div className="container-custom py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">Carregando pedido...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-custom py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Pedido não encontrado</h2>
        <Link href="/events">
          <Button>Voltar para Eventos</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Pedido Confirmado - Lumera</title>
      </Head>

      <div className="container-custom py-8">
        <div className="max-w-3xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2">Pedido Realizado com Sucesso!</h1>
            <p className="text-gray-600">
              Número do pedido: <span className="font-semibold">{order.id.slice(0, 8)}</span>
            </p>
          </div>

          {/* Payment Instructions */}
          {method === 'pix' && pixData && (
            <div className="card p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                </svg>
                Pague com PIX
              </h2>

              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Escaneie o QR Code abaixo com o aplicativo do seu banco ou copie o codigo PIX:
                </p>

                {/* QR Code Image */}
                <div className="flex justify-center mb-4">
                  <div className="bg-white p-4 rounded-lg">
                    <img
                      src={pixData.qrCodeUrl}
                      alt="QR Code PIX"
                      width={200}
                      height={200}
                      className="w-48 h-48"
                    />
                  </div>
                </div>

                {/* Expiration info */}
                <p className="text-sm text-center text-gray-600 mb-3">
                  Valido ate: {format(new Date(pixData.expiresAt), 'dd/MM/yyyy HH:mm')}
                </p>

                <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-3 mb-3">
                  <p className="text-xs font-mono break-all text-gray-700">{pixData.qrCode}</p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={copyPixCode} variant="outline" className="flex-1">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copiar PIX
                  </Button>
                  <Button
                    onClick={checkPaymentStatus}
                    disabled={isCheckingPayment || paymentConfirmed}
                    className="flex-1"
                  >
                    {isCheckingPayment ? (
                      <>
                        <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Verificando...
                      </>
                    ) : paymentConfirmed ? (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Pago!
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Já Paguei
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {paymentConfirmed ? (
                <div className="bg-green-50 border-l-4 border-green-500 p-4">
                  <div className="flex">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm text-green-700">
                      <p className="font-semibold">Pagamento confirmado!</p>
                      <p>Seus ingressos foram enviados por email.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                  <div className="flex">
                    <svg
                      className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="text-sm text-blue-700">
                      <p className="font-semibold">O pagamento e instantaneo!</p>
                      <p>
                        Apos pagar, clique em "Ja Paguei" ou aguarde a confirmacao automatica.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {method === 'boleto' && (
            <div className="card p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
                </svg>
                Boleto Bancário
              </h2>

              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Valor</p>
                    <p className="text-lg font-bold">R$ {Number(order.total).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Vencimento</p>
                    <p className="text-lg font-bold">
                      {format(
                        new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                        'dd/MM/yyyy'
                      )}
                    </p>
                  </div>
                </div>

                <Button onClick={downloadBoleto} className="w-full">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Baixar Boleto
                </Button>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                <div className="flex">
                  <svg
                    className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="text-sm text-yellow-700">
                    <p className="font-semibold">Atenção ao prazo!</p>
                    <p>
                      O boleto vence em 3 dias úteis. Após a confirmação do pagamento, você
                      receberá seus ingressos por email em até 24h.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {method === 'card' && (
            <div className="card p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
                </svg>
                Pagamento Aprovado
              </h2>

              <div className="bg-green-50 border-l-4 border-green-500 p-4">
                <div className="flex">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="text-sm text-green-700">
                    <p className="font-semibold">Pagamento confirmado!</p>
                    <p>Você receberá seus ingressos por email em alguns minutos.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Order Details */}
          <div className="card p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Detalhes do Pedido</h2>

            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between pb-3 border-b last:border-0">
                  <div>
                    <p className="font-semibold">{item.ticket.name}</p>
                    <p className="text-sm text-gray-600">
                      {item.quantity}x R$ {Number(item.price).toFixed(2)}
                    </p>
                  </div>
                  <p className="font-semibold">R$ {(item.quantity * Number(item.price)).toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="border-t mt-4 pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary-500">R$ {Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="card p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Próximos Passos</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Confirme o pagamento usando o método selecionado</li>
              <li>Aguarde a confirmação por email (normalmente instantâneo)</li>
              <li>Acesse seus ingressos na área "Meus Ingressos"</li>
              <li>Apresente o QR Code na entrada do evento</li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/user/orders" className="flex-1">
              <Button variant="outline" className="w-full">
                Ver Meus Pedidos
              </Button>
            </Link>
            <Link href="/events" className="flex-1">
              <Button className="w-full">Explorar Mais Eventos</Button>
            </Link>
          </div>

          {/* Help */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-600">
              Problemas com o pagamento?{' '}
              <a href="#" className="text-primary-600 hover:underline">
                Entre em contato
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
