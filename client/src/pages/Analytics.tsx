import React from 'react';
import { BarChart3, TrendingUp, DollarSign, Target } from 'lucide-react';

const Analytics: React.FC = () => {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Detailed performance analytics and reporting</p>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Analytics Dashboard</h2>
        <p className="text-gray-600">Advanced analytics and reporting features will be implemented here.</p>
      </div>
    </div>
  );
};

export default Analytics; 