// =============================================================
// Settings Page — User preferences & account
// =============================================================

export default function SettingsPage() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Settings ⚙️</h1>

      <div className="space-y-3">
        <div className="glass p-4">
          <h2 className="font-medium mb-2">Notifications</h2>
          <p className="text-sm text-gray-400">Configure push notification preferences</p>
          {/* TODO: Toggle push subscription */}
        </div>

        <div className="glass p-4">
          <h2 className="font-medium mb-2">Timezone</h2>
          <p className="text-sm text-gray-400">Used for streak calculations & daily reset</p>
          {/* TODO: Timezone picker */}
        </div>

        <div className="glass p-4">
          <h2 className="font-medium mb-2">Account</h2>
          <p className="text-sm text-gray-400">Manage your account settings</p>
          {/* TODO: Email change, password, delete account */}
        </div>

        <button className="w-full glass p-4 text-red-400 font-medium tap-scale">
          Sign Out
        </button>
      </div>
    </div>
  );
}
