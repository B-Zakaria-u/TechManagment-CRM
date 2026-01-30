import { Package } from 'lucide-react';
import { Card, CardContent } from './ui/card';

export function Dashboard() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <div className="p-6 bg-blue-50 rounded-full">
        <Package className="size-24 text-blue-600" />
      </div>
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-slate-900">EquipmentPro CRM</h1>
        <p className="text-lg text-slate-500">Welcome to your management dashboard</p>
      </div>
    </div>
  );
}
