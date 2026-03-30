'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileSpreadsheet, Plus, Trash2, Save, FolderPlus } from 'lucide-react';
import toast from 'react-hot-toast';

interface Project {
  id: number;
  name: string;
  client: string | null;
  notes: string | null;
  items: ProjectItem[];
}

interface ProjectItem {
  id: number;
  species: string;
  grade: string | null;
  thicknessQuarters: number | null;
  widthInches: number | null;
  lengthInches: number | null;
  quantity: number;
  boardFeet: number | null;
  pricePerBf: number | null;
  totalCost: number | null;
}

interface LineItem {
  tempId: string;
  species: string;
  grade: string;
  thicknessQuarters: number;
  widthInches: string;
  lengthInches: string;
  quantity: string;
  pricePerBf: string;
  boardFeet: number;
  totalCost: number;
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

export default function EstimatorModule() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [projectName, setProjectName] = useState('');
  const [projectClient, setProjectClient] = useState('');
  const [projectNotes, setProjectNotes] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [showNewProject, setShowNewProject] = useState(false);
  const [suppliers, setSuppliers] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');

  const loadProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res?.json?.() ?? [];
      setProjects(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load projects:', e);
    }
  }, []);

  useEffect(() => {
    loadProjects();
    fetch('/api/suppliers').then((r: Response) => r?.json?.()).then((d: any) => {
      setSuppliers(Array.isArray(d) ? d : []);
    }).catch((e: any) => console.error(e));
    fetch('/api/settings').then((r: Response) => r?.json?.()).then((d: any) => {
      if (d?.default_supplier_id) setSelectedSupplierId(d.default_supplier_id);
    }).catch((e: any) => console.error(e));
  }, [loadProjects]);

  const handleSelectProject = useCallback(async (id: string) => {
    setSelectedProjectId(id);
    if (!id) { setLineItems([]); return; }
    try {
      const res = await fetch(`/api/projects/${id}`);
      const data = await res?.json?.();
      const items: ProjectItem[] = data?.items ?? [];
      setLineItems(items.map((item: ProjectItem) => ({
        tempId: `db-${item?.id ?? Math.random()}`,
        species: item?.species ?? '',
        grade: item?.grade ?? '',
        thicknessQuarters: item?.thicknessQuarters ?? 4,
        widthInches: String(item?.widthInches ?? ''),
        lengthInches: String(item?.lengthInches ?? ''),
        quantity: String(item?.quantity ?? 1),
        pricePerBf: String(item?.pricePerBf ?? ''),
        boardFeet: item?.boardFeet ?? 0,
        totalCost: item?.totalCost ?? 0,
      })));
      setProjectName(data?.name ?? '');
      setProjectClient(data?.client ?? '');
      setProjectNotes(data?.notes ?? '');
    } catch (e) {
      console.error('Failed to load project:', e);
    }
  }, []);

  const addLineItem = () => {
    setLineItems((prev: LineItem[]) => [...(prev ?? []), {
      tempId: `new-${Date.now()}`,
      species: '', grade: '', thicknessQuarters: 4,
      widthInches: '', lengthInches: '', quantity: '1',
      pricePerBf: '', boardFeet: 0, totalCost: 0,
    }]);
  };

  const updateLineItem = (idx: number, field: string, value: string | number) => {
    setLineItems((prev: LineItem[]) => {
      const items = [...(prev ?? [])];
      const item = { ...(items[idx] ?? {}) } as LineItem;
      (item as any)[field] = value;

      const tq = item?.thicknessQuarters ?? 4;
      const w = parseFloat(String(item?.widthInches ?? '0')) || 0;
      const l = parseFloat(String(item?.lengthInches ?? '0')) || 0;
      const qty = parseInt(String(item?.quantity ?? '1')) || 0;
      const ppbf = parseFloat(String(item?.pricePerBf ?? '0')) || 0;
      const bf = ((tq / 4) * w * l * qty) / 12;
      item.boardFeet = Math.round(bf * 100) / 100;
      item.totalCost = Math.round(bf * ppbf * 100) / 100;

      items[idx] = item;
      return items;
    });
  };

  const removeLineItem = (idx: number) => {
    setLineItems((prev: LineItem[]) => (prev ?? []).filter((_: LineItem, i: number) => i !== idx));
  };

  const lookupPrice = useCallback(async (idx: number) => {
    const item = lineItems?.[idx];
    if (!item || !selectedSupplierId || !item.species || !item.grade) return;
    try {
      const res = await fetch(
        `/api/price-lookup?supplier_id=${selectedSupplierId}&species=${encodeURIComponent(item.species)}&grade=${encodeURIComponent(item.grade)}&thickness_quarters=${item.thicknessQuarters}`
      );
      const data = await res?.json?.();
      if (data?.found) {
        updateLineItem(idx, 'pricePerBf', String(data.price_per_bf));
      }
    } catch (e) {
      console.error('Price lookup failed:', e);
    }
  }, [lineItems, selectedSupplierId]);

  const handleCreateProject = async () => {
    if (!projectName?.trim?.()) {
      toast.error('Project name is required');
      return;
    }
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: projectName, client: projectClient, notes: projectNotes }),
      });
      const data = await res?.json?.();
      toast.success('Project created');
      setShowNewProject(false);
      await loadProjects();
      setSelectedProjectId(String(data?.id ?? ''));
      handleSelectProject(String(data?.id ?? ''));
    } catch (e) {
      toast.error('Failed to create project');
    }
  };

  const handleSaveItems = async () => {
    if (!selectedProjectId) {
      toast.error('Select or create a project first');
      return;
    }
    try {
      // Delete existing items first
      const existingRes = await fetch(`/api/projects/${selectedProjectId}/items`);
      const existingItems: any[] = await existingRes?.json?.() ?? [];
      for (const ei of (existingItems ?? [])) {
        await fetch(`/api/projects/${selectedProjectId}/items/${ei?.id}`, { method: 'DELETE' });
      }
      // Save new items
      const items = (lineItems ?? []).filter((li: LineItem) => li?.species?.trim?.()).map((li: LineItem) => ({
        species: li.species,
        grade: li.grade,
        thickness_quarters: li.thicknessQuarters,
        width_inches: parseFloat(li.widthInches) || 0,
        length_inches: parseFloat(li.lengthInches) || 0,
        quantity: parseInt(li.quantity) || 1,
        price_per_bf: parseFloat(li.pricePerBf) || 0,
      }));
      if (items?.length) {
        await fetch(`/api/projects/${selectedProjectId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(items),
        });
      }
      toast.success('Items saved');
      await loadProjects();
    } catch (e) {
      toast.error('Failed to save items');
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProjectId) return;
    if (!confirm('Delete this project and all its items?')) return;
    try {
      await fetch(`/api/projects/${selectedProjectId}`, { method: 'DELETE' });
      toast.success('Project deleted');
      setSelectedProjectId('');
      setLineItems([]);
      setProjectName('');
      await loadProjects();
    } catch (e) {
      toast.error('Failed to delete project');
    }
  };

  const grandTotalBF = (lineItems ?? []).reduce((sum: number, li: LineItem) => sum + (li?.boardFeet ?? 0), 0);
  const grandTotalCost = (lineItems ?? []).reduce((sum: number, li: LineItem) => sum + (li?.totalCost ?? 0), 0);

  // Per-species subtotals
  const speciesSubtotals: Record<string, { bf: number; cost: number }> = {};
  (lineItems ?? []).forEach((li: LineItem) => {
    const sp = li?.species?.trim?.() ?? '';
    if (!sp) return;
    if (!speciesSubtotals[sp]) speciesSubtotals[sp] = { bf: 0, cost: 0 };
    speciesSubtotals[sp].bf += li?.boardFeet ?? 0;
    speciesSubtotals[sp].cost += li?.totalCost ?? 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileSpreadsheet className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">Project Estimator</h2>
      </div>
      <p className="text-muted-foreground">Create multi-line project estimates with species-level subtotals and grand totals.</p>

      {/* Project selector */}
      <div className="bg-card rounded-xl p-4 shadow flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-1">Project</label>
          <select
            value={selectedProjectId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleSelectProject(e?.target?.value ?? '')}
            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
          >
            <option value="">Select project...</option>
            {(projects ?? []).map((p: Project) => (
              <option key={p?.id} value={String(p?.id)}>{p?.name ?? 'Untitled'}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[200px]">
          <label className="block text-sm font-medium mb-1">Supplier (for pricing)</label>
          <select
            value={selectedSupplierId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedSupplierId(e?.target?.value ?? '')}
            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
          >
            <option value="">Select supplier...</option>
            {(suppliers ?? []).map((s: any) => (
              <option key={s?.id} value={String(s?.id)}>{s?.name ?? ''}</option>
            ))}
          </select>
        </div>
        <button onClick={() => setShowNewProject(!showNewProject)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition shadow">
          <FolderPlus className="w-4 h-4" /> New Project
        </button>
        {selectedProjectId && (
          <button onClick={handleDeleteProject} className="flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition shadow">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        )}
      </div>

      {/* New project form */}
      {showNewProject && (
        <div className="bg-card rounded-xl p-4 shadow space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Project Name *</label>
              <input type="text" value={projectName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProjectName(e?.target?.value ?? '')} className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none" placeholder="Project name" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Client</label>
              <input type="text" value={projectClient} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProjectClient(e?.target?.value ?? '')} className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none" placeholder="Client name" />
            </div>
          </div>
          <button onClick={handleCreateProject} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition shadow">
            Create Project
          </button>
        </div>
      )}

      {/* Line items */}
      <div className="bg-card rounded-xl p-4 shadow space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Line Items</h3>
          <div className="flex gap-2">
            <button onClick={addLineItem} className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1.5 rounded-lg text-sm hover:bg-accent transition">
              <Plus className="w-4 h-4" /> Add Row
            </button>
            <button onClick={handleSaveItems} className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm hover:opacity-90 transition shadow">
              <Save className="w-4 h-4" /> Save All
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-2 px-1">Species</th>
                <th className="py-2 px-1">Grade</th>
                <th className="py-2 px-1">Thick</th>
                <th className="py-2 px-1">Width</th>
                <th className="py-2 px-1">Length</th>
                <th className="py-2 px-1">Qty</th>
                <th className="py-2 px-1">$/BF</th>
                <th className="py-2 px-1">BF</th>
                <th className="py-2 px-1">Cost</th>
                <th className="py-2 px-1"></th>
              </tr>
            </thead>
            <tbody>
              {(lineItems ?? []).map((li: LineItem, idx: number) => (
                <tr key={li?.tempId ?? idx} className="border-b border-border/50">
                  <td className="py-1 px-1"><input type="text" value={li?.species ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateLineItem(idx, 'species', e?.target?.value ?? '')} onBlur={() => lookupPrice(idx)} className="w-full bg-background border border-input rounded px-2 py-1 text-sm" placeholder="Species" /></td>
                  <td className="py-1 px-1"><input type="text" value={li?.grade ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateLineItem(idx, 'grade', e?.target?.value ?? '')} onBlur={() => lookupPrice(idx)} className="w-20 bg-background border border-input rounded px-2 py-1 text-sm" placeholder="Grade" /></td>
                  <td className="py-1 px-1">
                    <select value={li?.thicknessQuarters ?? 4} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateLineItem(idx, 'thicknessQuarters', parseInt(e?.target?.value ?? '4'))} className="w-16 bg-background border border-input rounded px-1 py-1 text-sm">
                      {THICKNESS_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </td>
                  <td className="py-1 px-1"><input type="number" value={li?.widthInches ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateLineItem(idx, 'widthInches', e?.target?.value ?? '')} className="w-16 bg-background border border-input rounded px-2 py-1 text-sm" placeholder="W" /></td>
                  <td className="py-1 px-1"><input type="number" value={li?.lengthInches ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateLineItem(idx, 'lengthInches', e?.target?.value ?? '')} className="w-16 bg-background border border-input rounded px-2 py-1 text-sm" placeholder="L" /></td>
                  <td className="py-1 px-1"><input type="number" value={li?.quantity ?? '1'} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateLineItem(idx, 'quantity', e?.target?.value ?? '1')} className="w-14 bg-background border border-input rounded px-2 py-1 text-sm" min="1" /></td>
                  <td className="py-1 px-1"><input type="number" value={li?.pricePerBf ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateLineItem(idx, 'pricePerBf', e?.target?.value ?? '')} className="w-20 bg-background border border-input rounded px-2 py-1 text-sm" placeholder="$/BF" step="0.01" /></td>
                  <td className="py-1 px-1 font-medium">{(li?.boardFeet ?? 0)?.toFixed?.(2) ?? '0.00'}</td>
                  <td className="py-1 px-1 font-medium">${(li?.totalCost ?? 0)?.toFixed?.(2) ?? '0.00'}</td>
                  <td className="py-1 px-1"><button onClick={() => removeLineItem(idx)} className="text-destructive hover:opacity-70"><Trash2 className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(lineItems ?? [])?.length === 0 && (
          <div className="text-center text-muted-foreground py-8">No line items. Click "Add Row" to begin.</div>
        )}
      </div>

      {/* Totals */}
      {(lineItems ?? [])?.length > 0 && (
        <div className="bg-card rounded-xl p-6 shadow space-y-4">
          <h3 className="font-semibold">Totals</h3>
          {Object.keys(speciesSubtotals ?? {})?.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-sm text-muted-foreground">Per Species</h4>
              {Object.entries(speciesSubtotals ?? {}).map(([sp, vals]: [string, any]) => (
                <div key={sp} className="flex justify-between text-sm bg-background rounded-lg px-4 py-2">
                  <span className="font-medium">{sp}</span>
                  <span>{(vals?.bf ?? 0)?.toFixed?.(2)} BF &middot; ${(vals?.cost ?? 0)?.toFixed?.(2)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="border-t border-border pt-3 flex justify-between text-lg font-bold">
            <span>Grand Total</span>
            <span>{grandTotalBF?.toFixed?.(2)} BF &middot; ${grandTotalCost?.toFixed?.(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
