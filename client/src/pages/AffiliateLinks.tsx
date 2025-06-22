import React from 'react';
import { Link, Plus, Copy, ExternalLink } from 'lucide-react';

const AffiliateLinks: React.FC = () => {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Affiliate Links</h1>
          <p className="text-gray-600">Manage and track your affiliate links</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2 inline" />
          Generate Link
        </button>
      </div>
      
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Link Management</h2>
        <p className="text-gray-600">Affiliate link generation and tracking features will be implemented here.</p>
      </div>
    </div>
  );
};

export default AffiliateLinks; 