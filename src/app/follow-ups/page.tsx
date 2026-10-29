'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { FollowUpWithClient, Client } from '@/lib/types';

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const relativeDate = (d: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < -1) return `${Math.abs(diff)} days overdue`;
  if (diff === -1) return 'Yesterday';
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff <= 7) return `In ${diff} days`;
  return formatDate(d);
};

const typeColors: Record<string, string> = {
  check_in: 'bg-blue-500/15 text-blue-400',
  diet_review: 'bg-emerald-500/15 text-emerald-400',
  payment_reminder: 'bg-amber-500/15 text-amber-400',
  promotional: 'bg-purple-500/15 text-purple-400',
};
const typeLabels: Record<string, string> = {
  check_in: 'Check-in', diet_review: 'Diet Review',
  payment_reminder: 'Payment', promotional: 'Promo',
};

const messageTemplates: Record<string, string> = {
  check_in: "Hi! How's your diet plan going? Any updates on your progress?",
  diet_review: "Hi! Time to review your diet plan. Let's schedule a call.",
  payment_reminder: "Just a reminder about your upcoming payment.",
  promotional: "Hey! I have an exciting new program you might be interested in!",
};

type FilterTab = 'today' | 'pending' | 'completed' | 'all';

export default function FollowUpsPage() {
  const router = useRouter();
  const [followUps, setFollowUps] = useState<FollowUpWithClient[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('today');
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  const [form, setForm] = useState({
    client_id: '',
    follow_up_date: '',
    follow_up_type: 'check_in',
    amount: '',
    message: '',
  });

  const fetchData = useCallback(async () => {
    try {
      let url = '/api/follow-ups';
      if (filter === 'today') url += '?date=today';
      else if (filter === 'pending') url += '?status=pending';
      else if (filter === 'completed') url += '?status=done';

      const [fuRes, clientsRes] = await Promise.all([
        fetch(url),
        fetch('/api/clients'),
      ]);
      setFollowUps(await fuRes.json());
      setClients(await clientsRes.json());
    } catch {
      console.error('Failed to load follow-ups');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { setLoading(true); fetchData(); }, [fetchData]);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 2500); return () => clearTimeout(t); } }, [toast]);

  const handleAction = async (id: string, status: 'done' | 'skipped') => {
    setUpdatingIds(prev => new Set(prev).add(id));
    try {
      await fetch('/api/follow-ups', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      setToast(status === 'done' ? 'Marked as done ✓' : 'Skipped');
      setFollowUps(prev => prev.filter(f => f.id !== id));
    } catch {
      setToast('Failed to update');
    } finally {
      setUpdatingIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_id || !form.follow_up_date) return;
    await fetch('/api/follow-ups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        amount: form.amount ? parseFloat(form.amount) : null,
      }),
    });
    setForm({ client_id: '', follow_up_date: '', follow_up_type: 'check_in', amount: '', message: '' });
    setShowForm(false);
    setToast('Follow-up scheduled! ✓');
    fetchData();
  };

  const handleTypeChange = (type: string) => {
    const selectedClient = clients.find(c => c.id === form.client_id);
    const name = selectedClient?.name || '';
    let message = messageTemplates[type] || '';
    if (name) message = message.replace('Hi!', `Hi ${name}!`).replace('Hey!', `Hey ${name}!`).replace('Just a', `Hi ${name}! Just a`);
    setForm({ ...form, follow_up_type: type, message });
  };

  const today = new Date().toISOString().split('T')[0];

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 animate-in pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Follow-ups</h1>
          <p className="text-slate-400 text-sm mt-1">Stay connected with your clients</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Cancel' : '+ Schedule New'}
        </button>
      </div>

      {/* Schedule Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-3 animate-in">
          <h3 className="font-semibold text-slate-200">Schedule Follow-up</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Client*</label>
              <select
                value={form.client_id}
                onChange={(e) => {
                  const selClient = clients.find((c) => c.id === e.target.value);
                  setForm({
                    ...form,
                    client_id: e.target.value,
                    amount: selClient?.custom_rate ? String(selClient.custom_rate) : form.amount,
                  });
                }}
                required
              >
                <option value="">Select client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.custom_rate ? `(₹${c.custom_rate})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Date*</label>
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
                onChange={(e) => handleTypeChange(e.target.value)}
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
              rows={3}
              placeholder="Message for the follow-up..."
            />
          </div>
          <button type="submit" className="btn btn-primary">Schedule Follow-up</button>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-[var(--border)]">
        {([
          { key: 'today' as FilterTab, label: 'Today & Overdue' },
          { key: 'pending' as FilterTab, label: 'All Pending' },
          { key: 'completed' as FilterTab, label: 'Completed' },
          { key: 'all' as FilterTab, label: 'All' },
        ]).map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              filter === t.key ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Follow-up List */}
      {followUps.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-3xl mb-3">🎉</p>
          <p className="text-slate-300 font-medium">
            {filter === 'today' ? 'No pending follow-ups!' : filter === 'completed' ? 'No completed follow-ups yet.' : 'No follow-ups found.'}
          </p>
          <p className="text-slate-500 text-sm mt-1">
            {filter === 'today' ? 'All your clients are taken care of.' : 'Schedule one to get started.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {followUps.map(f => {
            const isOverdue = f.follow_up_date < today && f.status === 'pending';
            const isToday = f.follow_up_date === today;
            const isDone = f.status === 'done' || f.status === 'skipped';
            const isUpdating = updatingIds.has(f.id);
            const phone = f.client_phone?.replace(/\D/g, '');

            return (
              <div
                key={f.id}
                className={`card py-4 px-4 border-l-4 transition-opacity ${
                  isOverdue ? 'border-l-red-500' : isToday ? 'border-l-emerald-500' : isDone ? 'border-l-slate-600 opacity-60' : 'border-l-blue-500'
                } ${isUpdating ? 'opacity-50' : ''}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="font-semibold text-slate-100 cursor-pointer hover:text-emerald-400 transition-colors"
                        onClick={() => router.push(`/clients/${f.client_id}`)}
                      >
                        {f.client_name}
                      </span>
                      <span className={`badge ${typeColors[f.follow_up_type]}`}>
                        {typeLabels[f.follow_up_type]}
                      </span>
                      {f.amount && (
                        <span className="badge bg-amber-500/15 text-amber-400 font-semibold">
                          ₹{f.amount}
                        </span>
                      )}
                      <span className={`text-xs font-medium ${
                        isOverdue ? 'text-red-400' : isToday ? 'text-emerald-400' : 'text-slate-400'
                      }`}>
                        {relativeDate(f.follow_up_date)}
                      </span>
                    </div>
                    {f.message && (
                      <p className="text-sm text-slate-400 mt-1">{f.message}</p>
                    )}
                    {isDone && f.completed_at && (
                      <p className="text-xs text-slate-500 mt-1">
                        {f.status === 'done' ? '✓ Completed' : '⏭ Skipped'} on {formatDate(f.completed_at)}
                      </p>
                    )}
                  </div>

                  {!isDone && (
                    <div className="flex items-center gap-2 shrink-0">
                      {phone && (
                        <a
                          href={`https://wa.me/${phone}?text=${encodeURIComponent(f.message || 'Hey! Following up on your diet plan.')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-icon text-emerald-400 hover:text-emerald-300"
                          title="WhatsApp (Pre-fills message)"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                        </a>
                      )}
                      {f.client_instagram && (
                        <button
                          onClick={() => {
                            const handle = f.client_instagram.replace('@', '').trim();
                            if (f.message) {
                              navigator.clipboard.writeText(f.message);
                              setToast('Copied message! Opening Instagram DM...');
                            }
                            window.open(`https://ig.me/m/${handle}`, '_blank');
                          }}
                          className="btn-icon text-pink-400 hover:text-pink-300"
                          title="Open Instagram DM (Copies text)"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleAction(f.id, 'done')}
                        disabled={isUpdating}
                        className="btn btn-sm bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                      >
                        ✓ Done
                      </button>
                      <button
                        onClick={() => handleAction(f.id, 'skipped')}
                        disabled={isUpdating}
                        className="btn btn-sm bg-slate-600/50 text-slate-300 hover:bg-slate-600"
                      >
                        Skip
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
