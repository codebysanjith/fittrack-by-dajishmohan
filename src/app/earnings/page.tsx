'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Client } from '@/lib/types';

interface EarningsSummary {
  total: number;
  this_month: number;
  last_month: number;
  pending_total?: number;
  pending_count?: number;
  pending_clients?: Array<{
    id: string;
    name: string;
    phone: string;
    instagram_handle: string;
    custom_rate: number;
    created_at: string;
  }>;
  by_service: { service_type: string; total: number }[];
  by_month: { month: string; total: number }[];
  recent_payments: {
    id: string; client_id: string; amount: number; payment_date: string;
    payment_method: string; service_type: string; notes: string; client_name: string;
  }[];
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const formatMonth = (m: string) => {
  const [year, month] = m.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
};

const methodIcons: Record<string, string> = { cash: '💵', upi: '📱', bank_transfer: '🏦' };
const serviceLabels: Record<string, string> = { diet_plan: 'Diet Plan', personal_training: 'Personal Training', consultation: 'Consultation' };
const serviceColors: Record<string, string> = { diet_plan: 'bg-emerald-500', personal_training: 'bg-blue-500', consultation: 'bg-purple-500' };

function EarningsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<EarningsSummary | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(searchParams.get('new') === 'true');
  const [toast, setToast] = useState<string | null>(null);

  const [form, setForm] = useState({
    client_id: '', amount: '2500', payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'upi', service_type: 'diet_plan', notes: '',
  });

  const fetchData = useCallback(async () => {
    try {
      const [summaryRes, clientsRes] = await Promise.all([
        fetch('/api/payments?summary=true'),
        fetch('/api/clients'),
      ]);
      setData(await summaryRes.json());
      setClients(await clientsRes.json());
    } catch {
      console.error('Failed to load earnings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 2500); return () => clearTimeout(t); } }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_id) return;
    await fetch('/api/payments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    });
    setForm({ client_id: '', amount: '2500', payment_date: new Date().toISOString().split('T')[0], payment_method: 'upi', service_type: 'diet_plan', notes: '' });
    setShowForm(false);
    setToast('Payment logged! ✓');
    fetchData();
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="text-center py-20">
      <p className="text-slate-400">Failed to load earnings</p>
      <button onClick={fetchData} className="btn btn-primary mt-4">Retry</button>
    </div>
  );

  const maxMonthly = Math.max(...data.by_month.map(m => m.total), 1);
  const monthComparison = data.last_month > 0
    ? Math.round(((data.this_month - data.last_month) / data.last_month) * 100)
    : data.this_month > 0 ? 100 : 0;

  return (
    <div className="space-y-6 animate-in pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Earnings</h1>
          <p className="text-slate-400 text-sm mt-1">Track your revenue</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Cancel' : '+ Log Payment'}
        </button>
      </div>

      {/* Add Payment Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-3 animate-in">
          <h3 className="font-semibold text-slate-200">Log New Payment</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-400 block mb-1">Client*</label>
              <select
                value={form.client_id}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const found = clients.find((c) => c.id === selectedId);
                  setForm({
                    ...form,
                    client_id: selectedId,
                    amount: found?.custom_rate ? String(found.custom_rate) : form.amount,
                  });
                }}
                required
              >
                <option value="">Select client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.custom_rate ? `(Rate: ₹${c.custom_rate})` : ''} {c.payment_status === 'pending' ? '🟡 Pending' : '🟢 Paid'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Amount (₹)*</label>
              <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Date</label>
              <input type="date" value={form.payment_date} onChange={e => setForm({ ...form, payment_date: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Method</label>
              <select value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}>
                <option value="upi">UPI</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Service Type</label>
              <select value={form.service_type} onChange={e => setForm({ ...form, service_type: e.target.value })}>
                <option value="diet_plan">Diet Plan</option>
                <option value="personal_training">Personal Training</option>
                <option value="consultation">Consultation</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Notes</label>
            <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes..." />
          </div>
          <button type="submit" className="btn btn-primary">Log Payment</button>
        </form>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card">
          <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">Total Collected</span>
          <p className="text-2xl md:text-3xl font-bold text-emerald-400 mt-1">{formatCurrency(data.total)}</p>
          <p className="text-xs text-slate-500 mt-1">Paid all time</p>
        </div>
        <div className="card">
          <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">🟡 Pending Fee</span>
          <p className="text-2xl md:text-3xl font-bold text-amber-400 mt-1">{formatCurrency(data.pending_total || 0)}</p>
          <p className="text-xs text-slate-500 mt-1">{data.pending_count || 0} clients pending</p>
        </div>
        <div className="card">
          <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">This Month</span>
          <p className="text-2xl md:text-3xl font-bold text-slate-100 mt-1">{formatCurrency(data.this_month)}</p>
          {monthComparison !== 0 && (
            <p className={`text-xs mt-1 ${monthComparison > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {monthComparison > 0 ? '↑' : '↓'} {Math.abs(monthComparison)}% vs last mo
            </p>
          )}
        </div>
        <div className="card">
          <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">Last Month</span>
          <p className="text-2xl md:text-3xl font-bold text-slate-100 mt-1">{formatCurrency(data.last_month)}</p>
        </div>
      </div>

      {/* Pending Receivables List if any */}
      {data.pending_clients && data.pending_clients.length > 0 && (
        <div className="card border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-amber-400 flex items-center gap-2 text-sm">
              <span>⚠️</span> Pending Client Payments ({data.pending_clients.length})
            </h3>
            <span className="text-xs text-slate-400">Total: {formatCurrency(data.pending_total || 0)}</span>
          </div>

          <div className="space-y-2">
            {data.pending_clients.map((pc) => {
              const phone = pc.phone.replace(/[^0-9]/g, '');
              const waText = encodeURIComponent(
                `Hey ${pc.name.split(' ')[0]}! Hope you're doing well. Just a friendly reminder regarding the ₹${pc.custom_rate || 2500} diet plan fee.`
              );

              return (
                <div
                  key={pc.id}
                  className="bg-[var(--bg-primary)] p-3 rounded-lg border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="font-semibold text-slate-100 hover:text-emerald-400 cursor-pointer"
                        onClick={() => router.push(`/clients/${pc.id}`)}
                      >
                        {pc.name}
                      </span>
                      <span className="badge bg-amber-500/20 text-amber-400 font-bold">
                        ₹{pc.custom_rate || 2500} due
                      </span>
                      {pc.instagram_handle && (
                        <span className="text-xs text-pink-400">{pc.instagram_handle}</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{pc.phone}</div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <a
                      href={`https://wa.me/${phone}?text=${waText}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 text-xs py-1"
                    >
                      📱 Send WA Reminder
                    </a>
                    {pc.instagram_handle && (
                      <button
                        onClick={() => {
                          const handle = pc.instagram_handle.replace('@', '').trim();
                          navigator.clipboard.writeText(`Hey ${pc.name.split(' ')[0]}! Friendly reminder regarding your diet plan fee.`);
                          setToast('Copied reminder! Opening Instagram DM...');
                          window.open(`https://ig.me/m/${handle}`, '_blank');
                        }}
                        className="btn btn-sm bg-pink-500/15 text-pink-400 hover:bg-pink-500/25 text-xs py-1"
                      >
                        📸 IG DM
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        await fetch('/api/payments', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            client_id: pc.id,
                            amount: pc.custom_rate || 2500,
                            payment_method: 'upi',
                            service_type: 'diet_plan',
                          }),
                        });
                        setToast(`Recorded payment for ${pc.name}! ✓`);
                        fetchData();
                      }}
                      className="btn btn-sm btn-primary text-xs py-1"
                    >
                      ✓ Mark Paid
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Revenue by Month Chart */}
      {data.by_month.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-slate-200 mb-4">Monthly Revenue</h3>
          <div className="space-y-3">
            {data.by_month.slice().reverse().map(m => (
              <div key={m.month} className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-16 text-right shrink-0">{formatMonth(m.month)}</span>
                <div className="flex-1 bg-[var(--bg-primary)] rounded-full h-7 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500/70 rounded-full flex items-center px-3 transition-all duration-500"
                    style={{ width: `${Math.max((m.total / maxMonthly) * 100, 8)}%` }}
                  >
                    <span className="text-xs text-white font-medium whitespace-nowrap">{formatCurrency(m.total)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revenue by Service */}
      {data.by_service.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-slate-200 mb-4">By Service</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {data.by_service.map(s => (
              <div key={s.service_type} className="bg-[var(--bg-primary)] rounded-lg p-4 flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${serviceColors[s.service_type] || 'bg-slate-500'}`} />
                <div>
                  <p className="text-sm font-medium text-slate-200">{serviceLabels[s.service_type] || s.service_type}</p>
                  <p className="text-lg font-bold text-emerald-400">{formatCurrency(s.total)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Payments */}
      <div className="card">
        <h3 className="font-semibold text-slate-200 mb-4">Recent Payments</h3>
        {data.recent_payments.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">No payments recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Client</th>
                  <th>Amount</th>
                  <th className="hidden sm:table-cell">Method</th>
                  <th className="hidden sm:table-cell">Service</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_payments.map(p => (
                  <tr key={p.id} className="cursor-pointer" onClick={() => router.push(`/clients/${p.client_id}`)}>
                    <td className="text-slate-400 text-sm">{formatDate(p.payment_date)}</td>
                    <td className="text-slate-200 font-medium">{p.client_name}</td>
                    <td className="text-emerald-400 font-semibold">{formatCurrency(p.amount)}</td>
                    <td className="hidden sm:table-cell text-slate-400">
                      {methodIcons[p.payment_method]} {p.payment_method === 'upi' ? 'UPI' : p.payment_method === 'cash' ? 'Cash' : 'Bank'}
                    </td>
                    <td className="hidden sm:table-cell text-slate-400 text-sm">{serviceLabels[p.service_type]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default function EarningsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <EarningsContent />
    </Suspense>
  );
}
