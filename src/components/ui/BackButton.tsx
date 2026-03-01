'use client';

import { useRouter } from 'next/navigation';

interface BackButtonProps {
  href?: string;
  label?: string;
}

export default function BackButton({ href, label = 'Back' }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors mb-3"
    >
      <span className="text-lg leading-none">‹</span>
      <span>{label}</span>
    </button>
  );
}
