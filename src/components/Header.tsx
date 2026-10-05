import React from 'react';
import { RefreshCw, Download, FileSpreadsheet } from 'lucide-react';

interface HeaderProps {
  activeTab: 'mortgage' | 'commercial' | 'refinance' | 'directory';
  setActiveTab: (tab: 'mortgage' | 'commercial' | 'refinance' | 'directory') => void;
  isLive: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  lastUpdated: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isLive,
  isRefreshing,
  onRefresh,
  lastUpdated,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Brand Wordmark (Single text element) */}
          <div className="flex items-center">
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Singapore SORA Calculator
            </span>
          </div>

          {/* Zone 2: Navigation Links / Segmented Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('mortgage')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'mortgage'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mortgage & Housing
            </button>
            <button
              onClick={() => setActiveTab('commercial')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'commercial'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Commercial In-Arrears
            </button>
            <button
              onClick={() => setActiveTab('refinance')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'refinance'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Refinance Compare
            </button>
            <button
              onClick={() => setActiveTab('directory')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'directory'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              MAS Rates & Methodology
            </button>
          </nav>

          {/* Zone 3: Primary Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500">
              <span className={`inline-block w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              <span>{isLive ? 'MAS Live API' : 'MAS Historical Standard'}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{lastUpdated}</span>
            </div>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh rates from Monetary Authority of Singapore"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">Sync MAS</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden overflow-x-auto py-2 border-t border-slate-100 gap-1 no-scrollbar">
          <button
            onClick={() => setActiveTab('mortgage')}
            className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap ${
              activeTab === 'mortgage' ? 'bg-slate-900 text-white' : 'text-slate-600'
            }`}
          >
            Mortgage
          </button>
          <button
            onClick={() => setActiveTab('commercial')}
            className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap ${
              activeTab === 'commercial' ? 'bg-slate-900 text-white' : 'text-slate-600'
            }`}
          >
            Commercial In-Arrears
          </button>
          <button
            onClick={() => setActiveTab('refinance')}
            className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap ${
              activeTab === 'refinance' ? 'bg-slate-900 text-white' : 'text-slate-600'
            }`}
          >
            Refinance
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap ${
              activeTab === 'directory' ? 'bg-slate-900 text-white' : 'text-slate-600'
            }`}
          >
            MAS Rates & Guide
          </button>
        </div>
      </div>
    </header>
  );
};
