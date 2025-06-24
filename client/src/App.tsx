import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from 'react-query';
import Dashboard from './pages/Dashboard';
import EnhancedDashboard from './pages/EnhancedDashboard';
import Analytics from './pages/Analytics';
import Campaigns from './pages/Campaigns';
import AffiliateLinks from './pages/AffiliateLinks';
import Marketplaces from './pages/Marketplaces';
import SEO from './pages/SEO';
import Settings from './pages/Settings';
import EmailScraper from './components/EmailScraper';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import './index.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="flex">
            <Sidebar />
            <main className="flex-1 p-6">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/enhanced-dashboard" element={<EnhancedDashboard />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/campaigns" element={<Campaigns />} />
                <Route path="/affiliate-links" element={<AffiliateLinks />} />
                <Route path="/marketplaces" element={<Marketplaces />} />
                <Route path="/seo" element={<SEO />} />
                <Route path="/email-scraper" element={<EmailScraper />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
          </div>
          <Toaster position="top-right" />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App; 