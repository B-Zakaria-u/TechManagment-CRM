import { useState } from 'react';
import { Button } from './ui/button';
import { Package, LogOut, Home, Users, ShoppingCart, PackageSearch, Briefcase } from 'lucide-react';
import { UsersManagement } from './UsersManagement';
import { OrdersManagement } from './OrdersManagement';
import { ProductsManagement } from './ProductsManagement';
import { ClientsManagement } from './ClientsManagement';
import { Dashboard } from './Dashboard';

export function AdminDashboard({ onNavigateToLanding, onLogout, user }) {
  const [activeTab, setActiveTab] = useState(user && user.role === 'client' ? 'orders' : 'home');

  const allNavItems = [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'users', label: 'Users', icon: Users, adminOnly: true },
    { id: 'clients', label: 'Clients', icon: Briefcase },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'products', label: 'Products', icon: PackageSearch },
  ];

  const navItems = allNavItems.filter(item => {
    if (user && user.role === 'client') {
      return item.id === 'orders';
    }
    return !item.adminOnly || (user && user.role === 'admin');
  });

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Package className="size-8 text-blue-400" />
            <div>
              <h1 className="font-semibold">EquipmentPro</h1>
              <p className="text-xs text-slate-400">CRM Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                  >
                    <Icon className="size-5" />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
            onClick={onNavigateToLanding}
          >
            Back to Landing
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
            onClick={onLogout}
          >
            <LogOut className="size-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-slate-50">
        {/* Header */}
        <header className="bg-white border-b sticky top-0 z-10">
          <div className="px-8 py-4">
            <h2 className="text-2xl">
              {navItems.find(item => item.id === activeTab)?.label}
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              {activeTab === 'home' && 'Overview of your CRM performance'}
              {activeTab === 'users' && 'Manage your team members'}
              {activeTab === 'clients' && 'Manage your client database'}
              {activeTab === 'orders' && 'Track and manage all client orders'}
              {activeTab === 'products' && 'Manage your equipment inventory'}
            </p>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8">
          {activeTab === 'home' && <Dashboard />}
          {activeTab === 'users' && user && user.role === 'admin' && <UsersManagement />}
          {activeTab === 'clients' && <ClientsManagement user={user} />}
          {activeTab === 'orders' && <OrdersManagement user={user} />}
          {activeTab === 'products' && <ProductsManagement user={user} />}
        </div>
      </main>
    </div>
  );
}
