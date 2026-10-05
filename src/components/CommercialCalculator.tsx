import React, { useState, useMemo } from 'react';
import { SoraDailyRecord, CommercialCompoundingInputs } from '../types/sora';
import {
  calculateCompoundedInArrears,
  formatSGD,
  formatPercent,
} from '../data/masSoraRates';
import { Download, CheckCircle, Info, Calculator, Calendar } from 'lucide-react';

interface CommercialCalculatorProps {
  historicalRecords: SoraDailyRecord[];
}

export const CommercialCalculator: React.FC<CommercialCalculatorProps> = ({
  historicalRecords,
}) => {
  const [inputs, setInputs] = useState<CommercialCompoundingInputs>({
    principal: 5000000,
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    lookbackDays: 5,
    bankMargin: 1.15,
    dayCountBasis: 365,
  });

  const result = useMemo(() => {
    return calculateCompoundedInArrears(inputs, historicalRecords);
  }, [inputs, historicalRecords]);

  // Export Daily Audit Trail to CSV
  const handleExportCSV = () => {
    const rows = [
      ['Date', 'Weighting Days (n_i)', 'Daily Overnight SORA (%)', 'Compounding Factor', 'Cumulative Product', 'Daily Interest (SGD)', 'Cumulative Interest (SGD)'],
      ...result.dailyInterestRows.map((r) => [
        r.date,
        r.calendarDays,
        r.overnightRate.toFixed(4),
        r.compoundingFactor.toFixed(8),
        r.cumulativeProduct.toFixed(8),
        r.dailyInterest.toFixed(2),
        r.cumulativeInterest.toFixed(2),
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mas_sora_compounded_audit_${inputs.startDate}_to_${inputs.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Parameter Cards & Formula Callout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Inputs (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900">Commercial Facility Parameters</h2>
            <p className="text-xs text-slate-500">
              MAS SORA Daily Compounding in Arrears (Corporate & SME Loans)
            </p>
          </div>

          {/* Principal Amount */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-700">Facility Principal (SGD)</label>
              <span className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                {formatSGD(inputs.principal, 0)}
              </span>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-medium text-slate-400">
                S$
              </span>
              <input
                type="number"
                min="100000"
                step="50000"
                value={inputs.principal || ''}
                onChange={(e) =>
                  setInputs((p) => ({ ...p, principal: Math.max(0, Number(e.target.value)) }))
                }
                className="w-full pl-9 pr-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              {[1000000, 3000000, 5000000, 10000000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setInputs((p) => ({ ...p, principal: amt }))}
                  className={`px-2 py-0.5 text-[11px] font-mono tabular-nums rounded border transition-colors ${
                    inputs.principal === amt
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  S${amt / 1000000}M
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">Calculation Start Date</label>
              <input
                type="date"
                value={inputs.startDate}
                onChange={(e) => setInputs((p) => ({ ...p, startDate: e.target.value }))}
                className="w-full px-3 py-1.5 text-xs font-mono tabular-nums border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">Calculation End Date</label>
              <input
                type="date"
                value={inputs.endDate}
                onChange={(e) => setInputs((p) => ({ ...p, endDate: e.target.value }))}
                className="w-full px-3 py-1.5 text-xs font-mono tabular-nums border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Presets for Calculation Period */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Quick Range:</span>
            <button
              type="button"
              onClick={() => setInputs((p) => ({ ...p, startDate: '2026-09-01', endDate: '2026-09-30' }))}
              className="text-xs text-blue-600 hover:underline"
            >
              Sep 2026 (30d)
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setInputs((p) => ({ ...p, startDate: '2026-08-24', endDate: '2026-09-24' }))}
              className="text-xs text-blue-600 hover:underline"
            >
              31-Day Rolling
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setInputs((p) => ({ ...p, startDate: '2026-09-15', endDate: '2026-10-02' }))}
              className="text-xs text-blue-600 hover:underline"
            >
              Latest 17d
            </button>
          </div>

          {/* Bank Spread / Margin */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-700">Bank Margin (% p.a.)</label>
              <span className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                +{inputs.bankMargin.toFixed(2)}%
              </span>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-medium text-slate-400">
                +
              </span>
              <input
                type="number"
                step="0.05"
                min="0"
                max="10"
                value={inputs.bankMargin}
                onChange={(e) => setInputs((p) => ({ ...p, bankMargin: Number(e.target.value) }))}
                className="w-full pl-8 pr-12 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg"
              />
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400">
                % p.a.
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              {[0.85, 1.00, 1.15, 1.35, 1.50].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setInputs((p) => ({ ...p, bankMargin: m }))}
                  className={`px-2 py-0.5 text-[11px] font-mono tabular-nums rounded border transition-colors ${
                    inputs.bankMargin === m
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  +{m.toFixed(2)}%
                </button>
              ))}
            </div>
          </div>

          {/* Observation Convention & Day Count Basis */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
            <div>
              <label className="font-medium text-slate-700 block mb-1">Observation Convention</label>
              <select
                value={inputs.lookbackDays}
                onChange={(e) => setInputs((p) => ({ ...p, lookbackDays: Number(e.target.value) }))}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
              >
                <option value={5}>5-Day Lookback (MAS standard)</option>
                <option value={2}>2-Day Lookback</option>
                <option value={0}>0-Day (Standard In-Arrears)</option>
              </select>
            </div>
            <div>
              <label className="font-medium text-slate-700 block mb-1">Day Count Basis</label>
              <select
                value={inputs.dayCountBasis}
                onChange={(e) => setInputs((p) => ({ ...p, dayCountBasis: Number(e.target.value) }))}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
              >
                <option value={365}>Actual / 365 (SGD Market Standard)</option>
                <option value={360}>Actual / 360 (USD Standard)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Output Results (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Main Calculation Metric Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-medium text-slate-500">
                  Total Interest Payable for Period
                </span>
                <div className="text-3xl sm:text-4xl font-bold font-mono text-slate-900 tracking-tight tabular-nums mt-1">
                  {formatSGD(result.totalInterestPayable, 2)}
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs font-medium text-slate-500">All-In Effective Rate</span>
                <div className="text-xl font-bold font-mono text-blue-600 tabular-nums">
                  {formatPercent(result.allInRate, 4)}
                  <span className="text-xs font-normal text-slate-500 ml-1">p.a.</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                  ({formatPercent(result.compoundedBaseRate, 4)} Base + {inputs.bankMargin.toFixed(2)}% Margin)
                </div>
              </div>
            </div>

            {/* Metric Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
              <div>
                <span className="text-slate-500 block">Compounded SORA Base</span>
                <span className="font-mono font-bold text-slate-900 tabular-nums text-sm">
                  {formatPercent(result.compoundedBaseRate, 4)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Calculation Period</span>
                <span className="font-mono font-bold text-slate-900 tabular-nums text-sm">
                  {result.totalDays} Days
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Business Days ($d_0$)</span>
                <span className="font-mono font-bold text-slate-900 tabular-nums text-sm">
                  {result.businessDays} Days
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Day Basis</span>
                <span className="font-mono font-bold text-slate-900 tabular-nums text-sm">
                  Actual/{inputs.dayCountBasis}
                </span>
              </div>
            </div>

            {/* SORA Index Cross Verification Result */}
            {result.soraIndexVerification && (
              <div className="mt-5 p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-lg flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 space-y-1">
                  <div className="font-semibold">
                    MAS SORA Index Mathematical Cross-Verification: Verified
                  </div>
                  <p className="text-emerald-800 leading-relaxed font-mono tabular-nums">
                    Start Index ({result.soraIndexVerification.startIndex.toFixed(5)}) → End Index ({result.soraIndexVerification.endIndex.toFixed(5)}).
                    Formula rate: {formatPercent(result.soraIndexVerification.indexDerivedRate, 4)}. Delta: {result.soraIndexVerification.difference.toFixed(6)}%
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* MAS Regulatory Compounding Formula Reference Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              <span>MAS Prescribed Compounding in Arrears Formula</span>
            </div>
            <p className="font-mono text-[11px] bg-white p-2.5 rounded border border-slate-200 overflow-x-auto text-slate-800">
              Compounded SORA = [ ∏ ( 1 + (r_i × n_i) / 365 ) - 1 ] × (365 / d) × 100%
            </p>
            <p className="text-[11px] text-slate-500 leading-normal">
              Where <span className="font-mono">r_i</span> is the SORA overnight fixing on business day i,{' '}
              <span className="font-mono">n_i</span> is the number of calendar days the rate applies (accounting for weekends and Singapore public holidays), and{' '}
              <span className="font-mono">d</span> is the total calendar days in the calculation period.
            </p>
          </div>
        </div>
      </div>

      {/* Daily Calculation Audit Trail Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Day-by-Day Compounding Audit Ledger
            </h3>
            <p className="text-xs text-slate-500">
              Detailed step-by-step interest accumulation across all Singapore observation business days
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Audit Trail (CSV)</span>
          </button>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 font-medium z-10">
              <tr>
                <th className="py-2.5 px-4">Observation Date</th>
                <th className="py-2.5 px-4 text-center">Days (n_i)</th>
                <th className="py-2.5 px-4 text-right">Overnight SORA (r_i)</th>
                <th className="py-2.5 px-4 text-right">Daily Compounding Factor</th>
                <th className="py-2.5 px-4 text-right">Daily Interest</th>
                <th className="py-2.5 px-4 text-right">Cumulative Interest</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
              {result.dailyInterestRows.length > 0 ? (
                result.dailyInterestRows.map((row) => (
                  <tr key={row.date} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2 px-4 font-sans text-slate-900 font-medium">
                      {row.date}
                    </td>
                    <td className="py-2 px-4 text-center">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] ${
                        row.calendarDays > 1 ? 'bg-amber-100 text-amber-800 font-semibold' : 'text-slate-600'
                      }`}>
                        {row.calendarDays} {row.calendarDays > 1 ? 'days (weekend)' : 'day'}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-right text-slate-900 font-semibold">
                      {formatPercent(row.overnightRate, 4)}
                    </td>
                    <td className="py-2 px-4 text-right text-slate-500 text-[11px]">
                      {row.compoundingFactor.toFixed(7)}
                    </td>
                    <td className="py-2 px-4 text-right text-slate-900">
                      {formatSGD(row.dailyInterest, 2)}
                    </td>
                    <td className="py-2 px-4 text-right text-blue-700 font-semibold">
                      {formatSGD(row.cumulativeInterest, 2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No business dates found in the selected calculation range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
