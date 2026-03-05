'use client';

interface DisplayProps {
  expression: string;
  display: string;
  error: string | null;
}

export default function Display({ expression, display, error }: DisplayProps) {
  const fontSize =
    display.length > 12
      ? 'text-2xl'
      : display.length > 8
      ? 'text-3xl'
      : 'text-4xl';

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 mb-4 shadow-inner min-h-[110px] flex flex-col justify-between">
      <div className="text-slate-400 text-sm font-mono min-h-[20px] truncate text-right">
        {expression || '\u00A0'}
      </div>
      <div
        className={`text-right font-bold font-mono transition-all duration-100 ${
          error ? 'text-rose-400 text-xl' : `text-white ${fontSize}`
        }`}
      >
        {error ? error : display || '0'}
      </div>
    </div>
  );
}
