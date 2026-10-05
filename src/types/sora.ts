export interface SoraDailyRecord {
  date: string; // YYYY-MM-DD
  sora: number; // Daily overnight rate in % (e.g. 3.4500)
  soraIndex: number; // SORA index value
  compounded1M: number; // 1-Month Compounded SORA in %
  compounded3M: number; // 3-Month Compounded SORA in %
  compounded6M: number; // 6-Month Compounded SORA in %
  aggregateVolumeMillion?: number; // Aggregate volume in SGD millions
  percentile10?: number;
  percentile25?: number;
  percentile75?: number;
  percentile90?: number;
}

export type SoraTenor = 'spot' | '1m' | '3m' | '6m' | 'custom';

export interface MortgageInputs {
  loanAmount: number;
  tenureYears: number;
  benchmarkTenor: SoraTenor;
  customBenchmarkRate: number;
  bankSpread: number; // e.g. 0.65%
  isTieredSpread: boolean;
  tier1Years: number;
  tier1Spread: number;
  tier2Spread: number;
  repaymentType: 'amortizing' | 'interest_only';
  stressTestEnabled: boolean;
  stressTestRate: number; // e.g. 4.0%
}

export interface AmortizationRow {
  month: number;
  year: number;
  beginningBalance: number;
  scheduledPayment: number;
  principal: number;
  interest: number;
  endingBalance: number;
  cumulativeInterest: number;
}

export interface CommercialCompoundingInputs {
  principal: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  lookbackDays: number; // 0, 2, or 5
  bankMargin: number; // % p.a.
  dayCountBasis: number; // 365 (standard SGD)
}

export interface DailyCompoundingAuditRow {
  date: string; // Observation date
  calendarDays: number; // n_i (1 for weekday, 3 for Friday, etc.)
  overnightRate: number; // r_i in %
  compoundingFactor: number; // (1 + r_i * n_i / 365)
  cumulativeProduct: number;
  dailyInterest: number;
  cumulativeInterest: number;
}

export interface CommercialCompoundingResult {
  compoundedBaseRate: number; // % p.a.
  allInRate: number; // % p.a.
  totalDays: number;
  businessDays: number;
  totalInterestPayable: number;
  dailyInterestRows: DailyCompoundingAuditRow[];
  soraIndexVerification?: {
    startIndex: number;
    endIndex: number;
    indexDerivedRate: number;
    difference: number;
  };
}

export interface RefinanceInputs {
  currentLoanBalance: number;
  remainingTenureYears: number;
  currentInterestRate: number; // % p.a.
  newBenchmarkTenor: SoraTenor;
  newBankSpread: number; // % p.a.
  refinancingCost: number; // legal, valuation fees (e.g. S$2,500)
  bankCashRebate: number; // bank subsidy (e.g. S$2,000)
}
