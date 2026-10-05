import React, { useState, useMemo } from 'react';
import { SoraDailyRecord } from '../types/sora';
import { formatPercent, formatSGD } from '../data/masSoraRates';
import { Search, Download, ExternalLink, BookOpen, Layers } from 'lucide-react';

interface MasRatesDirectoryProps {
  records: SoraDailyRecord[];
}

export const MasRatesDirectory: React.FC<MasRatesDirectoryProps> = ({ records }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenorFilter, setSelectedTenorFilter] = useState<'all' | '3m' | 'volume'>('all');

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (searchQuery && !r.date.includes(searchQuery)) {
        return false;
      }
      return true;
    });
  }, [records, searchQuery]);

  const handleExportCSV = () => {
    const headers = [
      'Date',
      'Overnight SORA (%)',
      'SORA Index',
      '1M Compounded (%)',
      '3M Compounded (%)',
      '6M Compounded (%)',
      'Volume (SGD M)',
      '10th Pct',
      '25th Pct',
      '75th Pct',
      '90th Pct',
    ];

    const rows = filteredRecords.map((r) => [
      r.date,
      r.sora.toFixed(4),
      r.soraIndex.toFixed(5),
      r.compounded1M.toFixed(4),
      r.compounded3M.toFixed(4),
      r.compounded6M.toFixed(4),
      r.aggregateVolumeMillion || '',
      r.percentile10 || '',
      r.percentile25 || '',
      r.percentile75 || '',
      r.percentile90 || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mas_sora_benchmark_series.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Search and Action Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by date (e.g. 2026-09)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-slate-500 hover:text-slate-900 whitespace-nowrap"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Table (CSV)</span>
          </button>

          <a
            href="https://www.mas.gov.sg/monetary-policy/sora"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            <span>MAS Official Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Historical Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            <span>Showing</span>{' '}
            <strong className="font-mono text-slate-900 tabular-nums">{filteredRecords.length}</strong>{' '}
            <span>verified MAS daily records</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Rates published 09:00 SGT for preceding business day
          </div>
        </div>

        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 font-medium z-10">
              <tr>
                <th className="py-2.5 px-4">Publication Date</th>
                <th className="py-2.5 px-4 text-right">Overnight SORA</th>
                <th className="py-2.5 px-4 text-right">SORA Index</th>
                <th className="py-2.5 px-4 text-right">1M Compounded</th>
                <th className="py-2.5 px-4 text-right bg-blue-50/50 text-blue-900">3M Compounded</th>
                <th className="py-2.5 px-4 text-right">6M Compounded</th>
                <th className="py-2.5 px-4 text-right">Aggregate Vol.</th>
                <th className="py-2.5 px-4 text-right text-slate-400">25th-75th Range</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
              {filteredRecords.map((r) => (
                <tr key={r.date} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2 px-4 font-sans font-medium text-slate-900">
                    {r.date}
                  </td>
                  <td className="py-2 px-4 text-right font-semibold text-slate-900">
                    {formatPercent(r.sora, 4)}
                  </td>
                  <td className="py-2 px-4 text-right text-slate-600">
                    {r.soraIndex.toFixed(5)}
                  </td>
                  <td className="py-2 px-4 text-right text-slate-700">
                    {formatPercent(r.compounded1M, 4)}
                  </td>
                  <td className="py-2 px-4 text-right font-bold text-blue-700 bg-blue-50/20">
                    {formatPercent(r.compounded3M, 4)}
                  </td>
                  <td className="py-2 px-4 text-right text-slate-700">
                    {formatPercent(r.compounded6M, 4)}
                  </td>
                  <td className="py-2 px-4 text-right text-slate-600">
                    {r.aggregateVolumeMillion ? `S$${r.aggregateVolumeMillion.toLocaleString()}M` : '—'}
                  </td>
                  <td className="py-2 px-4 text-right text-slate-400 text-[11px]">
                    {r.percentile25 && r.percentile75
                      ? `${r.percentile25.toFixed(2)}% – ${r.percentile75.toFixed(2)}%`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MAS Methodology & Singapore Financial Explainer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>What is SORA?</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            The <strong>Singapore Overnight Rate Average (SORA)</strong> is the volume-weighted average rate of unsecured overnight interbank SGD borrowing transactions in Singapore between 8:00 AM and 6:15 PM. Published daily by the Monetary Authority of Singapore at 9:00 AM SGT.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Why Compounded SORA?</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Unlike forward-looking SIBOR (which was survey-based and subject to market volatility), compounded SORA represents the backward-looking geometric average of actual transacted overnight rates. This cushions borrowers from sharp daily spikes.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Actual / 365 Convention</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            In accordance with Singapore banking standards, all SGD loans (mortgages, term loans, revolving credit) calculate interest using the <strong>Actual / 365</strong> day-count convention. Weekend days carry a weighting of 3 calendar days (Friday to Monday).
          </p>
        </div>
      </div>
    </div>
  );
};
