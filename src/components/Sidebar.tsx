// frontend/src/components/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Wallet,
  ArrowUpDown,
  Tag,
  PieChart,
  Settings,
  LogOut,
  DollarSign,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Wallet, label: 'Contas', href: '/dashboard/accounts' },
    { icon: ArrowUpDown, label: 'Transações', href: '/dashboard/transactions' },
    { icon: Tag, label: 'Categorias', href: '/dashboard/categories' },
    { icon: PieChart, label: 'Relatórios', href: '/dashboard/reports' },
  ];

  return (
    <div className="w-64 bg-gradient-to-b from-blue-600 to-blue-800 text-white h-screen fixed left-0 top-0 flex flex-col">
      <div className="p-6 border-b border-blue-500">
        <div className="flex items-center gap-3">
          <DollarSign size={32} />
          <div>
            <h1 className="text-xl font-bold">FinanceApp</h1>
            <p className="text-xs text-blue-200">Gestão Financeira</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`w-full flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors ${
                isActive ? 'bg-blue-700' : 'hover:bg-blue-700'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-blue-500">
        <div className="mb-3 px-3">
          <p className="text-sm text-blue-200">Bem-vindo,</p>
          <p className="font-semibold truncate">
            {user?.full_name || user?.first_name || user?.username}
          </p>
        </div>

        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 p-3 hover:bg-blue-700 rounded-lg cursor-pointer mb-2"
        >
          <Settings size={20} />
          <span>Configurações</span>
        </Link>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 p-3 hover:bg-blue-700 rounded-lg cursor-pointer text-left"
        >
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
}
