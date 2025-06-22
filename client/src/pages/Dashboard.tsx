import React from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Globe,
  Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const Dashboard: React.FC = () => {
  // Mock data for charts
  const revenueData = [
    { name: 'Jan', revenue: 4000, clicks: 2400 },
    { name: 'Feb', revenue: 3000, clicks: 1398 },
    { name: 'Mar', revenue: 2000, clicks: 9800 },
    { name: 'Apr', revenue: 2780, clicks: 3908 },
    { name: 'May', revenue: 1890, clicks: 4800 },
    { name: 'Jun', revenue: 2390, clicks: 3800 },
  ];

  const pieData = [
    { name: 'Amazon', value: 400, color: '#3B82F6' },
    { name: 'ClickBank', value: 300, color: '#10B981' },
    { name: 'Commission Junction', value: 200, color: '#F59E0B' },
    { name: 'ShareASale', value: 100, color: '#EF4444' },
  ];

  const stats = [
    {
      name: 'Total Revenue',
      value: '$12,345',
      change: '+12.5%',
      changeType: 'positive',
      icon: DollarSign,
    },
    {
      name: 'Total Clicks',
      value: '45,678',
      change: '+8.2%',
      changeType: 'positive',
      icon: Target,
    },
    {
      name: 'Conversion Rate',
      value: '3.2%',
      change: '-1.1%',
      changeType: 'negative',
      icon: TrendingUp,
    },
    {
      name: 'Active Campaigns',
      value: '24',
      change: '+2',
      changeType: 'positive',
      icon: Activity,
    },
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'campaign',
      title: 'Summer Sale Campaign',
      description: 'Campaign performance increased by 15%',
      time: '2 hours ago',
      status: 'success',
    },
    {
      id: 2,
      type: 'link',
      title: 'New affiliate link created',
      description: 'Amazon Electronics - Gaming Laptops',
      time: '4 hours ago',
      status: 'info',
    },
    {
      id: 3,
      type: 'payout',
      title: 'Commission payout received',
      description: '$234.50 from Amazon Associates',
      time: '1 day ago',
      status: 'success',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your campaigns.</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            Export Report
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            Create Campaign
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${
                  stat.changeType === 'positive' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <Icon className={`w-6 h-6 ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`} />
                </div>
              </div>
              <div className="flex items-center mt-4">
                {stat.changeType === 'positive' ? (
                  <ArrowUpRight className="w-4 h-4 text-green-600" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ml-1 ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 ml-1">from last month</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue & Clicks</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} />
              <Line type="monotone" dataKey="clicks" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Marketplace Distribution */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Marketplace</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.status === 'success' ? 'bg-green-500' : 
                  activity.status === 'info' ? 'bg-blue-500' : 'bg-yellow-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-sm text-gray-600">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center p-3 text-left text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <Target className="w-4 h-4 mr-3" />
              Create New Campaign
            </button>
            <button className="w-full flex items-center p-3 text-left text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <Link className="w-4 h-4 mr-3" />
              Generate Affiliate Link
            </button>
            <button className="w-full flex items-center p-3 text-left text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <Zap className="w-4 h-4 mr-3" />
              AI Content Generator
            </button>
            <button className="w-full flex items-center p-3 text-left text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <Globe className="w-4 h-4 mr-3" />
              Connect Social Media
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 