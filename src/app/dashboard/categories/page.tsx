// frontend/src/app/dashboard/categories/page.tsx
'use client';

import { useEffect, useState } from 'react';
import api, { Category } from '@/lib/api';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'EXPENSE',
    icon: '??',
    color: '#ef4444',
    description: '',
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories/');
      setCategories(response.data.results || response.data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', type: 'EXPENSE', icon: '??', color: '#ef4444', description: '' });
    setEditingCategory(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}/`, formData);
      } else {
        await api.post('/categories/', formData);
      }
      setShowModal(false);
      resetForm();
      loadCategories();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      icon: category.icon || '??',
      color: category.color || (category.type === 'INCOME' ? '#22c55e' : '#ef4444'),
      description: category.description || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (category: Category) => {
    if (category.is_system) return;
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;
    try {
      await api.delete(`/categories/${category.id}/`);
      loadCategories();
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
    }
  };

  const incomeCategories = categories.filter((cat) => cat.type === 'INCOME');
  const expenseCategories = categories.filter((cat) => cat.type === 'EXPENSE');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Categorias</h1>
          <p className="text-gray-600">Gerencie suas categorias</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
        >
          <Plus size={20} />
          Nova Categoria
        </button>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Receitas</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {incomeCategories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-xl shadow-lg p-6 border-l-4"
              style={{ borderColor: cat.color || '#22c55e' }}
            >
              <div className="flex gap-3 mb-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: cat.color || '#bbf7d0' }}>
                  {cat.icon}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{cat.name}</h3>
                  <p className="text-sm text-gray-600">
                    {cat.transactions_count} transações
                  </p>
                  {cat.is_system && (
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded mt-1 inline-block">
                      Sistema
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {!cat.is_system && (
                  <button
                    onClick={() => handleEdit(cat)}
                    className="text-gray-500 hover:text-gray-700"
                    title="Editar"
                  >
                    <Pencil size={18} />
                  </button>
                )}
                {!cat.is_system && (
                  <button
                    onClick={() => handleDelete(cat)}
                    className="text-red-500 hover:text-red-600"
                    title="Excluir"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Despesas</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {expenseCategories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-xl shadow-lg p-6 border-l-4"
              style={{ borderColor: cat.color || '#ef4444' }}
            >
              <div className="flex gap-3 mb-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: cat.color || '#fee2e2' }}>
                  {cat.icon}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{cat.name}</h3>
                  <p className="text-sm text-gray-600">
                    {cat.transactions_count} transações
                  </p>
                  {cat.is_system && (
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded mt-1 inline-block">
                      Sistema
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {!cat.is_system && (
                  <button
                    onClick={() => handleEdit(cat)}
                    className="text-gray-500 hover:text-gray-700"
                    title="Editar"
                  >
                    <Pencil size={18} />
                  </button>
                )}
                {!cat.is_system && (
                  <button
                    onClick={() => handleDelete(cat)}
                    className="text-red-500 hover:text-red-600"
                    title="Excluir"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Tipo
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="INCOME">Receita</option>
                  <option value="EXPENSE">Despesa</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Ícone
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) =>
                      setFormData({ ...formData, icon: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="??"
                    maxLength={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Cor
                  </label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="w-full h-10 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Descrição
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
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
                  {editingCategory ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
