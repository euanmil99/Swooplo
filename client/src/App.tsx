import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from 'react-query';
import Dashboard from './pages/Dashboard';
import Campaigns from './pages/Campaigns';
import Analytics from './pages/Analytics';
import AffiliateLinks from './pages/AffiliateLinks';
import Marketplaces from './pages/Marketplaces';
import Settings from './pages/Settings';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import './index.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/campaigns" element={<Campaigns />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/affiliate-links" element={<AffiliateLinks />} />
                <Route path="/marketplaces" element={<Marketplaces />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
          </div>
        </div>
        <Toaster position="top-right" />
      </Router>
    </QueryClientProvider>
  );
}

export default App; 