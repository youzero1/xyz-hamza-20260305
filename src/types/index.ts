export interface CalculationRecord {
  id: number;
  expression: string;
  result: string;
  likes: number;
  shared: boolean;
  createdAt: string;
}

export interface CalculatorState {
  display: string;
  expression: string;
  hasResult: boolean;
  error: string | null;
}

export type ButtonType = 'number' | 'operator' | 'action' | 'equals' | 'clear';

export interface ButtonConfig {
  label: string;
  value: string;
  type: ButtonType;
  span?: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}
