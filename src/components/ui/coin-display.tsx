// =============================================================
// Coin Display — Shows coin count with icon
// =============================================================

interface CoinDisplayProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeStyles = {
  sm: 'text-xs gap-1',
  md: 'text-sm gap-1.5',
  lg: 'text-lg gap-2 font-bold',
};

export function CoinDisplay({ amount, size = 'md', className = '' }: CoinDisplayProps) {
  return (
    <span className={`inline-flex items-center text-coin-gold ${sizeStyles[size]} ${className}`}>
      <span>🪙</span>
      <span>{amount.toLocaleString()}</span>
    </span>
  );
}
