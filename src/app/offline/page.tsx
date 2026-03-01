'use client';

// =============================================================
// Offline Fallback Page
// =============================================================

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="text-6xl mb-4">📡</div>
      <h1 className="text-2xl font-bold mb-2">You&apos;re Offline</h1>
      <p className="text-gray-400 mb-6 max-w-xs">
        LevelUp needs an internet connection for most features.
        Check your connection and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-xl font-medium tap-scale"
      >
        Retry Connection
      </button>
    </div>
  );
}
