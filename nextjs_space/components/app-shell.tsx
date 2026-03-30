'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calculator, FileSpreadsheet, Users, Upload, Settings, Sun, Moon, ArrowLeft } from 'lucide-react';
import CalculatorModule from '@/components/calculator/calculator-module';
import EstimatorModule from '@/components/estimator/estimator-module';
import SuppliersModule from '@/components/suppliers/suppliers-module';
import UploadDocsModule from '@/components/upload/upload-docs-module';
import SettingsModule from '@/components/settings/settings-module';

const MODULES = [
  {
    id: 'calculator',
    label: 'Board Foot Calculator',
    subtitle: 'Roughstock & dimensional lumber',
    icon: Calculator,
    bg: 'bg-[#3D1F0F]',
    hoverBg: 'hover:bg-[#4E2A16]',
    borderColor: 'border-[#5A3520]',
  },
  {
    id: 'estimator',
    label: 'Estimator',
    subtitle: 'Project-level BF estimation',
    icon: FileSpreadsheet,
    bg: 'bg-[#0F1A2E]',
    hoverBg: 'hover:bg-[#162440]',
    borderColor: 'border-[#1E3050]',
  },
  {
    id: 'suppliers',
    label: 'Suppliers',
    subtitle: 'Manage suppliers and price lists',
    icon: Users,
    bg: 'bg-[#2A1040]',
    hoverBg: 'hover:bg-[#381856]',
    borderColor: 'border-[#3E1E5C]',
  },
  {
    id: 'upload',
    label: 'Upload Docs',
    subtitle: 'Import supplier price sheets',
    icon: Upload,
    bg: 'bg-[#0A2018]',
    hoverBg: 'hover:bg-[#123028]',
    borderColor: 'border-[#1A3A2E]',
  },
  {
    id: 'settings',
    label: 'Settings',
    subtitle: 'Tax, fees, and preferences',
    icon: Settings,
    bg: 'bg-[#1A1A1A]',
    hoverBg: 'hover:bg-[#262626]',
    borderColor: 'border-[#333333]',
  },
] as const;

type ModuleId = (typeof MODULES)[number]['id'];

export default function AppShell() {
  const [activeModule, setActiveModule] = useState<ModuleId | null>(null);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        const data = await res?.json?.();
        const isDark = (data?.dark_mode ?? 'true') !== 'false';
        setDarkMode(isDark);
        document.documentElement.classList.toggle('dark', isDark);
        try {
          localStorage.setItem('redleg_dark_mode', String(isDark));
        } catch (_e) {
          /* noop */
        }
      } catch (e) {
        console.error('Failed to fetch settings:', e);
      }
    };
    fetchSettings();
  }, []);

  const handleDarkModeChange = useCallback((val: boolean) => {
    setDarkMode(val);
    document.documentElement.classList.toggle('dark', val);
    try {
      localStorage.setItem('redleg_dark_mode', String(val));
    } catch (_e) {
      /* noop */
    }
  }, []);

  const toggleDarkMode = useCallback(() => {
    const newVal = !darkMode;
    handleDarkModeChange(newVal);
    fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{ key: 'dark_mode', value: String(newVal) }]),
    }).catch(() => {});
  }, [darkMode, handleDarkModeChange]);

  const goHome = useCallback(() => setActiveModule(null), []);

  // Inner module view
  if (activeModule) {
    const mod = MODULES.find((m) => m.id === activeModule)!;
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {/* Inner page header */}
        <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
          <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={goHome}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Back</span>
              </button>
              <div className="w-px h-6 bg-border" />
              <div className="flex items-center gap-2">
                <mod.icon className="w-5 h-5 text-primary" />
                <h1 className="text-lg font-bold text-foreground">{mod.label}</h1>
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Module content */}
        <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 py-6">
          {activeModule === 'calculator' && <CalculatorModule />}
          {activeModule === 'estimator' && <EstimatorModule />}
          {activeModule === 'suppliers' && <SuppliersModule />}
          {activeModule === 'upload' && <UploadDocsModule />}
          {activeModule === 'settings' && (
            <SettingsModule darkMode={darkMode} onDarkModeChange={handleDarkModeChange} />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-border py-4 px-4">
          <div className="max-w-[1200px] mx-auto flex items-center justify-between text-xs text-muted-foreground">
            <span>&copy; 2026 REDLEG WOOD CO.</span>
            <span>V4.2</span>
          </div>
        </footer>
      </div>
    );
  }

  // Home dashboard
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Home header — branding + dark mode toggle */}
      <header className="px-4 pt-8 pb-2">
        <div className="max-w-[900px] mx-auto flex items-start justify-between">
          {/* Logo */}
          <div className="border border-border/60 rounded-lg px-5 py-3 inline-block">
            <h1
              className="text-2xl sm:text-3xl font-bold text-foreground leading-tight"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontStyle: 'italic' }}
            >
              RedLeg Wood Co.
            </h1>
            <p className="text-[10px] sm:text-xs tracking-[0.25em] text-muted-foreground mt-1 uppercase">
              Professional Woodworking Tools
            </p>
          </div>

          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="mt-2 p-2.5 rounded-full bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Dashboard tiles */}
      <main className="flex-1 px-4 py-8">
        <div className="max-w-[900px] mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.id}
                onClick={() => setActiveModule(mod.id)}
                className={`${mod.bg} ${mod.hoverBg} border ${mod.borderColor} rounded-2xl p-6 sm:p-8 text-left transition-all duration-200 transform hover:scale-[1.02] hover:shadow-xl group focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                  mod.id === 'settings' ? 'sm:col-span-2' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-white/10 group-hover:bg-white/15 transition-colors">
                    <Icon className="w-6 h-6 text-white/90" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">
                      {mod.label}
                    </h2>
                    <p className="text-sm text-white/60 mt-1">{mod.subtitle}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-4">
        <div className="max-w-[900px] mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <span>&copy; 2026 REDLEG WOOD CO.</span>
          <span>V4.2</span>
        </div>
      </footer>
    </div>
  );
}