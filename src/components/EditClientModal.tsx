'use client';

import { useState } from 'react';
import type { Client, ClientSource, ClientStatus } from '@/lib/types';

interface EditClientModalProps {
  client: Client;
  onClose: () => void;
  onSaved: () => void;
  showToast: (msg: string) => void;
}

export default function EditClientModal({
  client,
  onClose,
  onSaved,
  showToast,
}: EditClientModalProps) {
  const [form, setForm] = useState({
    name: client.name || '',
    phone: client.phone || '',
    email: client.email || '',
    instagram_handle: client.instagram_handle || '',
    source: (client.source || 'instagram_dm') as ClientSource,
    status: (client.status || 'lead') as ClientStatus,
    custom_rate: String(client.custom_rate || 2500),
    payment_status: (client.payment_status || 'pending') as 'paid' | 'pending',
    notes: client.notes || '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      setError('Name and Phone are required.');
      return;
    }

    setSaving(true);
    setError('');

    const phone = form.phone.startsWith('+91')
      ? form.phone
      : `+91${form.phone.replace(/^0+/, '')}`;

    const instagram_handle =
      form.instagram_handle && !form.instagram_handle.startsWith('@')
        ? `@${form.instagram_handle}`
        : form.instagram_handle;

    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone,
          email: form.email.trim(),
          instagram_handle: instagram_handle.trim(),
          source: form.source,
          status: form.status,
          custom_rate: parseFloat(form.custom_rate) || 2500,
          payment_status: form.payment_status,
          notes: form.notes.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update client');
      }

      showToast(`Updated ${form.name.trim()} successfully! ✓`);
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update client');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content animate-in max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span>✏️</span> Edit Client Details
          </h2>
          <button onClick={onClose} className="btn-icon text-slate-400 hover:text-slate-100">
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Full Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Phone Number *</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
                className="w-full font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="client@mail.com"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Instagram Handle</label>
              <input
                type="text"
                value={form.instagram_handle}
                onChange={(e) => setForm({ ...form, instagram_handle: e.target.value })}
                placeholder="@username"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Lead Source</label>
              <select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value as ClientSource })}
                className="w-full"
              >
                <option value="instagram_dm">📸 Instagram DM</option>
                <option value="whatsapp">💬 WhatsApp</option>
                <option value="referral">🤝 Referral</option>
                <option value="other">📋 Other</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Client Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as ClientStatus })}
                className="w-full"
              >
                <option value="lead">Lead</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Agreed Rate (₹)</label>
              <input
                type="number"
                value={form.custom_rate}
                onChange={(e) => setForm({ ...form, custom_rate: e.target.value })}
                required
                className="w-full font-semibold"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Revenue / Payment Status</label>
              <select
                value={form.payment_status}
                onChange={(e) => setForm({ ...form, payment_status: e.target.value as 'paid' | 'pending' })}
                className="w-full"
              >
                <option value="pending">🟡 Pending Payment</option>
                <option value="paid">🟢 Paid</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Notes &amp; Coaching Context</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Health restrictions, target goals, schedule preferences..."
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary text-xs flex items-center gap-1.5"
            >
              {saving ? 'Saving...' : '💾 Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
