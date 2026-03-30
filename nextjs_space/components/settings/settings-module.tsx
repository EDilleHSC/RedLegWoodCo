'use client';

import { useState, useEffect, useCallback } from 'react';
import { Settings, Save, Moon, Sun, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  darkMode: boolean;
  onDarkModeChange: (val: boolean) => void;
}

export default function SettingsModule({ darkMode, onDarkModeChange }: Props) {
  const [taxRate, setTaxRate] = useState('');
  const [defaultSupplierId, setDefaultSupplierId] = useState('');
  const [suppliers, setSuppliers] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const [settRes, suppRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/suppliers'),
      ]);
      const settData = await settRes?.json?.() ?? {};
      const suppData = await suppRes?.json?.() ?? [];

      // Convert tax rate to percentage for display
      const rawTax = parseFloat(settData?.default_tax_rate ?? '0') || 0;
      setTaxRate(String(rawTax * 100));
      setDefaultSupplierId(settData?.default_supplier_id ?? '');
      setSuppliers(Array.isArray(suppData) ? suppData : []);
    } catch (e) {
      console.error('Failed to load settings:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const handleSave = async () => {
    try {
      const taxVal = parseFloat(taxRate) || 0;
      const taxDecimal = taxVal / 100; // Convert from percentage to decimal

      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([
          { key: 'default_tax_rate', value: String(taxDecimal) },
          { key: 'dark_mode', value: String(darkMode) },
          { key: 'default_supplier_id', value: defaultSupplierId },
        ]),
      });
      toast.success('Settings saved');
    } catch (e) {
      toast.error('Failed to save settings');
    }
  };

  const handleToggleDarkMode = async () => {
    const newVal = !darkMode;
    onDarkModeChange(newVal);
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{ key: 'dark_mode', value: String(newVal) }]),
      });
    } catch (e) {
      console.error('Failed to save dark mode:', e);
    }
  };

  const handleClearData = async () => {
    if (!confirm('This will delete ALL suppliers, price sheets, projects, and reset settings. This cannot be undone. Continue?')) return;
    try {
      const res = await fetch('/api/data/clear', { method: 'POST' });
      if (res?.ok) {
        toast.success('All data cleared');
        loadSettings();
      } else {
        toast.error('Failed to clear data');
      }
    } catch (e) {
      toast.error('Failed to clear data');
    }
  };

  if (loading) {
    return <div className="text-muted-foreground text-center py-12">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">Settings</h2>
      </div>
      <p className="text-muted-foreground">Configure default tax rates, fees, dark mode, and manage application data.</p>

      {/* Dark Mode */}
      <div className="bg-card rounded-xl p-6 shadow space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          {darkMode ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
          Appearance
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Dark Mode</p>
            <p className="text-sm text-muted-foreground">Toggle between light and dark themes</p>
          </div>
          <button onClick={handleToggleDarkMode} className="flex items-center gap-2">
            {darkMode ? (
              <ToggleRight className="w-10 h-10 text-primary" />
            ) : (
              <ToggleLeft className="w-10 h-10 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Tax & Defaults */}
      <div className="bg-card rounded-xl p-6 shadow space-y-4">
        <h3 className="font-semibold">Defaults</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Default Tax Rate (%)</label>
            <input
              type="number"
              value={taxRate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTaxRate(e?.target?.value ?? '0')}
              step="0.1"
              min="0"
              max="100"
              placeholder="e.g. 8 for 8%"
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
            />
            <p className="text-xs text-muted-foreground mt-1">Stored as decimal (e.g. 8% = 0.08)</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Default Supplier</label>
            <select
              value={defaultSupplierId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDefaultSupplierId(e?.target?.value ?? '')}
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
            >
              <option value="">None</option>
              {(suppliers ?? []).map((s: any) => (
                <option key={s?.id} value={String(s?.id)}>{s?.name ?? ''}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition shadow"
        >
          <Save className="w-4 h-4" /> Save Settings
        </button>
      </div>

      {/* Data Management */}
      <div className="bg-card rounded-xl p-6 shadow space-y-4">
        <h3 className="font-semibold">Data Management</h3>
        <p className="text-sm text-muted-foreground">Clear all application data including suppliers, price sheets, and projects. This action cannot be undone.</p>
        <button
          onClick={handleClearData}
          className="flex items-center gap-2 bg-destructive text-destructive-foreground px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition shadow"
        >
          <Trash2 className="w-4 h-4" /> Clear All Data
        </button>
      </div>
    </div>
  );
}
