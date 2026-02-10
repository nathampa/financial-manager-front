// frontend/src/app/dashboard/accounts/page.tsx
'use client';

import { useEffect, useState } from 'react';
import api, { Account } from '@/lib/api';
import { Plus, CreditCard, Trash2, Pencil, RotateCcw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function AccountsPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'CHECKING',
    initial_balance: '',
    currency: 'BRL',
    color: '#3b82f6',
  });

  useEffect(() => {
    loadAccounts();
  }, [showArchived]);

  const loadAccounts = async () => {
    try {
      const response = await api.get(`/accounts/?include_inactive=${showArchived}`);
      setAccounts(response.data.results || response.data);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'CHECKING',
      initial_balance: '',
      currency: user?.default_currency || 'BRL',
      color: '#3b82f6',
    });
    setEditingAccount(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        initial_balance: parseFloat(formData.initial_balance || '0'),
      };

      if (editingAccount) {
        await api.put(`/accounts/${editingAccount.id}/`, payload);
      } else {
        await api.post('/accounts/', payload);
      }

      setShowModal(false);
      resetForm();
      loadAccounts();
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      initial_balance: String(account.initial_balance ?? 0),
      currency: account.currency || 'BRL',
      color: account.color || '#3b82f6',
    });
    setShowModal(true);
  };

  const handleDelete = async (account: Account) => {
    if (!confirm('Tem certeza que deseja arquivar esta conta?')) return;
    try {
      await api.delete(`/accounts/${account.id}/`);
      loadAccounts();
    } catch (error) {
      console.error('Erro ao arquivar conta:', error);
    }
  };

  const handleRestore = async (account: Account) => {
    try {
      await api.post(`/accounts/${account.id}/restore/`);
      loadAccounts();
    } catch (error) {
      console.error('Erro ao restaurar conta:', error);
    }
  };

  const formatCurrency = (value: number, currency?: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || user?.default_currency || 'BRL',
    }).format(Number(value));
  };

  const getAccountColor = (type: string) => {
    const colors: { [key: string]: string } = {
      CHECKING: '#7c3aed',
      SAVINGS: '#2563eb',
      CREDIT_CARD: '#f97316',
      CASH: '#16a34a',
      INVESTMENT: '#4f46e5',
    };
    return colors[type] || '#6b7280';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Minhas Contas</h1>
          <p className="text-gray-600">Gerencie suas contas financeiras</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            Mostrar arquivadas
          </label>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
          >
            <Plus size={20} />
            Nova Conta
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <div key={account.id} className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: account.color || getAccountColor(account.type) }}
              >
                <CreditCard className="text-white" size={32} />
              </div>
              <div className="flex items-center gap-2">
                {account.is_active === false && (
                  <button
                    onClick={() => handleRestore(account)}
                    className="text-green-600 hover:text-green-700"
                    title="Restaurar"
                  >
                    <RotateCcw size={18} />
                  </button>
                )}
                <button
                  onClick={() => handleEdit(account)}
                  className="text-gray-500 hover:text-gray-700"
                  title="Editar"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => handleDelete(account)}
                  className="text-red-500 hover:text-red-600"
                  title="Arquivar"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-1">{account.name}</h3>
            <p className="text-sm text-gray-500 mb-1">
              {account.type_display} • {account.currency || 'BRL'}
            </p>
            {account.is_active === false && (
              <p className="text-xs text-orange-600 mb-3">Conta arquivada</p>
            )}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Saldo Atual</p>
              <p
                className={`text-2xl font-bold ${
                  account.current_balance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(account.current_balance, account.currency)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingAccount ? 'Editar Conta' : 'Nova Conta'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Nome da conta</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Tipo</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="CHECKING">Conta Corrente</option>
                  <option value="SAVINGS">Poupança</option>
                  <option value="CREDIT_CARD">Cartão de Crédito</option>
                  <option value="CASH">Dinheiro</option>
                  <option value="INVESTMENT">Investimento</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Moeda</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="BRL">BRL</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Cor</label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Saldo inicial</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.initial_balance}
                  onChange={(e) => setFormData({ ...formData, initial_balance: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-900 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                >
                  {editingAccount ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
