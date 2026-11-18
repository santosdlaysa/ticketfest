import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { ticketBatchApi, TicketBatch, TicketBatchesResponse } from '@/services/api';

interface BatchForm {
  name: string;
  price: number;
  quantity: number;
  salesStart: string;
  salesEnd: string;
}

interface BatchManagerProps {
  ticketId: string;
  ticketName: string;
  onClose?: () => void;
}

export function BatchManager({ ticketId, ticketName, onClose }: BatchManagerProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TicketBatchesResponse | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingBatch, setEditingBatch] = useState<TicketBatch | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<BatchForm>();

  useEffect(() => {
    loadBatches();
  }, [ticketId]);

  const loadBatches = async () => {
    try {
      setLoading(true);
      const result = await ticketBatchApi.getByTicket(ticketId);
      setData(result);
    } catch (error: any) {
      toast.error('Erro ao carregar lotes');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (formData: BatchForm) => {
    try {
      setSubmitting(true);
      const batchData = {
        name: formData.name,
        price: Number(formData.price),
        quantity: Number(formData.quantity),
        salesStart: new Date(formData.salesStart).toISOString(),
        salesEnd: new Date(formData.salesEnd).toISOString(),
      };

      if (editingBatch) {
        await ticketBatchApi.update(ticketId, editingBatch.id, batchData);
        toast.success('Lote atualizado com sucesso!');
      } else {
        await ticketBatchApi.create(ticketId, batchData);
        toast.success('Lote criado com sucesso!');
      }

      setShowForm(false);
      setEditingBatch(null);
      reset();
      loadBatches();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao salvar lote');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (batch: TicketBatch) => {
    setEditingBatch(batch);
    setValue('name', batch.name);
    setValue('price', batch.price);
    setValue('quantity', batch.quantity);
    setValue('salesStart', new Date(batch.salesStart).toISOString().slice(0, 16));
    setValue('salesEnd', new Date(batch.salesEnd).toISOString().slice(0, 16));
    setShowForm(true);
  };

  const handleDelete = async (batchId: string) => {
    if (!confirm('Tem certeza que deseja excluir este lote?')) return;

    try {
      setDeletingId(batchId);
      await ticketBatchApi.delete(ticketId, batchId);
      toast.success('Lote excluído com sucesso');
      loadBatches();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao excluir lote');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (batch: TicketBatch) => {
    try {
      await ticketBatchApi.update(ticketId, batch.id, { isActive: !batch.isActive });
      toast.success(batch.isActive ? 'Lote desativado' : 'Lote ativado');
      loadBatches();
    } catch (error: any) {
      toast.error('Erro ao atualizar lote');
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingBatch(null);
    reset();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Lotes de Venda</h3>
          <p className="text-sm text-gray-600">Ingresso: {ticketName}</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Summary */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">Total</div>
            <div className="text-xl font-bold">{data.totalQuantity}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-sm text-green-600">Vendidos</div>
            <div className="text-xl font-bold text-green-700">{data.totalSold}</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-sm text-blue-600">Disponíveis</div>
            <div className="text-xl font-bold text-blue-700">{data.totalAvailable}</div>
          </div>
        </div>
      )}

      {/* Current Batch Badge */}
      {data?.currentBatch && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-primary-600 text-white text-xs font-medium rounded">
              Lote Atual
            </span>
            <span className="font-medium">{data.currentBatch.name}</span>
            <span className="text-gray-600">-</span>
            <span className="font-semibold text-primary-600">
              R$ {Number(data.currentBatch.price).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm ? (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium mb-4">
            {editingBatch ? 'Editar Lote' : 'Novo Lote'}
          </h4>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nome do Lote *"
                placeholder="Ex: 1º Lote, 2º Lote, Promocional"
                error={errors.name?.message}
                {...register('name', { required: 'Nome é obrigatório' })}
              />
              <Input
                label="Preço (R$) *"
                type="number"
                step="0.01"
                error={errors.price?.message}
                {...register('price', {
                  required: 'Preço é obrigatório',
                  min: { value: 0, message: 'Preço deve ser positivo' },
                })}
              />
              <Input
                label="Quantidade *"
                type="number"
                error={errors.quantity?.message}
                {...register('quantity', {
                  required: 'Quantidade é obrigatória',
                  min: { value: 1, message: 'Mínimo 1' },
                })}
              />
              <div className="hidden md:block"></div>
              <Input
                label="Início das Vendas *"
                type="datetime-local"
                error={errors.salesStart?.message}
                {...register('salesStart', { required: 'Data de início é obrigatória' })}
              />
              <Input
                label="Fim das Vendas *"
                type="datetime-local"
                error={errors.salesEnd?.message}
                {...register('salesEnd', { required: 'Data de fim é obrigatória' })}
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleCancelForm} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" isLoading={submitting} className="flex-1">
                {editingBatch ? 'Atualizar' : 'Criar'} Lote
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <Button onClick={() => setShowForm(true)} variant="outline" className="w-full">
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Adicionar Lote
        </Button>
      )}

      {/* Batches List */}
      <div className="space-y-3">
        {data?.batches.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p>Nenhum lote configurado</p>
            <p className="text-sm">Configure lotes para vender ingressos com preços diferenciados por período</p>
          </div>
        ) : (
          data?.batches.map((batch, index) => (
            <div
              key={batch.id}
              className={`border rounded-lg p-4 ${
                batch.isOnSale
                  ? 'border-primary-300 bg-primary-50'
                  : batch.isSoldOut
                  ? 'border-red-200 bg-red-50'
                  : !batch.isActive
                  ? 'border-gray-200 bg-gray-50 opacity-60'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">#{index + 1}</span>
                  <h4 className="font-medium">{batch.name}</h4>
                  {batch.isOnSale && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      Em Venda
                    </span>
                  )}
                  {batch.isSoldOut && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                      Esgotado
                    </span>
                  )}
                  {!batch.isActive && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                      Inativo
                    </span>
                  )}
                </div>
                <div className="text-xl font-bold text-primary-600">
                  R$ {Number(batch.price).toFixed(2)}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
                <div>
                  <span className="text-gray-500">Quantidade:</span>
                  <p className="font-medium">{batch.quantity}</p>
                </div>
                <div>
                  <span className="text-gray-500">Vendidos:</span>
                  <p className="font-medium">{batch.sold}</p>
                </div>
                <div>
                  <span className="text-gray-500">Disponíveis:</span>
                  <p className="font-medium">{batch.available}</p>
                </div>
                <div>
                  <span className="text-gray-500">Progresso:</span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-2 bg-primary-600 rounded-full"
                        style={{ width: `${batch.salesProgress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium">{batch.salesProgress.toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-500 mb-3">
                <span>Vendas: </span>
                {new Date(batch.salesStart).toLocaleDateString('pt-BR')} {' '}
                {new Date(batch.salesStart).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                <span> até </span>
                {new Date(batch.salesEnd).toLocaleDateString('pt-BR')} {' '}
                {new Date(batch.salesEnd).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(batch)}
                >
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleActive(batch)}
                >
                  {batch.isActive ? 'Desativar' : 'Ativar'}
                </Button>
                {batch.sold === 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(batch.id)}
                    isLoading={deletingId === batch.id}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    Excluir
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
