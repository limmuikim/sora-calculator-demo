/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { SoraDailyRecord, SoraTenor } from './types/sora';
import {
  MAS_SORA_HISTORICAL_DATA,
  fetchLiveMasSoraData,
} from './data/masSoraRates';
import { Header } from './components/Header';
import { MasRateTicker } from './components/MasRateTicker';
import { MortgageCalculator } from './components/MortgageCalculator';
import { CommercialCalculator } from './components/CommercialCalculator';
import { RefinanceComparator } from './components/RefinanceComparator';
import { MasRatesDirectory } from './components/MasRatesDirectory';
import { Landmark, ArrowUpRight, ShieldCheck } from 'lucide-react';

export default function App() {
  const [records, setRecords] = useState<SoraDailyRecord[]>(MAS_SORA_HISTORICAL_DATA);
  const [activeTab, setActiveTab] = useState<'mortgage' | 'commercial' | 'refinance' | 'directory'>('mortgage');
  const [activeTenor, setActiveTenor] = useState<SoraTenor>('3m');
  const [isLive, setIsLive] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('09:00 SGT');

  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetchLiveMasSoraData();
      if (res.data && res.data.length > 0) {
        setRecords(res.data);
        setIsLive(res.isLive);
        setLastUpdated(res.lastUpdated);
      }
    } catch {
      // Keep existing data
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const latestRecord = records[0] || MAS_SORA_HISTORICAL_DATA[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 3-Zone Top Bar Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isLive={isLive}
        isRefreshing={isRefreshing}
        onRefresh={loadData}
        lastUpdated={lastUpdated}
      />

      {/* MAS Key Benchmark Ticker Banner */}
      <MasRateTicker
        latestRecord={latestRecord}
        selectedTenor={activeTenor}
        onSelectTenor={setActiveTenor}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'mortgage' && (
          <MortgageCalculator
            latestRecord={latestRecord}
            activeTenor={activeTenor}
            onSelectTenor={setActiveTenor}
          />
        )}

        {activeTab === 'commercial' && (
          <CommercialCalculator historicalRecords={records} />
        )}

        {activeTab === 'refinance' && (
          <RefinanceComparator
            latestRecord={latestRecord}
            activeTenor={activeTenor}
          />
        )}

        {activeTab === 'directory' && (
          <MasRatesDirectory records={records} />
        )}
      </main>

      {/* Quiet Institutional Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">Singapore SORA Interest Engine</span>
            <span aria-hidden="true">·</span>
            <span>MAS Singapore Overnight Rate Average Benchmarks</span>
            <span aria-hidden="true">·</span>
            <span>Actual / 365 Convention</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1 text-slate-600">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>MAS Regulatory Compliance</span>
            </span>
            <a
              href="https://eservices.mas.gov.sg/statistics/keystats/sora.aspx"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-700 transition-colors flex items-center gap-0.5"
            >
              <span>MAS Data Portal</span>
              <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
