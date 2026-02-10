// frontend/src/app/dashboard/transactions/page.tsx
'use client';

import { useEffect, useState } from 'react';
import api, { Transaction, Account, Category } from '@/lib/api';
import { Plus, Search, Filter, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [pagination, setPagination] = useState({ next: null as string | null, previous: null as string | null, count: 0 });
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    account: '',
    category: '',
    status: '',
    start_date: '',
    end_date: '',
    ordering: '-date',
    include_cancelled: false,
  });

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'EXPENSE',
    status: 'CONFIRMED',
    date: new Date().toISOString().split('T')[0],
    account: '',
    category: '',
    notes: '',
    receipt_url: '',
    is_reconciled: false,
    tags: '',
  });

  useEffect(() => {
    loadStaticData();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  useEffect(() => {
    loadTransactions();
  }, [filters, page]);

  const loadStaticData = async () => {
    try {
      const [accountsRes, categoriesRes] = await Promise.all([
        api.get('/accounts/'),
        api.get('/categories/'),
      ]);
      setAccounts(accountsRes.data.results || accountsRes.data);
      setCategories(categoriesRes.data.results || categoriesRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.type) params.set('type', filters.type);
      if (filters.account) params.set('account', filters.account);
      if (filters.category) params.set('category', filters.category);
      if (filters.status) params.set('status', filters.status);
      if (filters.start_date) params.set('start_date', filters.start_date);
      if (filters.end_date) params.set('end_date', filters.end_date);
      if (filters.ordering) params.set('ordering', filters.ordering);
      if (filters.include_cancelled) params.set('include_cancelled', 'true');
      params.set('page', String(page));

      const response = await api.get(`/transactions/?${params.toString()}`);
      setTransactions(response.data.results || response.data);
      setPagination({
        next: response.data.next || null,
        previous: response.data.previous || null,
        count: response.data.count || 0,
      });
    } catch (error) {
      console.error('Erro ao carregar transaes:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      type: 'EXPENSE',
      status: 'CONFIRMED',
      date: new Date().toISOString().split('T')[0],
      account: '',
      category: '',
      notes: '',
      receipt_url: '',
      is_reconciled: false,
      tags: '',
    });
    setEditingTransaction(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount || '0'),
        tags: formData.tags
          ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
      };

      if (editingTransaction) {
        await api.put(`/transactions/${editingTransaction.id}/`, payload);
      } else {
        await api.post('/transactions/', payload);
      }
      setShowModal(false);
      resetForm();
      loadTransactions();
    } catch (error) {
      console.error('Erro ao salvar transao:', error);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      description: transaction.description,
      amount: String(transaction.amount),
      type: transaction.type,
      status: transaction.status || 'CONFIRMED',
      date: transaction.date,
      account: transaction.account,
      category: transaction.category,
      notes: transaction.notes || '',
      receipt_url: transaction.receipt_url || '',
      is_reconciled: transaction.is_reconciled || false,
      tags: (transaction.tags || []).join(', '),
    });
    setShowModal(true);
  };

  const handleDelete = async (transaction: Transaction) => {
    if (!confirm('Tem certeza que deseja excluir esta transao?')) return;
    try {
      await api.delete(`/transactions/${transaction.id}/`);
      loadTransactions();
    } catch (error) {
      console.error('Erro ao excluir transao:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: user?.default_currency || 'BRL',
    }).format(Number(value));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  const filteredCategories = categories.filter(
    (cat) => cat.type === formData.type
  );

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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Transaes</h1>
          <p className="text-gray-600">Histrico completo</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
        >
          <Plus size={20} />
          Nova Transao
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 mb-6 grid grid-cols-1 lg:grid-cols-6 gap-4">
        <div className="lg:col-span-2 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">Tipo</option>
          <option value="INCOME">Receita</option>
          <option value="EXPENSE">Despesa</option>
        </select>
        <select
          value={filters.account}
          onChange={(e) => setFilters({ ...filters, account: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">Conta</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name}
            </option>
          ))}
        </select>
        <select
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">Categoria</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">Status</option>
          <option value="PENDING">Pendente</option>
          <option value="CONFIRMED">Confirmada</option>
          <option value="CANCELLED">Cancelada</option>
        </select>
        <div className="lg:col-span-2 flex items-center gap-2">
          <input
            type="date"
            value={filters.start_date}
            onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
            className="px-3 py-2 border rounded-lg w-full"
          />
          <input
            type="date"
            value={filters.end_date}
            onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
            className="px-3 py-2 border rounded-lg w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-500" />
          <select
            value={filters.ordering}
            onChange={(e) => setFilters({ ...filters, ordering: e.target.value })}
            className="px-3 py-2 border rounded-lg w-full"
          >
            <option value="-date">Data (recente)</option>
            <option value="date">Data (antiga)</option>
            <option value="-amount">Maior valor</option>
            <option value="amount">Menor valor</option>
            <option value="category__name">Categoria</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 lg:col-span-2">
          <input
            type="checkbox"
            checked={filters.include_cancelled}
            onChange={(e) => setFilters({ ...filters, include_cancelled: e.target.checked })}
          />
          Mostrar canceladas
        </label>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Nenhuma transao cadastrada
          </p>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex justify-between items-center p-4 border-b last:border-0 hover:bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {transaction.category_detail?.icon || transaction.category_icon || '??'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {transaction.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      {transaction.category_detail?.name}  {formatDate(transaction.date)}
                    </p>
                    {transaction.status_display && (
                      <span className="text-xs text-gray-500">
                        {transaction.status_display}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p
                    className={`font-bold text-lg ${
                      transaction.type === 'INCOME'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {transaction.type === 'INCOME' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </p>
                  <button
                    onClick={() => handleEdit(transaction)}
                    className="text-gray-500 hover:text-gray-700"
                    title="Editar"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(transaction)}
                    className="text-red-500 hover:text-red-600"
                    title="Excluir"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center mt-6">
          <button
            disabled={!pagination.previous}
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-600">Pgina {page}</span>
          <button
            disabled={!pagination.next}
            onClick={() => setPage((prev) => prev + 1)}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Prxima
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {editingTransaction ? 'Editar Transao' : 'Nova Transao'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Descrio
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Tipo
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value,
                        category: '',
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="INCOME">Receita</option>
                    <option value="EXPENSE">Despesa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="PENDING">Pendente</option>
                    <option value="CONFIRMED">Confirmada</option>
                    <option value="CANCELLED">Cancelada</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Valor
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Data
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Conta
                </label>
                <select
                  value={formData.account}
                  onChange={(e) =>
                    setFormData({ ...formData, account: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                >
                  <option value="">Selecione uma conta</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Categoria
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {filteredCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Tags (separe por vrgula)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Notas
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  URL do recibo
                </label>
                <input
                  type="url"
                  value={formData.receipt_url}
                  onChange={(e) =>
                    setFormData({ ...formData, receipt_url: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.is_reconciled}
                  onChange={(e) =>
                    setFormData({ ...formData, is_reconciled: e.target.checked })
                  }
                />
                Conciliada
              </label>

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
                  {editingTransaction ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
