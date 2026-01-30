import { Button } from './ui/button';
import { Package, Users, TrendingUp, Shield, ArrowRight } from 'lucide-react';

export function LandingPage({ onNavigateToDashboard }) {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Package className="size-8 text-blue-600" />
            <span className="text-xl">EquipmentPro CRM</span>
          </div>
          <Button onClick={onNavigateToDashboard}>
            Access Dashboard
            <ArrowRight className="size-4 ml-2" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl">
            <h1 className="text-5xl mb-6">
              Streamline Your Equipment Sales Management
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              A comprehensive CRM solution designed for equipment enterprises. Manage your users, track sales, and organize your product catalog all in one place.
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={onNavigateToDashboard}
            >
              Get Started
              <ArrowRight className="size-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl text-center mb-12">
            Everything You Need to Manage Your Business
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-sm border">
              <Users className="size-12 text-blue-600 mb-4" />
              <h3 className="text-xl mb-3">User Management</h3>
              <p className="text-slate-600">
                Efficiently manage your team members, clients, and stakeholders with comprehensive user profiles and role assignments.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm border">
              <TrendingUp className="size-12 text-blue-600 mb-4" />
              <h3 className="text-xl mb-3">Order Tracking</h3>
              <p className="text-slate-600">
                Monitor all your orders to grow your business.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm border">
              <Package className="size-12 text-blue-600 mb-4" />
              <h3 className="text-xl mb-3">Product Catalog</h3>
              <p className="text-slate-600">
                Maintain a complete inventory of your equipment with detailed specifications, pricing, and stock levels.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Data Management Section */}
      <section className="py-20 bg-slate-100">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <Shield className="size-16 text-blue-600 mx-auto mb-6" />
            <h2 className="text-3xl mb-4">
              Flexible Data Import & Export
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              Import and export your data in XML format across all management sections. Seamlessly integrate with your existing systems and maintain complete control over your business data.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-slate-400">
            © 2025 EquipmentPro CRM. All rights reserved.
          </p>
        </div>
      </footer>
    </div >
  );
}
