import React from 'react';
import { SoraDailyRecord, SoraTenor } from '../types/sora';
import { formatPercent } from '../data/masSoraRates';
import { TrendingUp, Info } from 'lucide-react';

interface MasRateTickerProps {
  latestRecord: SoraDailyRecord;
  selectedTenor?: SoraTenor;
  onSelectTenor?: (tenor: SoraTenor) => void;
}

export const MasRateTicker: React.FC<MasRateTickerProps> = ({
  latestRecord,
  selectedTenor,
  onSelectTenor,
}) => {
  const benchmarks = [
    {
      id: 'spot' as SoraTenor,
      label: 'Overnight SORA',
      sub: 'MAS Daily Spot Fixing',
      rate: latestRecord.sora,
      tag: 'Daily Spot',
    },
    {
      id: '1m' as SoraTenor,
      label: '1M Compounded SORA',
      sub: '30-day Historical Window',
      rate: latestRecord.compounded1M,
      tag: '1-Month',
    },
    {
      id: '3m' as SoraTenor,
      label: '3M Compounded SORA',
      sub: 'Most Common SG Mortgage Benchmark',
      rate: latestRecord.compounded3M,
      tag: 'Retail Standard',
      isPrimary: true,
    },
    {
      id: '6m' as SoraTenor,
      label: '6M Compounded SORA',
      sub: '180-day Smoothed Tenor',
      rate: latestRecord.compounded6M,
      tag: '6-Month',
    },
  ];

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Monetary Authority of Singapore (MAS) Benchmarks</span>
            <span aria-hidden="true">·</span>
            <span>Effective Date:</span>
            <span className="font-mono font-medium text-slate-900 tabular-nums">{latestRecord.date}</span>
            <span aria-hidden="true">·</span>
            <span>Publication: 09:00 SGT</span>
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span>SORA Index:</span>
            <span className="font-mono font-semibold text-slate-900 tabular-nums">
              {latestRecord.soraIndex.toFixed(5)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3">
          {benchmarks.map((b) => {
            const isSelected = selectedTenor === b.id;
            return (
              <div
                key={b.id}
                onClick={() => onSelectTenor && onSelectTenor(b.id)}
                className={`p-3 rounded-lg border transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600'
                    : b.isPrimary
                    ? 'border-slate-300 bg-slate-50/60 hover:border-slate-400'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-medium text-slate-600 truncate">{b.label}</span>
                  {b.isPrimary && (
                    <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      Mortgage Preferred
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                    {formatPercent(b.rate, 4)}
                  </span>
                  <span className="text-xs text-slate-400">p.a.</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 truncate">{b.sub}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
