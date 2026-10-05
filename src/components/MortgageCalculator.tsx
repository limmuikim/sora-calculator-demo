import React, { useState, useMemo } from 'react';
import { SoraDailyRecord, SoraTenor, MortgageInputs } from '../types/sora';
import { calculateMortgage, formatSGD, formatPercent } from '../data/masSoraRates';
import { Download, Sliders, ShieldAlert, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';

interface MortgageCalculatorProps {
  latestRecord: SoraDailyRecord;
  activeTenor: SoraTenor;
  onSelectTenor: (tenor: SoraTenor) => void;
}

export const MortgageCalculator: React.FC<MortgageCalculatorProps> = ({
  latestRecord,
  activeTenor,
  onSelectTenor,
}) => {
  const [inputs, setInputs] = useState<MortgageInputs>({
    loanAmount: 800000,
    tenureYears: 25,
    benchmarkTenor: activeTenor,
    customBenchmarkRate: 3.489,
    bankSpread: 0.65,
    isTieredSpread: false,
    tier1Years: 2,
    tier1Spread: 0.55,
    tier2Spread: 0.75,
    repaymentType: 'amortizing',
    stressTestEnabled: true,
    stressTestRate: 4.0, // MAS standard regulatory stress test floor
  });

  const [scheduleView, setScheduleView] = useState<'yearly' | 'monthly'>('yearly');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Sync tenor when changed from parent ticker
  React.useEffect(() => {
    setInputs((prev) => ({ ...prev, benchmarkTenor: activeTenor }));
  }, [activeTenor]);

  // Determine active benchmark rate
  const activeBenchmarkRate = useMemo(() => {
    switch (inputs.benchmarkTenor) {
      case '1m':
        return latestRecord.compounded1M;
      case '3m':
        return latestRecord.compounded3M;
      case '6m':
        return latestRecord.compounded6M;
      case 'spot':
        return latestRecord.sora;
      case 'custom':
      default:
        return inputs.customBenchmarkRate;
    }
  }, [inputs.benchmarkTenor, inputs.customBenchmarkRate, latestRecord]);

  // Perform calculation
  const results = useMemo(() => {
    return calculateMortgage(inputs, activeBenchmarkRate);
  }, [inputs, activeBenchmarkRate]);

  // Aggregate yearly summary for schedule view
  const yearlySchedule = useMemo(() => {
    const yearsMap = new Map<
      number,
      {
        year: number;
        beginningBalance: number;
        scheduledPayment: number;
        principal: number;
        interest: number;
        endingBalance: number;
      }
    >();

    results.amortizationSchedule.forEach((row) => {
      const existing = yearsMap.get(row.year);
      if (!existing) {
        yearsMap.set(row.year, {
          year: row.year,
          beginningBalance: row.beginningBalance,
          scheduledPayment: row.scheduledPayment,
          principal: row.principal,
          interest: row.interest,
          endingBalance: row.endingBalance,
        });
      } else {
        existing.scheduledPayment += row.scheduledPayment;
        existing.principal += row.principal;
        existing.interest += row.interest;
        existing.endingBalance = row.endingBalance;
      }
    });

    return Array.from(yearsMap.values());
  }, [results.amortizationSchedule]);

  // Export CSV
  const handleExportCSV = () => {
    const rows = [
      ['Month', 'Year', 'Beginning Balance (SGD)', 'Monthly Payment (SGD)', 'Principal (SGD)', 'Interest (SGD)', 'Ending Balance (SGD)', 'Cumulative Interest (SGD)'],
      ...results.amortizationSchedule.map((r) => [
        r.month,
        r.year,
        r.beginningBalance.toFixed(2),
        r.scheduledPayment.toFixed(2),
        r.principal.toFixed(2),
        r.interest.toFixed(2),
        r.endingBalance.toFixed(2),
        r.cumulativeInterest.toFixed(2),
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sora_mortgage_amortization_${inputs.loanAmount}sgd.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const principalRatio = (inputs.loanAmount / results.totalPayable) * 100;
  const interestRatio = (results.totalInterest / results.totalPayable) * 100;

  return (
    <div className="space-y-6">
      {/* Configuration & Output Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Controls (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Loan Parameters</h2>
              <p className="text-xs text-slate-500">Singapore Residential & Commercial Mortgage</p>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md text-xs">
              <button
                type="button"
                onClick={() => setInputs((p) => ({ ...p, repaymentType: 'amortizing' }))}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  inputs.repaymentType === 'amortizing'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                P & I
              </button>
              <button
                type="button"
                onClick={() => setInputs((p) => ({ ...p, repaymentType: 'interest_only' }))}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  inputs.repaymentType === 'interest_only'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Interest Only
              </button>
            </div>
          </div>

          {/* Loan Amount */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-700">Loan Principal (SGD)</label>
              <span className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                {formatSGD(inputs.loanAmount, 0)}
              </span>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-medium text-slate-400">
                S$
              </span>
              <input
                type="number"
                min="50000"
                max="20000000"
                step="10000"
                value={inputs.loanAmount || ''}
                onChange={(e) =>
                  setInputs((p) => ({ ...p, loanAmount: Math.max(0, Number(e.target.value)) }))
                }
                className="w-full pl-9 pr-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar">
              {[500000, 800000, 1200000, 1800000, 2500000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setInputs((p) => ({ ...p, loanAmount: amt }))}
                  className={`px-2 py-0.5 text-[11px] font-mono tabular-nums rounded border transition-colors whitespace-nowrap ${
                    inputs.loanAmount === amt
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  S${amt >= 1000000 ? `${amt / 1000000}M` : `${amt / 1000}k`}
                </button>
              ))}
            </div>
          </div>

          {/* Loan Tenure */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-700">Loan Tenure</label>
              <span className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                {inputs.tenureYears} Years ({inputs.tenureYears * 12} months)
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="35"
              step="1"
              value={inputs.tenureYears}
              onChange={(e) => setInputs((p) => ({ ...p, tenureYears: Number(e.target.value) }))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
              <span>5 yrs (Min)</span>
              <span>25 yrs (HDB Max)</span>
              <span>30 yrs (Private)</span>
              <span>35 yrs</span>
            </div>
          </div>

          {/* Benchmark Tenor Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-700">SORA Benchmark Tenor</label>
              <span className="font-mono text-xs font-semibold text-blue-600 tabular-nums">
                {formatPercent(activeBenchmarkRate, 4)} p.a.
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onSelectTenor('3m');
                  setInputs((p) => ({ ...p, benchmarkTenor: '3m' }));
                }}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  inputs.benchmarkTenor === '3m'
                    ? 'border-blue-600 bg-blue-50/50'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-semibold text-slate-900">3M Compounded</div>
                <div className="text-[11px] font-mono text-slate-500 tabular-nums">
                  {formatPercent(latestRecord.compounded3M, 4)} (Market Norm)
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTenor('1m');
                  setInputs((p) => ({ ...p, benchmarkTenor: '1m' }));
                }}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  inputs.benchmarkTenor === '1m'
                    ? 'border-blue-600 bg-blue-50/50'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-semibold text-slate-900">1M Compounded</div>
                <div className="text-[11px] font-mono text-slate-500 tabular-nums">
                  {formatPercent(latestRecord.compounded1M, 4)}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTenor('6m');
                  setInputs((p) => ({ ...p, benchmarkTenor: '6m' }));
                }}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  inputs.benchmarkTenor === '6m'
                    ? 'border-blue-600 bg-blue-50/50'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-semibold text-slate-900">6M Compounded</div>
                <div className="text-[11px] font-mono text-slate-500 tabular-nums">
                  {formatPercent(latestRecord.compounded6M, 4)}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTenor('custom');
                  setInputs((p) => ({ ...p, benchmarkTenor: 'custom' }));
                }}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  inputs.benchmarkTenor === 'custom'
                    ? 'border-blue-600 bg-blue-50/50'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-semibold text-slate-900">Custom / Fixed</div>
                <div className="text-[11px] text-slate-500">Manual input</div>
              </button>
            </div>

            {inputs.benchmarkTenor === 'custom' && (
              <div className="mt-2.5">
                <label className="text-[11px] font-medium text-slate-600">Custom Benchmark Rate (% p.a.)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="15"
                  value={inputs.customBenchmarkRate}
                  onChange={(e) =>
                    setInputs((p) => ({ ...p, customBenchmarkRate: Number(e.target.value) }))
                  }
                  className="w-full px-3 py-1.5 text-sm font-mono tabular-nums border border-slate-300 rounded-lg mt-1"
                />
              </div>
            )}
          </div>

          {/* Bank Spread / Margin */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-700">Bank Spread / Margin (% p.a.)</label>
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-slate-500 flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inputs.isTieredSpread}
                    onChange={(e) => setInputs((p) => ({ ...p, isTieredSpread: e.target.checked }))}
                    className="rounded text-blue-600"
                  />
                  <span>Tiered Spread</span>
                </label>
              </div>
            </div>

            {!inputs.isTieredSpread ? (
              <div className="space-y-2">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-medium text-slate-400">
                    +
                  </span>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="5"
                    value={inputs.bankSpread}
                    onChange={(e) => setInputs((p) => ({ ...p, bankSpread: Number(e.target.value) }))}
                    className="w-full pl-8 pr-12 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg"
                  />
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400">
                    % p.a.
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[0.50, 0.60, 0.65, 0.75, 0.85].map((spread) => (
                    <button
                      key={spread}
                      type="button"
                      onClick={() => setInputs((p) => ({ ...p, bankSpread: spread }))}
                      className={`px-2 py-0.5 text-[11px] font-mono rounded border transition-colors ${
                        inputs.bankSpread === spread
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      +{spread.toFixed(2)}%
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600">Years 1 to {inputs.tier1Years}</label>
                    <input
                      type="number"
                      step="0.05"
                      value={inputs.tier1Spread}
                      onChange={(e) => setInputs((p) => ({ ...p, tier1Spread: Number(e.target.value) }))}
                      className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums border border-slate-300 rounded bg-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600">Year {inputs.tier1Years + 1}+ Thereafter</label>
                    <input
                      type="number"
                      step="0.05"
                      value={inputs.tier2Spread}
                      onChange={(e) => setInputs((p) => ({ ...p, tier2Spread: Number(e.target.value) }))}
                      className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums border border-slate-300 rounded bg-white mt-1"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* MAS Regulatory Stress Test Toggle */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inputs.stressTestEnabled}
                  onChange={(e) => setInputs((p) => ({ ...p, stressTestEnabled: e.target.checked }))}
                  className="rounded text-blue-600"
                />
                <span>MAS Regulatory Stress Test</span>
              </label>
              <span className="text-[11px] text-slate-500 font-mono tabular-nums">Floor: 4.00%</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Evaluates monthly installment affordability under MAS Medium-Term Stress Rate (standard 4.00% p.a.).
            </p>
          </div>
        </div>

        {/* Right Column: Calculated Results & Financial Diagnostics (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Hero Calculation Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-medium text-slate-500">Estimated Monthly Installment</span>
                <div className="text-3xl sm:text-4xl font-bold font-mono text-slate-900 tracking-tight tabular-nums mt-1">
                  {formatSGD(results.initialMonthlyPayment, 0)}
                  <span className="text-sm font-normal text-slate-500 ml-1">/ mo</span>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs font-medium text-slate-500">All-In Effective Rate</span>
                <div className="text-xl font-bold font-mono text-blue-600 tabular-nums">
                  {formatPercent(results.initialEffectiveRate, 3)}
                  <span className="text-xs font-normal text-slate-500 ml-1">p.a.</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                  ({formatPercent(activeBenchmarkRate, 3)} SORA + {inputs.isTieredSpread ? inputs.tier1Spread.toFixed(2) : inputs.bankSpread.toFixed(2)}% margin)
                </div>
              </div>
            </div>

            {/* Total Cost Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
              <div>
                <span className="text-xs text-slate-500">Total Interest Payable</span>
                <div className="text-base font-semibold font-mono text-slate-900 tabular-nums mt-0.5">
                  {formatSGD(results.totalInterest, 0)}
                </div>
                <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                  {interestRatio.toFixed(1)}% of total cost
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500">Total Loan Repayment</span>
                <div className="text-base font-semibold font-mono text-slate-900 tabular-nums mt-0.5">
                  {formatSGD(results.totalPayable, 0)}
                </div>
                <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                  Principal + Total Interest
                </span>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <span className="text-xs text-slate-500">Repayment Period</span>
                <div className="text-base font-semibold font-mono text-slate-900 tabular-nums mt-0.5">
                  {inputs.tenureYears * 12} Installments
                </div>
                <span className="text-[11px] text-slate-400">
                  {inputs.tenureYears} Years Amortization
                </span>
              </div>
            </div>

            {/* Visual Ratio Bar */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-900 inline-block" />
                  <span>Principal: {formatSGD(inputs.loanAmount, 0)} ({principalRatio.toFixed(0)}%)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />
                  <span>Interest: {formatSGD(results.totalInterest, 0)} ({interestRatio.toFixed(0)}%)</span>
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                <div style={{ width: `${principalRatio}%` }} className="bg-slate-900 h-full transition-all" />
                <div style={{ width: `${interestRatio}%` }} className="bg-blue-500 h-full transition-all" />
              </div>
            </div>
          </div>

          {/* MAS Regulatory Stress Test Diagnostics Card */}
          {inputs.stressTestEnabled && (
            <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h3 className="text-xs font-semibold text-amber-900">
                      MAS Regulatory Stress Test (Floor: 4.00% p.a.)
                    </h3>
                    <span className="text-xs font-mono font-bold text-amber-900 tabular-nums">
                      {formatSGD(results.stressMonthlyPayment, 0)} / mo
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    Under MAS regulations, Singapore financial institutions must assess borrower TDSR (Total Debt Servicing Ratio) at a minimum stress rate of 4.00% p.a.
                    Your payment would increase by{' '}
                    <strong className="font-mono tabular-nums text-amber-950">
                      +{formatSGD(results.stressPaymentDelta, 0)}/mo
                    </strong>{' '}
                    if interest rates climb to 4.00%.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Amortization Schedule Section */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Amortization Schedule</h3>
            <p className="text-xs text-slate-500">
              Singapore Dollar (SGD) breakdown of principal balance and interest payments
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setScheduleView('yearly')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  scheduleView === 'yearly'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Annual Summary ({inputs.tenureYears} Years)
              </button>
              <button
                type="button"
                onClick={() => setScheduleView('monthly')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  scheduleView === 'monthly'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly Schedule ({inputs.tenureYears * 12} Mos)
              </button>
            </div>

            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Schedule Table */}
        <div className="overflow-x-auto">
          {scheduleView === 'yearly' ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                  <th className="py-2.5 px-4">Year</th>
                  <th className="py-2.5 px-4 text-right">Beginning Balance</th>
                  <th className="py-2.5 px-4 text-right">Annual Payment</th>
                  <th className="py-2.5 px-4 text-right">Principal Paid</th>
                  <th className="py-2.5 px-4 text-right">Interest Paid</th>
                  <th className="py-2.5 px-4 text-right">Ending Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                {yearlySchedule.map((row) => (
                  <tr key={row.year} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2 px-4 font-sans font-medium text-slate-900">
                      Year {row.year}
                    </td>
                    <td className="py-2 px-4 text-right text-slate-600">
                      {formatSGD(row.beginningBalance, 0)}
                    </td>
                    <td className="py-2 px-4 text-right font-semibold text-slate-900">
                      {formatSGD(row.scheduledPayment, 0)}
                    </td>
                    <td className="py-2 px-4 text-right text-emerald-700">
                      {formatSGD(row.principal, 0)}
                    </td>
                    <td className="py-2 px-4 text-right text-blue-700">
                      {formatSGD(row.interest, 0)}
                    </td>
                    <td className="py-2 px-4 text-right text-slate-900 font-medium">
                      {formatSGD(row.endingBalance, 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                  <th className="py-2.5 px-4">Month</th>
                  <th className="py-2.5 px-4 text-right">Beginning Balance</th>
                  <th className="py-2.5 px-4 text-right">Payment</th>
                  <th className="py-2.5 px-4 text-right">Principal</th>
                  <th className="py-2.5 px-4 text-right">Interest</th>
                  <th className="py-2.5 px-4 text-right">Ending Balance</th>
                  <th className="py-2.5 px-4 text-right">Cumulative Int.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                {results.amortizationSchedule
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((row) => (
                    <tr key={row.month} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2 px-4 font-sans font-medium text-slate-900">
                        Month {row.month} <span className="text-slate-400 font-normal">(Yr {row.year})</span>
                      </td>
                      <td className="py-2 px-4 text-right text-slate-600">
                        {formatSGD(row.beginningBalance, 2)}
                      </td>
                      <td className="py-2 px-4 text-right font-semibold text-slate-900">
                        {formatSGD(row.scheduledPayment, 2)}
                      </td>
                      <td className="py-2 px-4 text-right text-emerald-700">
                        {formatSGD(row.principal, 2)}
                      </td>
                      <td className="py-2 px-4 text-right text-blue-700">
                        {formatSGD(row.interest, 2)}
                      </td>
                      <td className="py-2 px-4 text-right text-slate-900">
                        {formatSGD(row.endingBalance, 2)}
                      </td>
                      <td className="py-2 px-4 text-right text-slate-500">
                        {formatSGD(row.cumulativeInterest, 2)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Monthly Pagination Controls */}
        {scheduleView === 'monthly' && (
          <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>
              Showing months {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, results.amortizationSchedule.length)} of{' '}
              {results.amortizationSchedule.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={currentPage * pageSize >= results.amortizationSchedule.length}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-2.5 py-1 border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
