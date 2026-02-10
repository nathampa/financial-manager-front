// frontend/src/app/dashboard/reports/page.tsx
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface ReportData {
  period: { start_date: string; end_date: string };
  summary: {
    total_income: number;
    total_expense: number;
    balance: number;
    transactions_count: number;
  };
  by_category: Array<{ category__name: string; total: number; count: number }>;
  comparison?: {
    previous_period: {
      start_date: string;
      end_date: string;
      total_income: number;
      total_expense: number;
      balance: number;
    };
    changes: {
      income_pct: number | null;
      expense_pct: number | null;
      balance_pct: number | null;
    };
  };
}

interface ReportResponse {
  id: string;
  period_start: string;
  period_end: string;
  data: ReportData;
}

export default function ReportsPage() {
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    period: 'month',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    generateReport();
  }, []);

  const generateReport = async () => {
    setLoading(true);
    try {
      const response = await api.post('/reports/generate/', {
        period: formData.period,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
      });
      setReport(response.data);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    if (!report) return;
    try {
      const response = await api.get(`/reports/${report.id}/export/?format=${format}`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], {
        type: format === 'pdf' ? 'application/pdf' : 'text/csv',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${report.id}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
    }
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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Relatórios</h1>
        <p className="text-gray-600">Análise financeira detalhada</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Período</label>
            <select
              value={formData.period}
              onChange={(e) => setFormData({ ...formData, period: e.target.value })}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="day">Dia</option>
              <option value="week">Semana</option>
              <option value="month">Mês</option>
              <option value="quarter">Trimestre</option>
              <option value="year">Ano</option>
              <option value="custom">Customizado</option>
            </select>
          </div>
          {formData.period === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Data inicial</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Data final</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="px-4 py-2 border rounded-lg"
                />
              </div>
            </>
          )}
          <button
            onClick={generateReport}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold"
          >
            Gerar relatório
          </button>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => handleExport('csv')}
              className="border px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              Exportar CSV
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="border px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              Exportar PDF
            </button>
          </div>
        </div>
      </div>

      {report && (
        <>
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-sm font-semibold mb-2 opacity-90">Saldo Total</h3>
              <p className="text-3xl font-bold">
                {formatCurrency(report.data.summary.balance)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-sm font-semibold mb-2 opacity-90">Receitas</h3>
              <p className="text-3xl font-bold">
                {formatCurrency(report.data.summary.total_income)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-sm font-semibold mb-2 opacity-90">Despesas</h3>
              <p className="text-3xl font-bold">
                {formatCurrency(report.data.summary.total_expense)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-sm font-semibold mb-2 opacity-90">Transações</h3>
              <p className="text-3xl font-bold">
                {report.data.summary.transactions_count}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Despesas por Categoria</h2>
              {report.data.by_category.length === 0 ? (
                <p className="text-gray-600 text-center py-8">Nenhum dado disponível</p>
              ) : (
                <div className="space-y-3">
                  {report.data.by_category.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-gray-700">{item.category__name}</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(item.total)} ({item.count})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Comparação</h2>
              {report.data.comparison ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Receitas</span>
                    <span className="font-semibold text-gray-900">
                      {report.data.comparison.changes.income_pct === null
                        ? 'N/A'
                        : `${report.data.comparison.changes.income_pct.toFixed(1)}%`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Despesas</span>
                    <span className="font-semibold text-gray-900">
                      {report.data.comparison.changes.expense_pct === null
                        ? 'N/A'
                        : `${report.data.comparison.changes.expense_pct.toFixed(1)}%`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Saldo</span>
                    <span className="font-semibold text-gray-900">
                      {report.data.comparison.changes.balance_pct === null
                        ? 'N/A'
                        : `${report.data.comparison.changes.balance_pct.toFixed(1)}%`}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">Sem comparação disponível.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
