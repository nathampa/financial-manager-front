// frontend/src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import api, { Account, DashboardData } from '@/lib/api';
import { Wallet, TrendingUp, TrendingDown, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

interface CategoryChartData {
  category__name: string;
  category__icon?: string;
  total: number;
  count: number;
  percentage?: number;
}

interface EvolutionData {
  month: string;
  year: number;
  income: number;
  expense: number;
  balance: number;
}

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6'];

export default function DashboardPage() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryChartData[]>([]);
  const [evolutionData, setEvolutionData] = useState<EvolutionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [dashResponse, accountsResponse, categoryResponse, evolutionResponse] = await Promise.all([
        api.get('/transactions/dashboard/'),
        api.get('/accounts/'),
        api.get('/transactions/by_category/?type=EXPENSE'),
        api.get('/transactions/monthly_evolution/'),
      ]);

      setDashboardData(dashResponse.data);
      setAccounts(accountsResponse.data.results || accountsResponse.data);
      setCategoryData((categoryResponse.data || []).map((item: any) => ({ ...item, total: Number(item.total) })));
      setEvolutionData(evolutionResponse.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number, currency?: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || user?.default_currency || 'BRL',
    }).format(Number(value));
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
        <p className="text-gray-600">Viso geral das suas finanas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 font-semibold">Saldo Total</h3>
            <Wallet className="text-blue-500" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-800">
            {formatCurrency(dashboardData?.total_balance || 0)}
          </p>
          <p className="text-sm text-gray-500 mt-2">Todas as contas</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 font-semibold">Receitas</h3>
            <TrendingUp className="text-green-500" size={24} />
          </div>
          <p className="text-3xl font-bold text-green-600">
            {formatCurrency(dashboardData?.month_income || 0)}
          </p>
          <p className="text-sm text-gray-500 mt-2">Este ms</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 font-semibold">Despesas</h3>
            <TrendingDown className="text-red-500" size={24} />
          </div>
          <p className="text-3xl font-bold text-red-600">
            {formatCurrency(dashboardData?.month_expense || 0)}
          </p>
          <p className="text-sm text-gray-500 mt-2">Este ms</p>
        </div>
      </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 font-semibold">Economia</h3>
            <Wallet className="text-purple-500" size={24} />
          </div>
          <p className="text-3xl font-bold text-purple-600">
            {formatCurrency(dashboardData?.month_balance || 0)}
          </p>
          <p className="text-sm text-gray-500 mt-2">Este m?s</p>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Minhas Contas</h2>
          {accounts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nenhuma conta cadastrada
            </p>
          ) : (
            <div className="space-y-4">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: account.color || '#3b82f6' }}
                    >
                      <CreditCard className="text-white" size={24} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {account.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {account.type_display}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`font-bold text-lg ${
                      account.current_balance >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(account.current_balance, account.currency)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            Despesas por Categoria
          </h2>
          {categoryData.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhuma despesa registrada</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="total"
                    nameKey="category__name"
                    outerRadius={90}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            Evoluo Mensal
          </h2>
          {evolutionData.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhum dado disponvel</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolutionData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#22c55e" name="Receitas" />
                  <Line type="monotone" dataKey="expense" stroke="#ef4444" name="Despesas" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            Maiores Despesas
          </h2>
          {!dashboardData?.top_expenses ||
          dashboardData.top_expenses.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nenhuma despesa registrada
            </p>
          ) : (
            <div className="space-y-4">
              {dashboardData.top_expenses.map((expense, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{expense.category__icon}</span>
                      <span className="text-gray-700 font-medium">
                        {expense.category__name}
                      </span>
                    </div>
                    <span className="text-gray-800 font-bold">
                      {formatCurrency(expense.total)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    {expense.count} transaes
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
