'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calculator, ToggleLeft, ToggleRight, DollarSign, Ruler, Hash } from 'lucide-react';
import toast from 'react-hot-toast';

interface Supplier {
  id: number;
  name: string;
  taxRate: number;
  taxExempt: boolean;
  deliveryFee: number;
}

const THICKNESS_OPTIONS = [
  { label: '4/4', value: 4 },
  { label: '5/4', value: 5 },
  { label: '6/4', value: 6 },
  { label: '8/4', value: 8 },
  { label: '10/4', value: 10 },
  { label: '12/4', value: 12 },
  { label: '16/4', value: 16 },
];

export default function CalculatorModule() {
  const [mode, setMode] = useState<'roughstock' | 'dimensional'>('roughstock');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [species, setSpecies] = useState('');
  const [grade, setGrade] = useState('');
  const [thicknessQuarters, setThicknessQuarters] = useState(4);
  const [width, setWidth] = useState('');
  const [length, setLength] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [defaultTaxRate, setDefaultTaxRate] = useState(0);
  const [overrideTaxExempt, setOverrideTaxExempt] = useState(false);

  const [result, setResult] = useState<{
    boardFeet: number;
    linearFeet: number;
    pricePerBf: number;
    found: boolean;
    subtotal: number;
    tax: number;
    deliveryFee: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [suppRes, settRes] = await Promise.all([
          fetch('/api/suppliers'),
          fetch('/api/settings'),
        ]);
        const suppData = await suppRes?.json?.() ?? [];
        const settData = await settRes?.json?.() ?? {};
        setSuppliers(Array.isArray(suppData) ? suppData : []);
        setDefaultTaxRate(parseFloat(settData?.default_tax_rate ?? '0') || 0);
        const defaultSuppId = settData?.default_supplier_id ?? '';
        if (defaultSuppId) setSelectedSupplierId(defaultSuppId);
      } catch (e) {
        console.error('Failed to load calculator data:', e);
      }
    };
    load();
  }, []);

  const selectedSupplier = suppliers?.find?.((s: Supplier) => String(s?.id) === selectedSupplierId) ?? null;

  const handleCalculate = useCallback(async () => {
    const w = parseFloat(width) || 0;
    const l = parseFloat(length) || 0;
    const qty = parseInt(quantity) || 0;
    const tq = thicknessQuarters || 0;

    if (!w || !l || !qty) {
      toast.error('Please fill in width, length, and quantity');
      return;
    }

    // Board foot formula: (Thickness_quarters/4 × Width_in × Length_in × Quantity) / 12
    const boardFeet = ((tq / 4) * w * l * qty) / 12;
    const linearFeet = (qty * l) / 12;

    // Price lookup
    let pricePerBf = 0;
    let found = false;

    if (selectedSupplierId && species && grade) {
      try {
        const res = await fetch(
          `/api/price-lookup?supplier_id=${selectedSupplierId}&species=${encodeURIComponent(species)}&grade=${encodeURIComponent(grade)}&thickness_quarters=${tq}`
        );
        const data = await res?.json?.();
        pricePerBf = data?.price_per_bf ?? 0;
        found = data?.found ?? false;
      } catch (e) {
        console.error('Price lookup error:', e);
      }
    }

    const subtotal = boardFeet * pricePerBf;

    // Tax logic
    let taxRate = defaultTaxRate;
    if (overrideTaxExempt || selectedSupplier?.taxExempt) {
      taxRate = 0;
    } else if (selectedSupplier && (selectedSupplier?.taxRate ?? 0) > 0) {
      taxRate = selectedSupplier.taxRate;
    }
    const tax = subtotal * taxRate;
    const deliveryFee = selectedSupplier?.deliveryFee ?? 0;
    const total = subtotal + tax + deliveryFee;

    setResult({
      boardFeet: Math.round(boardFeet * 100) / 100,
      linearFeet: Math.round(linearFeet * 100) / 100,
      pricePerBf,
      found,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      deliveryFee: Math.round(deliveryFee * 100) / 100,
      total: Math.round(total * 100) / 100,
    });
  }, [width, length, quantity, thicknessQuarters, selectedSupplierId, species, grade, defaultTaxRate, overrideTaxExempt, selectedSupplier]);

  const handleClear = () => {
    setSpecies('');
    setGrade('');
    setThicknessQuarters(4);
    setWidth('');
    setLength('');
    setQuantity('1');
    setOverrideTaxExempt(false);
    setResult(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calculator className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">Board Foot Calculator</h2>
      </div>
      <p className="text-muted-foreground">Calculate board feet, linear feet, and lumber costs with supplier pricing.</p>

      {/* Mode toggle */}
      <div className="flex items-center gap-3 bg-card rounded-xl p-4 shadow">
        <span className="text-sm font-medium">Mode:</span>
        <button
          onClick={() => { setMode('roughstock'); setResult(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'roughstock' ? 'bg-primary text-primary-foreground shadow' : 'bg-secondary text-secondary-foreground hover:bg-accent'
          }`}
        >
          <Ruler className="w-4 h-4" />
          Roughstock (BF)
        </button>
        <button
          onClick={() => { setMode('dimensional'); setResult(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'dimensional' ? 'bg-primary text-primary-foreground shadow' : 'bg-secondary text-secondary-foreground hover:bg-accent'
          }`}
        >
          <Hash className="w-4 h-4" />
          Dimensional (LF)
        </button>
      </div>

      {/* Input form */}
      <div className="bg-card rounded-xl p-6 shadow space-y-4">
        {/* Supplier */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Supplier</label>
            <select
              value={selectedSupplierId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedSupplierId(e?.target?.value ?? '')}
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
            >
              <option value="">Select supplier...</option>
              {(suppliers ?? []).map((s: Supplier) => (
                <option key={s?.id} value={String(s?.id)}>{s?.name ?? 'Unnamed'}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Species</label>
            <input
              type="text"
              value={species}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSpecies(e?.target?.value ?? '')}
              placeholder="e.g. White Oak, Teak"
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Grade</label>
            <input
              type="text"
              value={grade}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGrade(e?.target?.value ?? '')}
              placeholder="e.g. FAS, FEQ, SEL"
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Thickness</label>
            <select
              value={thicknessQuarters}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setThicknessQuarters(parseInt(e?.target?.value ?? '4') || 4)}
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
            >
              {THICKNESS_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuantity(e?.target?.value ?? '1')}
              min="1"
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Width (inches)</label>
            <input
              type="number"
              value={width}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWidth(e?.target?.value ?? '')}
              placeholder="e.g. 8"
              step="0.25"
              min="0"
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Length (inches)</label>
            <input
              type="number"
              value={length}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLength(e?.target?.value ?? '')}
              placeholder="e.g. 96"
              step="1"
              min="0"
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
            />
          </div>
        </div>

        {/* Tax exempt toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOverrideTaxExempt(!overrideTaxExempt)}
            className="flex items-center gap-2 text-sm"
          >
            {overrideTaxExempt ? (
              <ToggleRight className="w-6 h-6 text-primary" />
            ) : (
              <ToggleLeft className="w-6 h-6 text-muted-foreground" />
            )}
            Tax Exempt
          </button>
          {(overrideTaxExempt || selectedSupplier?.taxExempt) && (
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Tax Excepted</span>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleCalculate}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition shadow"
          >
            <Calculator className="w-4 h-4" />
            Calculate
          </button>
          <button
            onClick={handleClear}
            className="px-6 py-2.5 rounded-lg font-medium bg-secondary text-secondary-foreground hover:bg-accent transition"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-card rounded-xl p-6 shadow space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Results
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ResultCard label={mode === 'roughstock' ? 'Board Feet' : 'Linear Feet'} value={mode === 'roughstock' ? result.boardFeet : result.linearFeet} />
            <ResultCard label="Price/BF" value={`$${result?.pricePerBf?.toFixed?.(2) ?? '0.00'}`} sub={result.found ? 'Found' : 'Not found'} />
            <ResultCard label="Subtotal" value={`$${result?.subtotal?.toFixed?.(2) ?? '0.00'}`} />
            <ResultCard label="Tax" value={`$${result?.tax?.toFixed?.(2) ?? '0.00'}`} sub={overrideTaxExempt || selectedSupplier?.taxExempt ? 'Exempt' : ''} />
          </div>
          {(result?.deliveryFee ?? 0) > 0 && (
            <div className="text-sm text-muted-foreground">Delivery Fee: ${result?.deliveryFee?.toFixed?.(2) ?? '0.00'}</div>
          )}
          <div className="border-t border-border pt-4">
            <div className="text-2xl font-bold text-primary">
              Total: ${result?.total?.toFixed?.(2) ?? '0.00'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-background rounded-lg p-4 text-center">
      <div className="text-xs text-muted-foreground mb-1">{label ?? ''}</div>
      <div className="text-xl font-bold">{value ?? 0}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}
