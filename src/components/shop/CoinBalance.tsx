'use client';

// =============================================================
// CoinBalance — Animated coin counter with change indicator
// =============================================================

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CoinBalanceProps {
  balance: number;
  size?: 'sm' | 'md' | 'lg';
  showChange?: boolean;
}

export default function CoinBalance({
  balance,
  size = 'md',
  showChange = true,
}: CoinBalanceProps) {
  const [prevBalance, setPrevBalance] = useState(balance);
  const [change, setChange] = useState(0);
  const [showChangeIndicator, setShowChangeIndicator] = useState(false);

  useEffect(() => {
    if (balance !== prevBalance && showChange) {
      const diff = balance - prevBalance;
      setChange(diff);
      setShowChangeIndicator(true);
      setPrevBalance(balance);

      const timer = setTimeout(() => {
        setShowChangeIndicator(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [balance, prevBalance, showChange]);

  const sizeClasses = {
    sm: 'text-sm gap-1.5',
    md: 'text-lg gap-2',
    lg: 'text-2xl gap-3',
  };

  const iconSize = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  return (
    <div className="relative flex items-center">
      <div className={`flex items-center ${sizeClasses[size]} font-bold`}>
        <span className={iconSize[size]}>🪙</span>
        <motion.span
          key={balance}
          initial={{ scale: 1.2, color: '#fbbf24' }}
          animate={{ scale: 1, color: '#ffffff' }}
          transition={{ duration: 0.3 }}
          className="text-white"
        >
          {balance.toLocaleString()}
        </motion.span>
      </div>

      {/* Change Indicator */}
      <AnimatePresence>
        {showChangeIndicator && change !== 0 && (
          <motion.div
            initial={{ opacity: 0, y: 0, x: 10 }}
            animate={{ opacity: 1, y: -30, x: 10 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.5 }}
            className={`absolute left-full ml-2 text-sm font-bold whitespace-nowrap ${
              change > 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {change > 0 ? '+' : ''}{change}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
