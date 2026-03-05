'use client';

import { ButtonConfig } from '@/types';

interface ButtonProps {
  config: ButtonConfig;
  onClick: (value: string) => void;
}

const typeStyles: Record<string, string> = {
  number:
    'bg-white text-slate-800 shadow-sm border border-slate-100 hover:bg-slate-50 active:bg-slate-100',
  operator:
    'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md hover:from-brand-400 hover:to-brand-600',
  action:
    'bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300',
  equals:
    'bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-md hover:from-pink-400 hover:to-rose-500',
  clear:
    'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md hover:from-amber-300 hover:to-orange-400',
};

export default function Button({ config, onClick }: ButtonProps) {
  const { label, value, type, span } = config;

  return (
    <button
      className={`calculator-btn h-14 ${
        span === 2 ? 'col-span-2' : ''
      } ${typeStyles[type]}`}
      onClick={() => onClick(value)}
      aria-label={label}
    >
      {label}
    </button>
  );
}
