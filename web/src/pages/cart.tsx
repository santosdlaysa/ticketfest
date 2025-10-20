import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useCartStore } from '@/contexts/CartContext';
import { Button } from '@/components/common/Button';

export default function Cart() {
  const router = useRouter();
  const { cart, updateQuantity, removeItem, isLoading } = useCartStore();

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    try {
      await updateQuantity(itemId, quantity);
      toast.success('Quantidade atualizada');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao atualizar');
    }
  };

  const handleRemove = async (itemId: string) => {
    try {
      await removeItem(itemId);
      toast.success('Item removido');
    } catch (error: any) {
      toast.error('Erro ao remover item');
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <>
        <Head><title>Carrinho - TicketFest</title></Head>
        <div className="container-custom py-16 text-center">
          <div className="max-w-md mx-auto">
            <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h2 className="text-2xl font-bold mb-2">Seu carrinho está vazio</h2>
            <p className="text-gray-600 mb-6">Adicione ingressos para continuar</p>
            <Link href="/events"><Button>Explorar Eventos</Button></Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>Carrinho ({cart.itemCount}) - TicketFest</title></Head>
      <div className="container-custom py-8">
        <h1 className="text-3xl font-bold mb-8">Meu Carrinho</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div key={item.id} className="card p-4 flex gap-4">
                <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                  {item.ticket.event.images[0] ? (
                    <Image src={item.ticket.event.images[0]} alt={item.ticket.event.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary-100" />
                  )}
                </div>

                <div className="flex-grow">
                  <h3 className="font-semibold text-lg">{item.ticket.event.name}</h3>
                  <p className="text-sm text-gray-600">{item.ticket.name}</p>
                  <p className="text-sm text-gray-500">{format(new Date(item.ticket.event.date), "dd/MM/yyyy 'às' HH:mm")}</p>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded border hover:bg-gray-100"
                        disabled={isLoading}
                      >-</button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded border hover:bg-gray-100"
                        disabled={isLoading}
                      >+</button>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-bold text-lg">R$ {(item.ticket.price * item.quantity).toFixed(2)}</span>
                      <button onClick={() => handleRemove(item.id)} className="text-red-600 hover:text-red-700" disabled={isLoading}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-4">Resumo do Pedido</h2>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal ({cart.itemCount} item{cart.itemCount > 1 ? 's' : ''})</span>
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
                  <span className="text-2xl font-bold text-primary-600">R$ {cart.total.toFixed(2)}</span>
                </div>
              </div>

              <Button className="w-full mb-3" size="lg" onClick={() => router.push('/checkout')}>
                Finalizar Compra
              </Button>
              <Link href="/events">
                <Button variant="outline" className="w-full">Continuar Comprando</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
