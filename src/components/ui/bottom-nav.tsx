// =============================================================
// Bottom Navigation — iPhone-style tab bar
// =============================================================

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/dashboard', label: 'Home', icon: '🏠' },
  { href: '/routines', label: 'Routines', icon: '✅' },
  { href: '/workouts', label: 'Workouts', icon: '💪' },
  { href: '/shop', label: 'Shop', icon: '🛍️' },
  { href: '/profile', label: 'Profile', icon: '👤' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-t border-white/10 pb-safe">
      <div className="flex items-center justify-around h-14 max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 text-xs tap-scale py-1 px-3 ${
                isActive ? 'text-brand-400' : 'text-gray-500'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
