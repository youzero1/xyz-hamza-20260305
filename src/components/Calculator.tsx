'use client';

import { useState, useCallback } from 'react';
import Display from './Display';
import Button from './Button';
import CalculationHistory from './CalculationHistory';
import { ButtonConfig, CalculatorState } from '@/types';

const BUTTONS: ButtonConfig[] = [
  { label: 'AC', value: 'clear', type: 'clear' },
  { label: '+/-', value: 'negate', type: 'action' },
  { label: '%', value: '%', type: 'action' },
  { label: '÷', value: '/', type: 'operator' },

  { label: '7', value: '7', type: 'number' },
  { label: '8', value: '8', type: 'number' },
  { label: '9', value: '9', type: 'number' },
  { label: '×', value: '*', type: 'operator' },

  { label: '4', value: '4', type: 'number' },
  { label: '5', value: '5', type: 'number' },
  { label: '6', value: '6', type: 'number' },
  { label: '−', value: '-', type: 'operator' },

  { label: '1', value: '1', type: 'number' },
  { label: '2', value: '2', type: 'number' },
  { label: '3', value: '3', type: 'number' },
  { label: '+', value: '+', type: 'operator' },

  { label: '0', value: '0', type: 'number', span: 2 },
  { label: '.', value: '.', type: 'number' },
  { label: '=', value: '=', type: 'equals' },
];

const OPERATORS = ['+', '-', '*', '/'];

function isOperator(val: string) {
  return OPERATORS.includes(val);
}

function formatNumber(num: number): string {
  if (!isFinite(num)) return 'Error';
  if (Math.abs(num) > 1e15) return 'Overflow';
  // avoid floating point weirdness
  const str = parseFloat(num.toPrecision(12)).toString();
  return str;
}

function evaluateExpression(expr: string): { result: string; error: string | null } {
  try {
    // replace display operators with JS operators
    const jsExpr = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-');

    // basic safety check
    if (!/^[\d+\-*/.() %]+$/.test(jsExpr)) {
      return { result: '', error: 'Invalid expression' };
    }

    // check division by zero
    if (/\/\s*0(?![.\d])/.test(jsExpr)) {
      return { result: '', error: 'Division by zero' };
    }

    // eslint-disable-next-line no-new-func
    const result = Function('"use strict"; return (' + jsExpr + ')')();

    if (typeof result !== 'number' || !isFinite(result)) {
      return { result: '', error: 'Math error' };
    }

    if (Math.abs(result) > 1e15) {
      return { result: '', error: 'Overflow' };
    }

    return { result: formatNumber(result), error: null };
  } catch {
    return { result: '', error: 'Invalid expression' };
  }
}

const initialState: CalculatorState = {
  display: '0',
  expression: '',
  hasResult: false,
  error: null,
};

export default function Calculator() {
  const [state, setState] = useState<CalculatorState>(initialState);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [saving, setSaving] = useState(false);

  const handleButton = useCallback(
    async (value: string) => {
      setState((prev) => {
        const { display, expression, hasResult, error } = prev;

        // Clear
        if (value === 'clear') {
          return initialState;
        }

        // Backspace / delete
        if (value === 'backspace') {
          if (hasResult || error) return initialState;
          const newDisplay = display.length > 1 ? display.slice(0, -1) : '0';
          const newExpr = expression.length > 1 ? expression.slice(0, -1) : '';
          return { ...prev, display: newDisplay, expression: newExpr };
        }

        // Negate
        if (value === 'negate') {
          if (error) return prev;
          if (display === '0') return prev;
          const negated = display.startsWith('-')
            ? display.slice(1)
            : '-' + display;
          // Update expression too: replace last number with negated
          const newExpr = expression.replace(/(-?[\d.]+)$/, negated);
          return { ...prev, display: negated, expression: newExpr, hasResult: false };
        }

        // Percentage
        if (value === '%') {
          if (error) return prev;
          const num = parseFloat(display);
          if (isNaN(num)) return prev;
          const pct = formatNumber(num / 100);
          const newExpr = expression.replace(/(-?[\d.]+)$/, pct);
          return { ...prev, display: pct, expression: newExpr, hasResult: false };
        }

        // Equals
        if (value === '=') {
          if (error) return initialState;
          const exprToEval = expression || display;
          if (!exprToEval) return prev;

          const { result, error: evalError } = evaluateExpression(exprToEval);

          if (evalError) {
            return { ...prev, error: evalError, hasResult: false };
          }

          // Save to DB async — we trigger it outside setState
          return {
            display: result,
            expression: exprToEval,
            hasResult: true,
            error: null,
          };
        }

        // Operator
        if (isOperator(value)) {
          if (error) return initialState;

          const displayOp = value === '*' ? '×' : value === '/' ? '÷' : value;

          // If we have a result, continue from it
          if (hasResult) {
            return {
              display: displayOp,
              expression: display + value,
              hasResult: false,
              error: null,
            };
          }

          // Replace last operator if it's there
          const lastChar = expression.slice(-1);
          if (isOperator(lastChar)) {
            return {
              ...prev,
              display: displayOp,
              expression: expression.slice(0, -1) + value,
            };
          }

          return {
            display: displayOp,
            expression: expression + value,
            hasResult: false,
            error: null,
          };
        }

        // Decimal point
        if (value === '.') {
          if (error) return prev;
          if (hasResult) {
            return {
              display: '0.',
              expression: '0.',
              hasResult: false,
              error: null,
            };
          }
          // Don't allow multiple decimals in one number
          const parts = expression.split(/[+\-*/]/);
          const lastPart = parts[parts.length - 1];
          if (lastPart.includes('.')) return prev;

          const newDisplay = display.includes('.') ? display : display + '.';
          return {
            ...prev,
            display: newDisplay,
            expression: expression + '.',
          };
        }

        // Number
        if (error) {
          return {
            display: value,
            expression: value,
            hasResult: false,
            error: null,
          };
        }

        if (hasResult) {
          return {
            display: value,
            expression: value,
            hasResult: false,
            error: null,
          };
        }

        // If previous was operator, start new number
        const lastChar = expression.slice(-1);
        if (isOperator(lastChar)) {
          return {
            ...prev,
            display: value,
            expression: expression + value,
          };
        }

        const newDisplay =
          display === '0' && value !== '0'
            ? value
            : display === '0' && value === '0'
            ? '0'
            : display + value;

        const newExpression =
          expression === '' || expression === '0'
            ? value
            : expression + value;

        return {
          ...prev,
          display: newDisplay,
          expression: newExpression,
        };
      });

      // Handle = save outside setState
      if (value === '=') {
        setState((prev) => {
          // We need to trigger the save after this render
          return prev;
        });
      }
    },
    []
  );

  // Separate effect-style save after equals
  const handleEquals = useCallback(async () => {
    setState((currentState) => {
      const { expression, error } = currentState;
      if (!error && currentState.hasResult && expression) {
        // Save asynchronously
        setSaving(true);
        const exprToSave = expression;
        const resultToSave = currentState.display;
        fetch('/api/calculations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            expression: exprToSave,
            result: resultToSave,
          }),
        })
          .then(() => {
            setRefreshTrigger((r) => r + 1);
          })
          .catch(console.error)
          .finally(() => setSaving(false));
      }
      return currentState;
    });
  }, []);

  // We use a wrapper to handle equals specially
  const handleButtonClick = useCallback(
    async (value: string) => {
      if (value === '=') {
        // First compute in state
        let computed = false;
        setState((prev) => {
          if (prev.error) return initialState;
          const exprToEval = prev.expression || prev.display;
          if (!exprToEval) return prev;
          const { result, error: evalError } = evaluateExpression(exprToEval);
          if (evalError) {
            return { ...prev, error: evalError, hasResult: false };
          }
          computed = true;
          // Schedule save
          setTimeout(() => {
            setSaving(true);
            fetch('/api/calculations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                expression: exprToEval,
                result,
              }),
            })
              .then(() => setRefreshTrigger((r) => r + 1))
              .catch(console.error)
              .finally(() => setSaving(false));
          }, 0);
          return {
            display: result,
            expression: exprToEval,
            hasResult: true,
            error: null,
          };
        });
        void computed;
        return;
      }
      handleButton(value);
    },
    [handleButton]
  );

  void handleEquals;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Calculator Panel */}
      <div className="flex flex-col gap-0">
        {/* Profile Header */}
        <div className="bg-white rounded-t-3xl border border-slate-100 px-5 pt-5 pb-3 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-slate-800">Calculator</div>
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                {saving ? 'Saving...' : 'Online'}
              </div>
            </div>
            <div className="ml-auto">
              <span className="bg-brand-50 text-brand-600 text-xs font-medium px-2.5 py-1 rounded-full">
                Basic
              </span>
            </div>
          </div>
        </div>

        {/* Calculator Body */}
        <div className="bg-white border-x border-slate-100 px-4 py-4">
          <Display
            expression={state.expression}
            display={state.display}
            error={state.error}
          />

          {/* Backspace row */}
          <div className="flex justify-end mb-2">
            <button
              onClick={() => handleButton('backspace')}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-600 text-sm transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
              </svg>
              <span>Del</span>
            </button>
          </div>

          {/* Buttons Grid */}
          <div className="grid grid-cols-4 gap-2.5">
            {BUTTONS.map((btn, i) => (
              <Button key={i} config={btn} onClick={handleButtonClick} />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white rounded-b-3xl border border-t-0 border-slate-100 px-5 py-3 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Powered by xyz</span>
            <div className="flex items-center gap-3">
              <button className="hover:text-brand-500 transition-colors flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Like
              </button>
              <button className="hover:text-brand-500 transition-colors flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Comment
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* History Feed Panel */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col" style={{ maxHeight: '600px' }}>
        <div className="px-5 pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-sm">Activity Feed</h2>
              <p className="text-xs text-slate-400">Your recent calculations</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-hidden px-4 py-4">
          <CalculationHistory refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  );
}
