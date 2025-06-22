import React from 'react';
import { Settings as SettingsIcon, User, Shield, Bell, CreditCard } from 'lucide-react';

const Settings: React.FC = () => {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account and preferences</p>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h2>
        <p className="text-gray-600">User settings and account management features will be implemented here.</p>
      </div>
    </div>
  );
};

export default Settings; 