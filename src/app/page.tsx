'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { DashboardStats, FollowUpWithClient, Client, FollowUpType } from '@/lib/types';

interface DashboardData {
  stats: DashboardStats;
  today_follow_ups: FollowUpWithClient[];
  recent_leads: Client[];
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const followUpTypeBadge: Record<FollowUpType, { label: string; classes: string }> = {
  check_in: {
    label: 'Check-in',
    classes: 'bg-blue-500/15 text-blue-400',
  },
  diet_review: {
    label: 'Diet Review',
    classes: 'bg-emerald-500/15 text-emerald-400',
  },
  payment_reminder: {
    label: 'Payment',
    classes: 'bg-amber-500/15 text-amber-400',
  },
  promotional: {
    label: 'Promo',
    classes: 'bg-purple-500/15 text-purple-400',
  },
};

const sourceIcon: Record<string, string> = {
  instagram_dm: '📸',
  whatsapp: '💬',
  referral: '🤝',
  other: '📋',
};

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [formCopied, setFormCopied] = useState(false);

  const getFormUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/onboard`;
    }
    return '/onboard';
  };

  const copyFormLink = () => {
    const url = getFormUrl();
    navigator.clipboard.writeText(url);
    setFormCopied(true);
    setToast('Client Intake link copied to clipboard! 📋');
    setTimeout(() => setFormCopied(false), 2500);
  };

  const shareWhatsApp = () => {
    const url = getFormUrl();
    const msg = `Hey! Coach Dajish Mohan here. Please take 2 minutes to fill out this intake form so I can craft your personalized diet plan:\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const shareInstagram = () => {
    const url = getFormUrl();
    const msg = `Hey! Coach Dajish Mohan here. Please fill out this quick fitness & diet assessment form so I can formulate your custom plan: ${url}`;
    navigator.clipboard.writeText(msg);
    setToast('DM invite copied to clipboard! Opening Instagram...');
    setTimeout(() => {
      window.open('https://instagram.com/direct/inbox', '_blank');
    }, 400);
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const requestNotifications = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        setNotificationsEnabled(true);
        new Notification('FitTrack By Dajish Mohan Daily Reminders Active', {
          body: 'You are set up to receive morning follow-up alerts!',
          icon: '/favicon.ico',
        });
        setToast('Daily morning alerts enabled! ✓');
      } else {
        setToast('Notification permission denied');
      }
    }
  };

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
    } catch {
      console.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleFollowUpAction = async (id: string, status: 'done' | 'skipped') => {
    setUpdatingIds((prev) => new Set(prev).add(id));
    try {
      const res = await fetch('/api/follow-ups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error('Update failed');
      setToast(status === 'done' ? 'Marked as done ✓' : 'Skipped');
      // Remove the follow-up from the list
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          today_follow_ups: prev.today_follow_ups.filter((f) => f.id !== id),
          stats: {
            ...prev.stats,
            pending_follow_ups: Math.max(0, prev.stats.pending_follow_ups - 1),
          },
        };
      });
    } catch {
      setToast('Failed to update');
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-slate-400 text-lg mb-2">Failed to load dashboard</p>
          <button onClick={fetchDashboard} className="btn btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { stats, today_follow_ups, recent_leads } = data;

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100 flex items-center gap-2">
            <span>{getGreeting()}, Coach Dajish!</span>
            <span>👋</span>
          </h1>
          <p className="text-slate-400 mt-0.5 text-sm">
            <span className="font-semibold text-emerald-400">FitTrack By Dajish Mohan</span> • {formatDate()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyFormLink}
            className="btn btn-sm btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
          >
            <span>🔗</span>
            <span>{formCopied ? '✓ Link Copied!' : 'Share Client Form'}</span>
          </button>
        </div>
      </div>

      {/* Shareable Client Intake Form Banner */}
      <div className="bg-gradient-to-r from-emerald-500/15 via-[var(--bg-secondary)] to-transparent border border-emerald-500/30 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-lg shadow-emerald-500/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl shrink-0">
              📋
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">
                  Shareable Client Intake Link
                </h3>
                <span className="badge bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                  Self Fill-In
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Send this link to leads on Instagram DMs or WhatsApp. Clients fill in their details &amp; goals themselves, and their profile, metrics &amp; BMI appear here instantly!
              </p>
            </div>
          </div>

          <a
            href="/onboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 shrink-0 self-start sm:self-center"
          >
            <span>Preview Form</span>
            <span>↗</span>
          </a>
        </div>

        {/* Link Box & Quick Share Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
          <div className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-xl px-3.5 py-2 text-xs font-mono text-emerald-300 truncate select-all">
            {typeof window !== 'undefined' ? `${window.location.origin}/onboard` : '/onboard'}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={copyFormLink}
              className="btn btn-sm btn-primary text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <span>{formCopied ? '✓ Copied!' : '📋 Copy Link'}</span>
            </button>

            <button
              onClick={shareWhatsApp}
              className="btn btn-sm text-xs py-2 px-3 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 flex items-center gap-1.5"
            >
              <span>💬 WhatsApp</span>
            </button>

            <button
              onClick={shareInstagram}
              className="btn btn-sm text-xs py-2 px-3 bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 border border-purple-500/30 flex items-center gap-1.5"
            >
              <span>📸 Instagram DM</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6:00 AM Daily Morning Briefing Banner */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl shrink-0">
            ⏰
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              6:00 AM Morning Briefing
              {today_follow_ups.length > 0 ? (
                <span className="badge bg-emerald-500/20 text-emerald-400">
                  {today_follow_ups.length} to follow up today
                </span>
              ) : (
                <span className="badge bg-slate-700 text-slate-300">0 tasks today</span>
              )}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {today_follow_ups.length > 0
                ? `${today_follow_ups.length} client${today_follow_ups.length > 1 ? 's' : ''} waiting for your check-in or diet review.`
                : 'No clients due for follow-up today. Great job keeping everyone on track!'}
            </p>
          </div>
        </div>

        {!notificationsEnabled && (
          <button
            onClick={requestNotifications}
            className="btn btn-sm btn-secondary text-xs shrink-0 self-start sm:self-center"
          >
            🔔 Enable Phone/Browser Alerts
          </button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Total Clients */}
        <div className="card flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">
              Total Clients
            </span>
            <span className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-400 text-sm">
              👥
            </span>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-slate-100">
            {stats.total_clients}
          </p>
          <p className="text-xs text-slate-500">
            {stats.active_clients} active · {stats.leads} leads
          </p>
        </div>

        {/* Active Plans */}
        <div className="card flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">
              Active Clients
            </span>
            <span className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 text-sm">
              🏋️
            </span>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-emerald-400">
            {stats.active_clients}
          </p>
          <p className="text-xs text-slate-500">Currently training</p>
        </div>

        {/* This Month Earnings */}
        <div className="card flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">
              This Month
            </span>
            <span className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 text-sm">
              💰
            </span>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-emerald-400">
            {formatCurrency(stats.this_month_earnings)}
          </p>
          <p className="text-xs text-slate-500">
            Total: {formatCurrency(stats.total_earnings)}
          </p>
        </div>

        {/* Pending Follow-ups */}
        <div className="card flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">
              Follow-ups
            </span>
            <span
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                stats.pending_follow_ups > 0
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'bg-slate-500/15 text-slate-400'
              }`}
            >
              🔔
            </span>
          </div>
          <p
            className={`text-2xl md:text-3xl font-bold ${
              stats.pending_follow_ups > 0 ? 'text-amber-400' : 'text-slate-100'
            }`}
          >
            {stats.pending_follow_ups}
          </p>
          <p className="text-xs text-slate-500">
            {stats.overdue_follow_ups > 0 ? (
              <span className="text-red-400">{stats.overdue_follow_ups} overdue</span>
            ) : (
              'All on track'
            )}
          </p>
        </div>
      </div>

      {/* Today's Follow-ups */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-lg font-semibold text-slate-100">Today&apos;s Follow-ups</h2>
          <span className="badge bg-slate-700 text-slate-300">
            {today_follow_ups.length}
          </span>
          {stats.overdue_follow_ups > 0 && (
            <span className="badge bg-red-500/15 text-red-400">
              {stats.overdue_follow_ups} overdue
            </span>
          )}
        </div>

        {today_follow_ups.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-3xl mb-2">🎉</p>
            <p className="text-slate-300 font-medium">All caught up!</p>
            <p className="text-slate-500 text-sm mt-1">No follow-ups for today</p>
          </div>
        ) : (
          <div className="space-y-3">
            {today_follow_ups.map((followUp) => {
              const typeInfo = followUpTypeBadge[followUp.follow_up_type];
              const isUpdating = updatingIds.has(followUp.id);
              const phone = followUp.client_phone?.replace(/\D/g, '');

              return (
                <div
                  key={followUp.id}
                  className={`card transition-opacity ${isUpdating ? 'opacity-50' : ''}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-100">
                          {followUp.client_name}
                        </span>
                        <span className={`badge ${typeInfo.classes}`}>
                          {typeInfo.label}
                        </span>
                        {followUp.amount && (
                          <span className="badge bg-amber-500/15 text-amber-400 font-semibold">
                            ₹{followUp.amount}
                          </span>
                        )}
                      </div>
                      {followUp.message && (
                        <p className="text-slate-400 text-sm mt-1 truncate">
                          {followUp.message}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {phone && (
                        <a
                          href={`https://wa.me/${phone}?text=${encodeURIComponent(followUp.message || 'Hey! Checking in on your diet plan.')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-icon text-emerald-400 hover:text-emerald-300"
                          title="WhatsApp (Pre-fills message)"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                        </a>
                      )}
                      {followUp.client_instagram && (
                        <button
                          onClick={() => {
                            const handle = followUp.client_instagram.replace('@', '').trim();
                            if (followUp.message) {
                              navigator.clipboard.writeText(followUp.message);
                              setToast('Copied message! Opening Instagram DM...');
                            }
                            window.open(`https://ig.me/m/${handle}`, '_blank');
                          }}
                          className="btn-icon text-pink-400 hover:text-pink-300"
                          title="Open Instagram DM (Copies text to clipboard)"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleFollowUpAction(followUp.id, 'done')}
                        disabled={isUpdating}
                        className="btn btn-sm bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                      >
                        ✓ Done
                      </button>
                      <button
                        onClick={() => handleFollowUpAction(followUp.id, 'skipped')}
                        disabled={isUpdating}
                        className="btn btn-sm bg-slate-600/50 text-slate-300 hover:bg-slate-600"
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent Leads */}
      <section>
        <h2 className="text-lg font-semibold text-slate-100 mb-3">Recent Leads</h2>

        {recent_leads.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-slate-400 text-sm">No leads yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recent_leads.map((lead) => (
              <div
                key={lead.id}
                onClick={() => router.push(`/clients/${lead.id}`)}
                className="card cursor-pointer hover:border-emerald-500/30 transition-colors py-3 px-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-lg" title={lead.source}>
                      {sourceIcon[lead.source] || '📋'}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-100 truncate">{lead.name}</p>
                      <p className="text-xs text-slate-500">{lead.phone}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="badge badge-lead">Lead</span>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(lead.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={() => router.push('/clients')}
              className="w-full text-center text-sm text-emerald-400 hover:text-emerald-300 py-2 transition-colors"
            >
              View All Clients →
            </button>
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <div className="flex gap-3 pb-4">
        <button
          onClick={() => router.push('/clients?new=true')}
          className="btn btn-primary flex-1"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Client
        </button>
        <button
          onClick={() => router.push('/earnings?new=true')}
          className="btn btn-secondary flex-1"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
            />
          </svg>
          Log Payment
        </button>
      </div>

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
