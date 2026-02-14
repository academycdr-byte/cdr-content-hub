'use client';

import { useState } from 'react';
import { Calculator } from 'lucide-react';

interface MonthSelectorProps {
  month: string;
  loading: boolean;
  onMonthChange: (month: string) => void;
  onCalculate: (month: string) => Promise<{ created: number; total: number }>;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatMonthLabel(month: string): string {
  const [year, mon] = month.split('-').map(Number);
  const MONTHS = [
    'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  return `${MONTHS[mon - 1]} ${year}`;
}

export default function MonthSelector({
  month,
  loading,
  onMonthChange,
  onCalculate,
}: MonthSelectorProps) {
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<{ created: number; total: number } | null>(null);

  const handleCalculate = async () => {
    setCalculating(true);
    setResult(null);
    try {
      const res = await onCalculate(month);
      setResult(res);
      // Auto-hide result after 5 seconds
      setTimeout(() => setResult(null), 5000);
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <div className="flex items-center gap-3">
        <input
          type="month"
          value={month}
          onChange={(e) => onMonthChange(e.target.value)}
          className="input w-auto !py-2 !px-3"
        />
        <button
          onClick={handleCalculate}
          disabled={loading || calculating}
          className="btn-accent flex items-center gap-2 whitespace-nowrap"
        >
          <Calculator size={16} />
          {calculating ? 'Calculando...' : 'Calcular'}
        </button>
      </div>

      <p className="text-sm text-text-secondary">
        Referencia: <span className="font-medium">{formatMonthLabel(month)}</span>
      </p>

      {/* Result toast inline */}
      {result && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success-surface text-success text-sm font-medium animate-fade-in">
          {result.created} comissoes calculadas - Total: {formatCurrency(result.total)}
        </div>
      )}
    </div>
  );
}
