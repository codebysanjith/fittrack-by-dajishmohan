'use client';

import { useState, useEffect, useCallback } from 'react';
import type { InviteToken } from '@/lib/types';

interface SingleUseInviteModalProps {
  onClose: () => void;
  showToast: (msg: string) => void;
}

export default function SingleUseInviteModal({
  onClose,
  showToast,
}: SingleUseInviteModalProps) {
  const [clientName, setClientName] = useState('');
  const [customRate, setCustomRate] = useState('2500');
  const [expiresInDays, setExpiresInDays] = useState('7');
  const [generating, setGenerating] = useState(false);
  const [latestToken, setLatestToken] = useState<InviteToken | null>(null);

  const [invites, setInvites] = useState<InviteToken[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);

  const fetchInvites = useCallback(async () => {
    try {
      const res = await fetch('/api/invites');
      if (res.ok) {
        const data = await res.json();
        setInvites(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingInvites(false);
    }
  }, []);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const getFullUrl = (tokenStr: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/onboard?token=${tokenStr}`;
    }
    return `/onboard?token=${tokenStr}`;
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: clientName.trim(),
          custom_rate: parseFloat(customRate) || 2500,
          expires_in_days: parseInt(expiresInDays) || 7,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate token');
      const newInvite: InviteToken = await res.json();
      setLatestToken(newInvite);
      showToast('🎉 Single-use invite generated! Ready to share.');
      fetchInvites();
    } catch {
      showToast('Error generating invite token');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (tokenStr: string, name?: string) => {
    const url = getFullUrl(tokenStr);
    navigator.clipboard.writeText(url);
    showToast(`Copied single-use link${name ? ` for ${name}` : ''}! 📋`);
  };

  const shareWhatsApp = (tokenObj: InviteToken) => {
    const url = getFullUrl(tokenObj.token);
    const firstName = tokenObj.client_name ? ` ${tokenObj.client_name.split(' ')[0]}` : '';
    const msg = `Hey${firstName}! Coach Dajish Mohan here.\n\nPlease take 2 minutes to fill in your health & diet intake details using this secure, one-time link:\n\n${url}\n\n🔒 Note: This is a personalized, single-use link that automatically expires once you submit!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const shareInstagram = (tokenObj: InviteToken) => {
    const url = getFullUrl(tokenObj.token);
    const firstName = tokenObj.client_name ? ` ${tokenObj.client_name.split(' ')[0]}` : '';
    const msg = `Hey${firstName}! Coach Dajish Mohan here. Please fill in your fitness & diet intake form using this single-use link: ${url} (Expires once submitted).`;
    navigator.clipboard.writeText(msg);
    showToast('DM message copied to clipboard! Opening Instagram...');
    setTimeout(() => {
      window.open('https://instagram.com/direct/inbox', '_blank');
    }, 400);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content animate-in max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg">
              🔒
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Single-Use Client Intake Link
              </h2>
              <p className="text-xs text-slate-400">
                Generate a dynamic, one-time link that expires immediately after submission
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon text-slate-400 hover:text-slate-100">
            ✕
          </button>
        </div>

        {/* Security / Expiry Notice */}
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-slate-300 mb-4 flex items-start gap-2.5">
          <span className="text-base shrink-0">🛡️</span>
          <div>
            <strong className="text-emerald-400 font-semibold">Single-Use Guarantee:</strong>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Once the client fills and submits their details, the link expires in real time. Forwarding to others or reusing the link is prevented.
            </p>
          </div>
        </div>

        {/* Generator Form */}
        <form onSubmit={handleGenerate} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4 mb-5 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Generate New One-Time Link
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Client Name (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Veena MG"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Agreed Rate (₹)</label>
              <input
                type="number"
                value={customRate}
                onChange={(e) => setCustomRate(e.target.value)}
                required
                className="w-full text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Link Expiry</label>
              <select
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
                className="w-full text-xs"
              >
                <option value="3">3 Days</option>
                <option value="7">7 Days (Standard)</option>
                <option value="14">14 Days</option>
                <option value="30">30 Days</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={generating}
            className="btn btn-primary btn-sm w-full py-2 flex items-center justify-center gap-2"
          >
            <span>⚡</span>
            <span>{generating ? 'Generating Single-Use Token...' : 'Generate One-Time Intake Link'}</span>
          </button>
        </form>

        {/* Newly Generated Link Card */}
        {latestToken && (
          <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-xl p-4 mb-5 animate-in space-y-3">
            <div className="flex items-center justify-between">
              <span className="badge bg-emerald-500/25 text-emerald-400 text-xs font-semibold">
                ✨ Ready to Share
              </span>
              <span className="text-[11px] text-slate-400">
                Rate locked: ₹{latestToken.custom_rate}
              </span>
            </div>

            <div className="bg-[var(--bg-primary)] border border-emerald-500/30 rounded-lg p-2.5 font-mono text-xs text-emerald-300 break-all select-all">
              {getFullUrl(latestToken.token)}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => copyToClipboard(latestToken.token, latestToken.client_name)}
                className="btn btn-sm btn-primary flex-1 inline-flex items-center justify-center gap-1.5 text-xs"
              >
                <span>📋</span> Copy Link
              </button>
              <button
                type="button"
                onClick={() => shareWhatsApp(latestToken)}
                className="btn btn-sm bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 flex-1 inline-flex items-center justify-center gap-1.5 text-xs"
              >
                <span>💬</span> WhatsApp
              </button>
              <button
                type="button"
                onClick={() => shareInstagram(latestToken)}
                className="btn btn-sm bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 border border-pink-500/30 flex-1 inline-flex items-center justify-center gap-1.5 text-xs"
              >
                <span>📸</span> Instagram DM
              </button>
            </div>
          </div>
        )}

        {/* History of Generated Links */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Recent Single-Use Links ({invites.length})
            </h3>
            <button
              onClick={fetchInvites}
              className="text-[11px] text-emerald-400 hover:underline"
            >
              Refresh
            </button>
          </div>

          {loadingInvites ? (
            <div className="text-center py-6 text-xs text-slate-400">Loading links...</div>
          ) : invites.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500">
              No single-use links created yet. Generate your first one above!
            </div>
          ) : (
            <div className="border border-[var(--border)] rounded-xl overflow-hidden text-xs divide-y divide-[var(--border)]">
              {invites.map((inv) => {
                const isUsed = inv.status === 'used';
                const isExpired = inv.status === 'expired';
                const isActive = inv.status === 'active';

                return (
                  <div
                    key={inv.id}
                    className="p-3 bg-[var(--bg-secondary)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">
                          {inv.client_name || 'General Invite'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {inv.token}
                        </span>
                        <span className="text-[11px] text-emerald-400 font-medium">
                          ₹{inv.custom_rate}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {isUsed && inv.used_by_client_name ? (
                          <span className="text-emerald-400">
                            Completed by {inv.used_by_client_name} ({inv.used_at ? new Date(inv.used_at).toLocaleDateString() : 'Used'})
                          </span>
                        ) : (
                          <span>Expires: {inv.expires_at ? new Date(inv.expires_at).toLocaleDateString() : '—'}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isActive && (
                        <span className="badge bg-emerald-500/15 text-emerald-400 text-[10px]">
                          🟢 Active (Unused)
                        </span>
                      )}
                      {isUsed && (
                        <span className="badge bg-slate-500/20 text-slate-400 text-[10px]">
                          ✓ Used &amp; Expired
                        </span>
                      )}
                      {isExpired && (
                        <span className="badge bg-red-500/15 text-red-400 text-[10px]">
                          ⏰ Expired
                        </span>
                      )}

                      {isActive && (
                        <>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(inv.token, inv.client_name)}
                            className="btn btn-sm btn-secondary text-[11px] py-1 px-2"
                            title="Copy single-use URL"
                          >
                            📋 Copy
                          </button>
                          <button
                            type="button"
                            onClick={() => shareWhatsApp(inv)}
                            className="btn-icon text-green-400 hover:text-green-300 p-1"
                            title="Share on WhatsApp"
                          >
                            💬
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="mt-5 pt-3 border-t border-[var(--border)] flex justify-end">
          <button type="button" onClick={onClose} className="btn btn-secondary text-xs">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
