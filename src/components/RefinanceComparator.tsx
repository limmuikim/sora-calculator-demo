import React, { useState, useMemo } from 'react';
import { SoraDailyRecord, SoraTenor, RefinanceInputs } from '../types/sora';
import { formatSGD, formatPercent } from '../data/masSoraRates';
import { ArrowRightLeft, TrendingDown, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';

interface RefinanceComparatorProps {
  latestRecord: SoraDailyRecord;
  activeTenor: SoraTenor;
}

export const RefinanceComparator: React.FC<RefinanceComparatorProps> = ({
  latestRecord,
  activeTenor,
}) => {
  const [inputs, setInputs] = useState<RefinanceInputs>({
    currentLoanBalance: 750000,
    remainingTenureYears: 22,
    currentInterestRate: 3.85, // Current fixed or board rate
    newBenchmarkTenor: '3m',
    newBankSpread: 0.60,
    refinancingCost: 2500, // Legal and valuation costs in SG
    bankCashRebate: 2000, // Bank subsidy / legal rebate in SG
  });

  // Calculate new effective interest rate
  const newBenchmarkRate = useMemo(() => {
    switch (inputs.newBenchmarkTenor) {
      case '1m':
        return latestRecord.compounded1M;
      case '3m':
        return latestRecord.compounded3M;
      case '6m':
        return latestRecord.compounded6M;
      case 'spot':
        return latestRecord.sora;
      default:
        return latestRecord.compounded3M;
    }
  }, [inputs.newBenchmarkTenor, latestRecord]);

  const newEffectiveRate = newBenchmarkRate + inputs.newBankSpread;

  // Monthly payments
  const calculatePMT = (principal: number, annualRatePct: number, years: number) => {
    const months = Math.max(1, years * 12);
    const r = (annualRatePct / 100) / 12;
    if (r <= 0) return principal / months;
    return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  };

  const currentMonthlyPayment = useMemo(() => {
    return calculatePMT(inputs.currentLoanBalance, inputs.currentInterestRate, inputs.remainingTenureYears);
  }, [inputs.currentLoanBalance, inputs.currentInterestRate, inputs.remainingTenureYears]);

  const newMonthlyPayment = useMemo(() => {
    return calculatePMT(inputs.currentLoanBalance, newEffectiveRate, inputs.remainingTenureYears);
  }, [inputs.currentLoanBalance, newEffectiveRate, inputs.remainingTenureYears]);

  const monthlySavings = currentMonthlyPayment - newMonthlyPayment;
  const yearlySavings = monthlySavings * 12;
  const netSwitchingCost = Math.max(0, inputs.refinancingCost - inputs.bankCashRebate);
  const threeYearGrossSavings = yearlySavings * 3;
  const threeYearNetSavings = threeYearGrossSavings - netSwitchingCost;
  const breakevenMonths = monthlySavings > 0 ? Math.ceil(netSwitchingCost / monthlySavings) : null;

  return (
    <div className="space-y-6">
      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Inputs (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900">Refinancing Comparison</h2>
            <p className="text-xs text-slate-500">
              Evaluate switching from current loan package to a MAS SORA rate
            </p>
          </div>

          {/* Current Loan Balance */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-700">Outstanding Loan Balance</label>
              <span className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                {formatSGD(inputs.currentLoanBalance, 0)}
              </span>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-medium text-slate-400">
                S$
              </span>
              <input
                type="number"
                step="10000"
                value={inputs.currentLoanBalance || ''}
                onChange={(e) =>
                  setInputs((p) => ({ ...p, currentLoanBalance: Math.max(0, Number(e.target.value)) }))
                }
                className="w-full pl-9 pr-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>

          {/* Remaining Tenure */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-700">Remaining Tenure</label>
              <span className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                {inputs.remainingTenureYears} Years ({inputs.remainingTenureYears * 12} mos)
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="35"
              step="1"
              value={inputs.remainingTenureYears}
              onChange={(e) =>
                setInputs((p) => ({ ...p, remainingTenureYears: Number(e.target.value) }))
              }
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Current Interest Rate */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-700">Current Interest Rate (% p.a.)</label>
              <span className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                {inputs.currentInterestRate.toFixed(2)}%
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.05"
                min="1"
                max="10"
                value={inputs.currentInterestRate}
                onChange={(e) =>
                  setInputs((p) => ({ ...p, currentInterestRate: Number(e.target.value) }))
                }
                className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg"
              />
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400">
                % p.a.
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Existing fixed rate, SIBOR, or bank board rate.</p>
          </div>

          {/* New SORA Package Selection */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <h3 className="text-xs font-semibold text-slate-900">Target SORA Package</h3>
            
            <div className="grid grid-cols-3 gap-2">
              {(['1m', '3m', '6m'] as SoraTenor[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setInputs((p) => ({ ...p, newBenchmarkTenor: t }))}
                  className={`p-2 rounded-lg border text-center transition-colors ${
                    inputs.newBenchmarkTenor === t
                      ? 'border-blue-600 bg-blue-50/50 font-semibold text-blue-700'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs">{t.toUpperCase()} SORA</div>
                  <div className="text-[10px] font-mono tabular-nums text-slate-500 mt-0.5">
                    {formatPercent(
                      t === '1m'
                        ? latestRecord.compounded1M
                        : t === '3m'
                        ? latestRecord.compounded3M
                        : latestRecord.compounded6M,
                      3
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-700">New Bank Margin / Spread</label>
                <span className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                  +{inputs.newBankSpread.toFixed(2)}%
                </span>
              </div>
              <input
                type="number"
                step="0.05"
                min="0"
                max="3"
                value={inputs.newBankSpread}
                onChange={(e) => setInputs((p) => ({ ...p, newBankSpread: Number(e.target.value) }))}
                className="w-full px-3 py-1.5 text-xs font-mono tabular-nums border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Singapore Bank Subsidies and Legal Fees */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <h3 className="text-xs font-semibold text-slate-900">Switching Costs & Subsidies</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-600 block mb-1">Legal & Valuation Fee</label>
                <input
                  type="number"
                  step="100"
                  value={inputs.refinancingCost}
                  onChange={(e) => setInputs((p) => ({ ...p, refinancingCost: Number(e.target.value) }))}
                  className="w-full px-2.5 py-1.5 font-mono tabular-nums border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="text-slate-600 block mb-1">Bank Cash Rebate</label>
                <input
                  type="number"
                  step="100"
                  value={inputs.bankCashRebate}
                  onChange={(e) => setInputs((p) => ({ ...p, bankCashRebate: Number(e.target.value) }))}
                  className="w-full px-2.5 py-1.5 font-mono tabular-nums border border-slate-300 rounded"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Outputs (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Side-by-Side Comparison Box */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="text-xs font-medium text-slate-500 mb-3">Package Comparison</div>
            
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
              {/* Existing Loan */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs font-semibold text-slate-600">Current Loan Package</span>
                <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums mt-1">
                  {formatSGD(currentMonthlyPayment, 0)}
                  <span className="text-xs font-normal text-slate-500 ml-1">/ mo</span>
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  Rate: <strong className="font-mono text-slate-800 tabular-nums">{inputs.currentInterestRate.toFixed(2)}% p.a.</strong>
                </div>
              </div>

              {/* Proposed SORA */}
              <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200">
                <span className="text-xs font-semibold text-blue-900">Proposed SORA Package</span>
                <div className="text-2xl font-bold font-mono text-blue-700 tabular-nums mt-1">
                  {formatSGD(newMonthlyPayment, 0)}
                  <span className="text-xs font-normal text-slate-500 ml-1">/ mo</span>
                </div>
                <div className="text-xs text-slate-600 mt-2">
                  Rate: <strong className="font-mono text-blue-900 tabular-nums">{formatPercent(newEffectiveRate, 3)} p.a.</strong>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    ({inputs.newBenchmarkTenor.toUpperCase()} {formatPercent(newBenchmarkRate, 3)} + {inputs.newBankSpread.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Savings Callout */}
            <div className="pt-4">
              {monthlySavings > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                      <TrendingDown className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-emerald-800">
                        Monthly Repayment Reduction
                      </span>
                      <div className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
                        Save {formatSGD(monthlySavings, 0)} / month
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block">1-Year Savings</span>
                      <span className="font-mono font-bold text-slate-900 text-sm tabular-nums mt-0.5 block">
                        {formatSGD(yearlySavings, 0)}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block">3-Year Net Savings</span>
                      <span className="font-mono font-bold text-emerald-700 text-sm tabular-nums mt-0.5 block">
                        {formatSGD(threeYearNetSavings, 0)}
                      </span>
                      <span className="text-[10px] text-slate-400">After net legal fee</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block">Breakeven Period</span>
                      <span className="font-mono font-bold text-slate-900 text-sm tabular-nums mt-0.5 block">
                        {breakevenMonths ? `${breakevenMonths} Months` : 'Immediate'}
                      </span>
                      <span className="text-[10px] text-slate-400">Net cost: {formatSGD(netSwitchingCost, 0)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-700 space-y-1">
                    <div className="font-semibold text-slate-900">
                      Current package is lower or equivalent
                    </div>
                    <p>
                      Your existing rate ({inputs.currentInterestRate.toFixed(2)}%) is currently lower than the proposed SORA rate ({formatPercent(newEffectiveRate, 3)}).
                      Refinancing now would increase monthly installments by{' '}
                      <strong className="font-mono">{formatSGD(Math.abs(monthlySavings), 0)}/mo</strong>.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Refinancing Advisory Guide */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-2">
            <h4 className="font-semibold text-slate-800">Singapore Refinancing Insights</h4>
            <ul className="space-y-1 text-[11px] list-disc pl-4 text-slate-600">
              <li>
                <strong>Lock-in Periods:</strong> Check whether your current mortgage is still within its 1 to 3 year lock-in clawback window (typically 1.5% penalty on redeemed amount).
              </li>
              <li>
                <strong>Notice Period:</strong> Singapore banks require a 3-month written notice period for refinancing private and HDB housing loans.
              </li>
              <li>
                <strong>Cash Rebate / Subsidies:</strong> Major Singapore retail banks (DBS, OCBC, UOB, HSBC, SCB) offer legal and valuation cash subsidies for loan amounts exceeding S$500,000.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
