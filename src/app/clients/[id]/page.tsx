'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ClientDetail, HealthMetric, DietPlan, Payment, FollowUp } from '@/lib/types';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const bmiCategory = (bmi: number) => {
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-400' };
  if (bmi < 25) return { label: 'Normal', color: 'text-emerald-400' };
  if (bmi < 30) return { label: 'Overweight', color: 'text-amber-400' };
  return { label: 'Obese', color: 'text-red-400' };
};

const statusColors: Record<string, string> = {
  lead: 'badge-lead',
  active: 'badge-active',
  completed: 'badge-completed',
  inactive: 'badge-inactive',
};

const sourceLabels: Record<string, string> = {
  instagram_dm: '📸 Instagram',
  whatsapp: '💬 WhatsApp',
  referral: '🤝 Referral',
  other: '📋 Other',
};

type Tab = 'health' | 'diet' | 'payments' | 'followups';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('health');
  const [toast, setToast] = useState<string | null>(null);

  // Modal states
  const [showHealthForm, setShowHealthForm] = useState(false);
  const [showDietForm, setShowDietForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [showEditInfo, setShowEditInfo] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const fetchClient = useCallback(async () => {
    try {
      const res = await fetch(`/api/clients/${id}`);
      if (!res.ok) throw new Error();
      setClient(await res.json());
    } catch {
      console.error('Failed to load client');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchClient(); }, [fetchClient]);

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 2500); return () => clearTimeout(t); }
  }, [toast]);

  const showToast = (msg: string) => setToast(msg);

  const updateStatus = async (status: string) => {
    await fetch(`/api/clients/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setShowStatusMenu(false);
    showToast(`Status updated to ${status}`);
    fetchClient();
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!client) return (
    <div className="text-center py-20">
      <p className="text-slate-400">Client not found</p>
      <button onClick={() => router.push('/clients')} className="btn btn-primary mt-4">← Back to Clients</button>
    </div>
  );

  const phone = client.phone?.replace(/\D/g, '');

  return (
    <div className="space-y-6 animate-in pb-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => router.push('/clients')} className="btn-icon">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-slate-400 text-sm">Clients</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-100">{client.name}</h1>
            <div className="relative">
              <button onClick={() => setShowStatusMenu(!showStatusMenu)} className={`badge ${statusColors[client.status]} cursor-pointer`}>
                {client.status} ▾
              </button>
              {showStatusMenu && (
                <div className="absolute top-full left-0 mt-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg shadow-lg z-10 py-1 min-w-[120px]">
                  {['lead', 'active', 'completed', 'inactive'].map(s => (
                    <button key={s} onClick={() => updateStatus(s)} className="block w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-[var(--bg-hover)] capitalize">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="text-sm text-slate-400">{sourceLabels[client.source]}</span>
          </div>
          <p className="text-slate-500 text-sm mt-1">Client since {formatDate(client.created_at)}</p>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 flex-wrap">
          {phone && (
            <a
              href={`https://wa.me/${phone}?text=${encodeURIComponent(`Hey ${client.name.split(' ')[0]}! Hope your diet and training is going great.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 inline-flex items-center gap-1"
            >
              📱 WhatsApp Chat
            </a>
          )}
          {client.instagram_handle && (
            <button
              onClick={() => {
                const handle = client.instagram_handle.replace('@', '').trim();
                navigator.clipboard.writeText(`Hey ${client.name.split(' ')[0]}! Checking in on your diet plan.`);
                showToast('Copied greeting! Opening Instagram DM...');
                window.open(`https://ig.me/m/${handle}`, '_blank');
              }}
              className="btn btn-sm bg-pink-500/15 text-pink-400 hover:bg-pink-500/25 inline-flex items-center gap-1"
            >
              📸 Instagram DM
            </button>
          )}
          {client.email && (
            <a href={`mailto:${client.email}`} className="btn btn-sm bg-blue-500/15 text-blue-400 hover:bg-blue-500/25">
              📧 Email
            </a>
          )}
        </div>
      </div>

      {/* Contact Info Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-200">Contact & Rate Details</h3>
          <button onClick={() => setShowEditInfo(!showEditInfo)} className="btn btn-sm btn-secondary">
            {showEditInfo ? 'Cancel' : 'Edit Info'}
          </button>
        </div>
        {showEditInfo ? (
          <EditInfoForm client={client} onSave={() => { setShowEditInfo(false); fetchClient(); showToast('Updated!'); }} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div><span className="text-slate-500">Phone:</span> <span className="text-slate-200 ml-2 font-mono">{client.phone}</span></div>
            <div><span className="text-slate-500">Instagram:</span> <span className="text-slate-200 ml-2">{client.instagram_handle || '—'}</span></div>
            <div><span className="text-slate-500">Email:</span> <span className="text-slate-200 ml-2">{client.email || '—'}</span></div>
            <div>
              <span className="text-slate-500">Agreed Rate:</span>
              <span className="text-slate-200 font-semibold ml-2">{formatCurrency(client.custom_rate || 2500)}</span>
            </div>
            <div>
              <span className="text-slate-500">Revenue Status:</span>
              <span className="ml-2">
                {client.payment_status === 'pending' ? (
                  <span className="badge bg-amber-500/15 text-amber-400">🟡 Pending Payment</span>
                ) : (
                  <span className="badge bg-emerald-500/15 text-emerald-400">🟢 Paid</span>
                )}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Total Collected:</span>
              <span className="text-emerald-400 font-semibold ml-2">{formatCurrency(client.total_paid)}</span>
            </div>
            {client.notes && (
              <div className="sm:col-span-2 md:col-span-3">
                <span className="text-slate-500">Notes:</span>
                <span className="text-slate-300 ml-2 italic">&quot;{client.notes}&quot;</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-[var(--border)] pb-0">
        {([
          { key: 'health', label: 'Health', count: client.health_metrics.length },
          { key: 'diet', label: 'Diet Plans', count: client.diet_plans.length },
          { key: 'payments', label: 'Payments', count: client.payments.length },
          { key: 'followups', label: 'Follow-ups', count: client.follow_ups.length },
        ] as { key: Tab; label: string; count: number }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t.key ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label} {t.count > 0 && <span className="ml-1 text-xs text-slate-500">({t.count})</span>}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'health' && <HealthTab metrics={client.health_metrics} clientId={id} show={showHealthForm} setShow={setShowHealthForm} onDone={() => { fetchClient(); showToast('Measurement added!'); }} />}
      {tab === 'diet' && <DietTab plans={client.diet_plans} clientId={id} show={showDietForm} setShow={setShowDietForm} onDone={() => { fetchClient(); showToast('Saved!'); }} />}
      {tab === 'payments' && <PaymentsTab payments={client.payments} totalPaid={client.total_paid} clientId={id} show={showPaymentForm} setShow={setShowPaymentForm} onDone={() => { fetchClient(); showToast('Payment logged!'); }} />}
      {tab === 'followups' && <FollowUpsTab followUps={client.follow_ups} clientId={id} show={showFollowUpForm} setShow={setShowFollowUpForm} onDone={() => { fetchClient(); showToast('Updated!'); }} />}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

// ─── Edit Info Form ─────────────────────────────────────────
function EditInfoForm({ client, onSave }: { client: ClientDetail; onSave: () => void }) {
  const [form, setForm] = useState({
    name: client.name,
    phone: client.phone,
    email: client.email || '',
    instagram_handle: client.instagram_handle || '',
    custom_rate: String(client.custom_rate || 2500),
    payment_status: client.payment_status || 'pending',
    notes: client.notes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/clients/${client.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        custom_rate: parseFloat(form.custom_rate) || 2500,
      }),
    });
    onSave();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <div><label className="text-xs text-slate-400 block mb-1">Name</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
        <div><label className="text-xs text-slate-400 block mb-1">Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required /></div>
        <div><label className="text-xs text-slate-400 block mb-1">Email</label><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
        <div><label className="text-xs text-slate-400 block mb-1">Instagram</label><input value={form.instagram_handle} onChange={e => setForm({ ...form, instagram_handle: e.target.value })} /></div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Agreed Rate (₹)</label>
          <input type="number" value={form.custom_rate} onChange={e => setForm({ ...form, custom_rate: e.target.value })} required />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Revenue / Payment Status</label>
          <select value={form.payment_status} onChange={e => setForm({ ...form, payment_status: e.target.value as 'paid' | 'pending' })}>
            <option value="pending">🟡 Pending Payment</option>
            <option value="paid">🟢 Paid</option>
          </select>
        </div>
      </div>
      <div><label className="text-xs text-slate-400 block mb-1">Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
      <button type="submit" className="btn btn-primary btn-sm">Save Changes</button>
    </form>
  );
}

// ─── Health Tab ─────────────────────────────────────────────
function HealthTab({ metrics, clientId, show, setShow, onDone }: {
  metrics: HealthMetric[]; clientId: string; show: boolean; setShow: (v: boolean) => void; onDone: () => void;
}) {
  const [form, setForm] = useState({ weight_kg: '', height_cm: '', body_fat_pct: '', date: new Date().toISOString().split('T')[0], notes: '' });

  const liveBMI = form.weight_kg && form.height_cm
    ? Math.round((parseFloat(form.weight_kg) / Math.pow(parseFloat(form.height_cm) / 100, 2)) * 10) / 10
    : null;

  const weightChange = metrics.length >= 2
    ? Math.round((metrics[0].weight_kg! - metrics[metrics.length - 1].weight_kg!) * 10) / 10
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/health-metrics', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, ...form, weight_kg: parseFloat(form.weight_kg), height_cm: parseFloat(form.height_cm), body_fat_pct: form.body_fat_pct ? parseFloat(form.body_fat_pct) : null }),
    });
    setForm({ weight_kg: '', height_cm: '', body_fat_pct: '', date: new Date().toISOString().split('T')[0], notes: '' });
    setShow(false);
    onDone();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          {weightChange !== null && (
            <span className={`text-sm font-medium ${weightChange < 0 ? 'text-emerald-400' : weightChange > 0 ? 'text-red-400' : 'text-slate-400'}`}>
              {weightChange < 0 ? `↓ ${Math.abs(weightChange)} kg lost` : weightChange > 0 ? `↑ ${weightChange} kg gained` : 'No change'}
            </span>
          )}
        </div>
        <button onClick={() => setShow(!show)} className="btn btn-sm btn-primary">
          {show ? 'Cancel' : '+ Add Measurement'}
        </button>
      </div>

      {show && (
        <form onSubmit={handleSubmit} className="card space-y-3 animate-in">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Weight (kg)*</label>
              <input type="number" step="0.1" value={form.weight_kg} onChange={e => setForm({ ...form, weight_kg: e.target.value })} required placeholder="72.5" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Height (cm)*</label>
              <input type="number" step="0.1" value={form.height_cm} onChange={e => setForm({ ...form, height_cm: e.target.value })} required placeholder="175" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Body Fat %</label>
              <input type="number" step="0.1" value={form.body_fat_pct} onChange={e => setForm({ ...form, body_fat_pct: e.target.value })} placeholder="20" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Date</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>
          {liveBMI && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400">BMI:</span>
              <span className={`font-semibold ${bmiCategory(liveBMI).color}`}>{liveBMI} — {bmiCategory(liveBMI).label}</span>
            </div>
          )}
          <div><label className="text-xs text-slate-400 block mb-1">Notes</label><input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any observations..." /></div>
          <button type="submit" className="btn btn-primary btn-sm">Save Measurement</button>
        </form>
      )}

      {metrics.length === 0 ? (
        <div className="card text-center py-8"><p className="text-slate-400 text-sm">No measurements yet. Add the first one!</p></div>
      ) : (
        <div className="space-y-2">
          {metrics.map(m => (
            <div key={m.id} className="card py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-400">{formatDate(m.date)}</span>
                  <span className="text-slate-200 font-medium">{m.weight_kg} kg</span>
                  <span className="text-slate-400">{m.height_cm} cm</span>
                  {m.bmi && <span className={`font-medium ${bmiCategory(m.bmi).color}`}>BMI {m.bmi}</span>}
                  {m.body_fat_pct && <span className="text-slate-400">{m.body_fat_pct}% BF</span>}
                </div>
              </div>
              {m.notes && <p className="text-xs text-slate-500 mt-1">{m.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Diet Plans Tab ─────────────────────────────────────────
function DietTab({ plans, clientId, show, setShow, onDone }: {
  plans: DietPlan[]; clientId: string; show: boolean; setShow: (v: boolean) => void; onDone: () => void;
}) {
  const [form, setForm] = useState({ plan_name: '', start_date: new Date().toISOString().split('T')[0], end_date: '', plan_details: '' });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [editDetails, setEditDetails] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/diet-plans', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, ...form, plan_details: form.plan_details }),
    });
    setForm({ plan_name: '', start_date: new Date().toISOString().split('T')[0], end_date: '', plan_details: '' });
    setShow(false);
    onDone();
  };

  const updateStatus = async (planId: string, status: string) => {
    await fetch(`/api/diet-plans/${planId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    onDone();
  };

  const updateDetails = async (planId: string) => {
    await fetch(`/api/diet-plans/${planId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_details: editDetails }),
    });
    setEditingPlan(null);
    onDone();
  };

  const planStatusColors: Record<string, string> = {
    active: 'bg-emerald-500/15 text-emerald-400',
    completed: 'bg-slate-500/15 text-slate-400',
    paused: 'bg-amber-500/15 text-amber-400',
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-2">
        <Link
          href={`/diet-studio?clientId=${clientId}`}
          className="btn btn-sm btn-secondary text-xs flex items-center gap-1.5 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
        >
          <span>🎨</span> Open Diet Studio &amp; Poster Generator
        </Link>
        <button onClick={() => setShow(!show)} className="btn btn-sm btn-primary">{show ? 'Cancel' : '+ Create Plan'}</button>
      </div>

      {show && (
        <form onSubmit={handleSubmit} className="card space-y-3 animate-in">
          <div><label className="text-xs text-slate-400 block mb-1">Plan Name*</label><input value={form.plan_name} onChange={e => setForm({ ...form, plan_name: e.target.value })} required placeholder="e.g. Weight Loss Phase 1" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-slate-400 block mb-1">Start Date</label><input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
            <div><label className="text-xs text-slate-400 block mb-1">End Date</label><input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
          </div>
          <div><label className="text-xs text-slate-400 block mb-1">Plan Details (meals, macros, etc.)</label><textarea value={form.plan_details} onChange={e => setForm({ ...form, plan_details: e.target.value })} rows={4} placeholder="Morning: Oats with banana&#10;Lunch: Grilled chicken + rice&#10;Evening: Protein shake&#10;Dinner: Salad + dal" /></div>
          <button type="submit" className="btn btn-primary btn-sm">Create Plan</button>
        </form>
      )}

      {plans.length === 0 ? (
        <div className="card text-center py-8"><p className="text-slate-400 text-sm">No diet plans yet.</p></div>
      ) : (
        <div className="space-y-3">
          {plans.map(plan => {
            const details = typeof plan.plan_details === 'string' ? plan.plan_details : JSON.stringify(plan.plan_details);
            const isExpanded = expandedId === plan.id;
            let changesLog: { timestamp: string; previous: string; updated: string }[] = [];
            try { changesLog = JSON.parse(plan.changes_log || '[]'); } catch { /* empty */ }

            return (
              <div key={plan.id} className="card">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : plan.id)}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-200">{plan.plan_name}</span>
                      <span className={`badge ${planStatusColors[plan.status]}`}>{plan.status}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatDate(plan.start_date)}{plan.end_date ? ` → ${formatDate(plan.end_date)}` : ''}
                    </p>
                  </div>
                  <svg className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-3">
                    {editingPlan === plan.id ? (
                      <div className="space-y-2">
                        <textarea value={editDetails} onChange={e => setEditDetails(e.target.value)} rows={4} className="text-sm" />
                        <div className="flex gap-2">
                          <button onClick={() => updateDetails(plan.id)} className="btn btn-sm btn-primary">Save Changes</button>
                          <button onClick={() => setEditingPlan(null)} className="btn btn-sm btn-secondary">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-500 uppercase font-medium">Plan Details</span>
                          <button onClick={() => { setEditingPlan(plan.id); setEditDetails(details === '{}' ? '' : details); }} className="btn btn-sm btn-secondary">Edit</button>
                        </div>
                        <pre className="text-sm text-slate-300 whitespace-pre-wrap">{details === '{}' ? 'No details added yet.' : details}</pre>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {plan.status !== 'active' && <button onClick={() => updateStatus(plan.id, 'active')} className="btn btn-sm bg-emerald-500/15 text-emerald-400">Set Active</button>}
                      {plan.status !== 'completed' && <button onClick={() => updateStatus(plan.id, 'completed')} className="btn btn-sm bg-slate-500/15 text-slate-400">Complete</button>}
                      {plan.status !== 'paused' && <button onClick={() => updateStatus(plan.id, 'paused')} className="btn btn-sm bg-amber-500/15 text-amber-400">Pause</button>}
                    </div>

                    {changesLog.length > 0 && (
                      <div>
                        <span className="text-xs text-slate-500 uppercase font-medium">Change History ({changesLog.length})</span>
                        <div className="mt-2 space-y-1">
                          {changesLog.map((ch, i) => (
                            <div key={i} className="text-xs text-slate-500 py-1 border-b border-[var(--border)] last:border-0">
                              <span>{new Date(ch.timestamp).toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Payments Tab ───────────────────────────────────────────
function PaymentsTab({ payments, totalPaid, clientId, show, setShow, onDone }: {
  payments: Payment[]; totalPaid: number; clientId: string; show: boolean; setShow: (v: boolean) => void; onDone: () => void;
}) {
  const [form, setForm] = useState({ amount: '2500', payment_date: new Date().toISOString().split('T')[0], payment_method: 'upi', service_type: 'diet_plan', notes: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/payments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, ...form, amount: parseFloat(form.amount) }),
    });
    setForm({ amount: '2500', payment_date: new Date().toISOString().split('T')[0], payment_method: 'upi', service_type: 'diet_plan', notes: '' });
    setShow(false);
    onDone();
  };

  const methodIcons: Record<string, string> = { cash: '💵', upi: '📱', bank_transfer: '🏦' };
  const serviceLabels: Record<string, string> = { diet_plan: 'Diet Plan', personal_training: 'Personal Training', consultation: 'Consultation' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="card py-3 px-4 inline-flex items-center gap-2">
          <span className="text-slate-400 text-sm">Total Paid:</span>
          <span className="text-emerald-400 font-bold text-lg">{formatCurrency(totalPaid)}</span>
          <span className="text-slate-500 text-xs">from {payments.length} payments</span>
        </div>
        <button onClick={() => setShow(!show)} className="btn btn-sm btn-primary">{show ? 'Cancel' : '+ Log Payment'}</button>
      </div>

      {show && (
        <form onSubmit={handleSubmit} className="card space-y-3 animate-in">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-slate-400 block mb-1">Amount (₹)*</label><input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required /></div>
            <div><label className="text-xs text-slate-400 block mb-1">Date</label><input type="date" value={form.payment_date} onChange={e => setForm({ ...form, payment_date: e.target.value })} /></div>
            <div><label className="text-xs text-slate-400 block mb-1">Method</label>
              <select value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}>
                <option value="upi">UPI</option><option value="cash">Cash</option><option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
            <div><label className="text-xs text-slate-400 block mb-1">Service Type</label>
              <select value={form.service_type} onChange={e => setForm({ ...form, service_type: e.target.value })}>
                <option value="diet_plan">Diet Plan</option><option value="personal_training">Personal Training</option><option value="consultation">Consultation</option>
              </select>
            </div>
          </div>
          <div><label className="text-xs text-slate-400 block mb-1">Notes</label><input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes..." /></div>
          <button type="submit" className="btn btn-primary btn-sm">Log Payment</button>
        </form>
      )}

      {payments.length === 0 ? (
        <div className="card text-center py-8"><p className="text-slate-400 text-sm">No payments yet.</p></div>
      ) : (
        <div className="space-y-2">
          {payments.map(p => (
            <div key={p.id} className="card py-3 px-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">{methodIcons[p.payment_method] || '💰'}</span>
                <div>
                  <p className="text-sm font-medium text-emerald-400">{formatCurrency(p.amount)}</p>
                  <p className="text-xs text-slate-500">{formatDate(p.payment_date)} · {serviceLabels[p.service_type] || p.service_type}</p>
                </div>
              </div>
              {p.notes && <span className="text-xs text-slate-500 max-w-[150px] truncate">{p.notes}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Follow-ups Tab ─────────────────────────────────────────
function FollowUpsTab({ followUps, clientId, show, setShow, onDone }: {
  followUps: FollowUp[]; clientId: string; show: boolean; setShow: (v: boolean) => void; onDone: () => void;
}) {
  const [form, setForm] = useState({
    follow_up_date: '',
    follow_up_type: 'check_in',
    amount: '',
    message: '',
  });
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/follow-ups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        ...form,
        amount: form.amount ? parseFloat(form.amount) : null,
      }),
    });
    setForm({ follow_up_date: '', follow_up_type: 'check_in', amount: '', message: '' });
    setShow(false);
    onDone();
  };

  const handleAction = async (id: string, status: 'done' | 'skipped') => {
    await fetch('/api/follow-ups', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    onDone();
  };

  const typeColors: Record<string, string> = {
    check_in: 'bg-blue-500/15 text-blue-400',
    diet_review: 'bg-emerald-500/15 text-emerald-400',
    payment_reminder: 'bg-amber-500/15 text-amber-400',
    promotional: 'bg-purple-500/15 text-purple-400',
  };
  const typeLabels: Record<string, string> = {
    check_in: 'Check-in',
    diet_review: 'Diet Review',
    payment_reminder: 'Payment Reminder',
    promotional: 'Promo',
  };

  const pending = followUps.filter((f) => f.status === 'pending');
  const completed = followUps.filter((f) => f.status !== 'pending');

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShow(!show)} className="btn btn-sm btn-primary">
          {show ? 'Cancel' : '+ Schedule Follow-up'}
        </button>
      </div>

      {show && (
        <form onSubmit={handleSubmit} className="card space-y-3 animate-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Follow-up Date*</label>
              <input
                type="date"
                value={form.follow_up_date}
                onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Type</label>
              <select
                value={form.follow_up_type}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm({
                    ...form,
                    follow_up_type: val,
                    message:
                      val === 'payment_reminder'
                        ? 'Hi! Friendly reminder about your diet plan fee payment.'
                        : val === 'diet_review'
                        ? 'Hi! Time for our weekly diet plan review and weight check.'
                        : 'Hi! Checking in to see how your diet plan is going!',
                  });
                }}
              >
                <option value="check_in">Check-in</option>
                <option value="diet_review">Diet Review</option>
                <option value="payment_reminder">Payment Reminder</option>
                <option value="promotional">Promotional</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Amount (₹) <span className="text-slate-500">(Optional / Fee)</span>
              </label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="e.g. 2500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Message</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={2}
              placeholder="Message for the follow-up..."
            />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">
            Save Follow-up
          </button>
        </form>
      )}

      {pending.length > 0 && (
        <div>
          <h4 className="text-sm text-slate-400 font-medium mb-2">Pending ({pending.length})</h4>
          <div className="space-y-2">
            {pending.map((f) => {
              const isOverdue = f.follow_up_date < today;
              const isToday = f.follow_up_date === today;
              return (
                <div
                  key={f.id}
                  className={`card py-3 px-4 border-l-4 ${
                    isOverdue
                      ? 'border-l-red-500'
                      : isToday
                      ? 'border-l-emerald-500'
                      : 'border-l-slate-600'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`badge ${typeColors[f.follow_up_type]}`}>
                          {typeLabels[f.follow_up_type]}
                        </span>
                        <span className="text-sm text-slate-400">{formatDate(f.follow_up_date)}</span>
                        {f.amount && (
                          <span className="badge bg-amber-500/15 text-amber-400 font-semibold">
                            ₹{f.amount}
                          </span>
                        )}
                        {isOverdue && <span className="text-xs text-red-400 font-medium">OVERDUE</span>}
                        {isToday && <span className="text-xs text-emerald-400 font-medium">TODAY</span>}
                      </div>
                      {f.message && <p className="text-sm text-slate-300 mt-1">{f.message}</p>}
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleAction(f.id, 'done')}
                        className="btn btn-sm bg-emerald-500/15 text-emerald-400"
                        title="Mark Done"
                      >
                        ✓ Done
                      </button>
                      <button
                        onClick={() => handleAction(f.id, 'skipped')}
                        className="btn btn-sm bg-slate-600/50 text-slate-400"
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <h4 className="text-sm text-slate-400 font-medium mb-2">Completed ({completed.length})</h4>
          <div className="space-y-2">
            {completed.map(f => (
              <div key={f.id} className="card py-3 px-4 opacity-60">
                <div className="flex items-center gap-2">
                  <span className={`badge ${typeColors[f.follow_up_type]}`}>{typeLabels[f.follow_up_type]}</span>
                  <span className="text-sm text-slate-400">{formatDate(f.follow_up_date)}</span>
                  <span className={`text-xs ${f.status === 'done' ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {f.status === 'done' ? '✓ Done' : 'Skipped'}
                  </span>
                </div>
                {f.message && <p className="text-sm text-slate-500 mt-1">{f.message}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {followUps.length === 0 && (
        <div className="card text-center py-8"><p className="text-slate-400 text-sm">No follow-ups scheduled.</p></div>
      )}
    </div>
  );
}
