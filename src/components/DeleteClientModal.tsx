'use client';

import { useState } from 'react';
import type { Client } from '@/lib/types';

interface DeleteClientModalProps {
  client: Client;
  onClose: () => void;
  onDeleted: () => void;
  showToast: (msg: string) => void;
}

export default function DeleteClientModal({
  client,
  onClose,
  onDeleted,
  showToast,
}: DeleteClientModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setDeleting(true);
    setError('');

    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete client');
      }

      showToast(`Deleted ${client.name} successfully.`);
      onDeleted();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete client');
      setDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => !deleting && onClose()}>
      <div
        className="modal-content animate-in max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
          <h2 className="text-lg font-bold text-red-400 flex items-center gap-2">
            <span>🗑️</span> Delete Client
          </h2>
          <button
            onClick={() => !deleting && onClose()}
            className="btn-icon text-slate-400 hover:text-slate-100"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {error}
          </div>
        )}

        <div className="space-y-3 mb-5 text-sm">
          <p className="text-slate-200">
            Are you sure you want to permanently delete{' '}
            <strong className="text-white font-semibold">{client.name}</strong>?
          </p>
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
            ⚠️ This will remove all associated health metrics, diet plans, follow-ups, and payment records. This action cannot be reversed.
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="btn btn-secondary text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="btn bg-red-600 hover:bg-red-700 text-white font-medium text-xs flex items-center gap-1.5"
          >
            {deleting ? 'Deleting...' : '🗑️ Delete Permanently'}
          </button>
        </div>
      </div>
    </div>
  );
}
