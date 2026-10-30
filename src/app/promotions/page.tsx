'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { Client, ClientStatus } from '@/lib/types';

interface ClientWithTotal extends Client {
  total_paid?: number;
}

const promoTemplates = [
  {
    id: 'gym_opening',
    title: '🏋️‍♂️ Gym Launch & VIP Invite',
    desc: 'Invite past & current clients to Coach Dajish Mohan\'s new gym with exclusive founder rates',
    message: "Hey {name}! 🏋️‍♂️ Big news — Coach Dajish Mohan here! I'm opening my brand new fitness space and gym soon. As someone who's worked with me, I want to personally invite you over for our exclusive VIP opening week with special founder membership rates. DM me on Instagram @dajishmohan or reply here if you'd love to drop by!",
  },
  {
    id: 'diet_batch',
    title: '🥗 New Diet & Transformation Batch',
    desc: 'Promote new diet plan slots (₹2,500 standard fee)',
    message: "Hey {name}! 👋 Coach Dajish Mohan here. I'm taking in 5 new clients for this month's personalized diet transformation batch. Full customized nutrition, weekly WhatsApp check-ins (+91 98955 68068), and health metric tracking. Let me know if you want to jump back in!",
  },
  {
    id: 'reengage',
    title: '🔄 Past Client Re-engagement',
    desc: 'Reach out to clients who stopped after 1 session',
    message: "Hey {name}! Coach Dajish Mohan checking in. Just wanted to see how your fitness and diet journey has been going since our last session! How are your energy and health goals feeling? You can always check my daily tips on Instagram @dajishmohan.",
  },
  {
    id: 'custom',
    title: '✍️ Custom Announcement',
    desc: 'Write your own promotional or event message',
    message: "Hey {name}! Coach Dajish Mohan here with an exciting update regarding my fitness coaching and personal training programs...",
  },
];

export default function PromotionsPage() {
  const [clients, setClients] = useState<ClientWithTotal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<ClientStatus | 'all'>('inactive');
  const [selectedTemplate, setSelectedTemplate] = useState(promoTemplates[0].id);
  const [customMessage, setCustomMessage] = useState(promoTemplates[0].message);
  const [toast, setToast] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch('/api/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch {
      console.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleSelectTemplate = (tmpl: typeof promoTemplates[0]) => {
    setSelectedTemplate(tmpl.id);
    setCustomMessage(tmpl.message);
  };

  const filteredClients = clients.filter((c) => {
    if (selectedFilter === 'all') return true;
    return c.status === selectedFilter;
  });

  const getPersonalizedMessage = (clientName: string) => {
    const firstName = clientName.split(' ')[0] || clientName;
    return customMessage.replace('{name}', firstName);
  };

  const getWhatsAppLink = (phone: string, clientName: string) => {
    const cleaned = phone.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(getPersonalizedMessage(clientName));
    return `https://wa.me/${cleaned}?text=${msg}`;
  };

  const handleLogFollowUp = async (clientId: string, clientName: string) => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const res = await fetch('/api/follow-ups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          follow_up_date: tomorrow.toISOString().split('T')[0],
          follow_up_type: 'promotional',
          message: getPersonalizedMessage(clientName),
        }),
      });
      if (res.ok) {
        setToast(`Follow-up scheduled for ${clientName}! ✓`);
      }
    } catch {
      setToast('Failed to schedule');
    }
  };

  return (
    <div className="space-y-6 animate-in pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <span>📢</span> Promotions & Gym Invites
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Send WhatsApp promotions to past clients and invite them to your future gym
          </p>
        </div>
        <a
          href="/api/clients/export"
          download
          className="btn btn-secondary inline-flex items-center gap-2"
        >
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export Clients (CSV)
        </a>
      </div>

      {/* Template Selector Card */}
      <div className="card space-y-4">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
          1. Select Message Template
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {promoTemplates.map((t) => (
            <div
              key={t.id}
              onClick={() => handleSelectTemplate(t)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedTemplate === t.id
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-[var(--border)] bg-[var(--bg-primary)] hover:border-slate-500'
              }`}
            >
              <div className="font-semibold text-slate-100 text-sm">{t.title}</div>
              <div className="text-xs text-slate-400 mt-1">{t.desc}</div>
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-slate-400 font-medium">
              Message Content (use <code className="text-emerald-400">{'{name}'}</code> for client&apos;s name)
            </label>
            <span className="text-xs text-slate-500">{customMessage.length} characters</span>
          </div>
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            rows={4}
            className="w-full text-sm"
          />
        </div>
      </div>

      {/* Audience Filter */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
            2. Choose Target Audience ({filteredClients.length} clients)
          </h2>
          <div className="flex gap-1 overflow-x-auto">
            {([
              { key: 'inactive', label: 'Past / Dropped Off' },
              { key: 'lead', label: 'Leads' },
              { key: 'active', label: 'Active Clients' },
              { key: 'completed', label: 'Completed' },
              { key: 'all', label: 'All Contacts' },
            ] as const).map((filter) => (
              <button
                key={filter.key}
                onClick={() => setSelectedFilter(filter.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedFilter === filter.key
                    ? 'bg-emerald-500 text-white'
                    : 'bg-[var(--bg-primary)] text-slate-400 hover:text-slate-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Client List */}
        {loading ? (
          <div className="text-center py-8 text-slate-400 text-sm">Loading clients...</div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-slate-300 font-medium">No clients found under this filter</p>
            <p className="text-slate-500 text-xs mt-1">Try switching to &quot;All Contacts&quot;</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredClients.map((client) => {
              const phone = client.phone?.replace(/[^0-9]/g, '');
              const waUrl = getWhatsAppLink(client.phone, client.name);

              return (
                <div
                  key={client.id}
                  className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/clients/${client.id}`}
                        className="font-semibold text-slate-100 hover:text-emerald-400 transition-colors"
                      >
                        {client.name}
                      </Link>
                      <span className={`badge badge-${client.status}`}>{client.status}</span>
                      {client.instagram_handle && (
                        <span className="text-xs text-pink-400">{client.instagram_handle}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Phone: <span className="text-slate-300">{client.phone}</span> · Source: {client.source}
                    </p>
                    <div className="mt-2 p-2 rounded bg-[var(--bg-secondary)] border border-[var(--border)] text-xs text-slate-300 italic">
                      &quot;{getPersonalizedMessage(client.name)}&quot;
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {phone && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-1.5"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        Send WhatsApp
                      </a>
                    )}
                    <button
                      onClick={() => handleLogFollowUp(client.id, client.name)}
                      className="btn btn-sm btn-secondary"
                      title="Add to tomorrow's follow-up list"
                    >
                      + Schedule
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
