"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Client, ClientSource, ClientStatus } from "@/lib/types";

// ─── Helpers ──────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years}y ago`;
  if (months > 0) return `${months}mo ago`;
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

function SourceIcon({ source }: { source: ClientSource }) {
  switch (source) {
    case "instagram_dm":
      return (
        <span title="Instagram DM" className="text-pink-400 inline-flex items-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
          </svg>
        </span>
      );
    case "whatsapp":
      return (
        <span title="WhatsApp" className="text-green-400 inline-flex items-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </span>
      );
    default:
      return (
        <span title="Source" className="text-slate-400 inline-flex items-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
        </span>
      );
  }
}

// ─── Add Client Modal with DM Auto-fill ───────────────────

function AddClientModal({
  onClose,
  onCreated,
  showToast,
}: {
  onClose: () => void;
  onCreated: () => void;
  showToast: (msg: string) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    instagram_handle: "",
    source: "instagram_dm" as ClientSource,
    custom_rate: "2500",
    payment_status: "pending" as "paid" | "pending",
    notes: "",
    schedule_followup: true,
    followup_date: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
    followup_amount: "2500",
  });

  const [dmPasteOpen, setDmPasteOpen] = useState(false);
  const [dmText, setDmText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function setField(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // Smart Lead / DM Parser
  function handleParseDM() {
    if (!dmText.trim()) return;

    // Extract phone
    const phoneMatch = dmText.match(/(\+91[\s-]?)?[6-9]\d{9}/);
    const phone = phoneMatch ? phoneMatch[0].replace(/\s|-/g, "") : "";

    // Extract email
    const emailMatch = dmText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const email = emailMatch ? emailMatch[0] : "";

    // Extract Instagram handle
    const igMatch = dmText.match(/@[a-zA-Z0-9._]+/);
    const instagram_handle = igMatch ? igMatch[0] : "";

    // Extract name
    let name = "";
    const nameMatch = dmText.match(/(?:name\s*[:\-=]\s*|i['’]?m\s+|my name is\s+)([A-Za-z\s]{2,25})/i);
    if (nameMatch) {
      name = nameMatch[1].trim();
    } else {
      const firstLine = dmText.split("\n")[0]?.trim();
      if (firstLine && firstLine.length < 25 && !firstLine.includes("@") && !firstLine.match(/\d{5}/)) {
        name = firstLine;
      }
    }

    // Extract fee / rate
    const rateMatch = dmText.match(/(?:₹|rs\.?|inr|fee|rate)\s*[:=]?\s*(\d{3,5})/i);
    const rate = rateMatch ? rateMatch[1] : "2500";

    setForm((prev) => ({
      ...prev,
      name: name || prev.name,
      phone: phone || prev.phone,
      email: email || prev.email,
      instagram_handle: instagram_handle || prev.instagram_handle,
      custom_rate: rate,
      followup_amount: rate,
      notes: prev.notes ? `${prev.notes}\n[DM]: ${dmText}` : `[DM]: ${dmText}`,
    }));

    showToast("✨ Auto-filled client info from text!");
    setDmPasteOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      setError("Name and Phone are required.");
      return;
    }
    setSaving(true);
    setError("");

    const phone = form.phone.startsWith("+91") ? form.phone : `+91${form.phone.replace(/^0+/, "")}`;
    const instagram_handle =
      form.instagram_handle && !form.instagram_handle.startsWith("@")
        ? `@${form.instagram_handle}`
        : form.instagram_handle;

    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        phone,
        email: form.email.trim(),
        instagram_handle,
        source: form.source,
        custom_rate: parseFloat(form.custom_rate) || 2500,
        payment_status: form.payment_status,
        notes: form.notes.trim(),
        record_payment: form.payment_status === "paid",
      };

      if (form.schedule_followup && form.followup_date) {
        payload.follow_up_date = form.followup_date;
        payload.follow_up_amount = parseFloat(form.followup_amount) || parseFloat(form.custom_rate) || 2500;
        payload.follow_up_type = form.payment_status === "pending" ? "payment_reminder" : "check_in";
        payload.follow_up_message =
          form.payment_status === "pending"
            ? `Fee payment reminder (₹${form.followup_amount})`
            : "First check-in session";
      }

      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to add client");
      }

      showToast(`Added client ${form.name}! ✓`);
      onCreated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-in max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Add New Client</h2>
          <button onClick={onClose} className="btn-icon text-xl">✕</button>
        </div>

        {/* Quick DM Auto-fill Accordion */}
        <div className="mb-4 bg-[var(--bg-primary)] border border-emerald-500/30 rounded-xl p-3">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setDmPasteOpen(!dmPasteOpen)}
          >
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <span>✨</span> Paste Instagram DM / WhatsApp Text (Auto-fills Form)
            </span>
            <span className="text-xs text-slate-400">{dmPasteOpen ? "▲ Hide" : "▼ Expand"}</span>
          </div>

          {dmPasteOpen && (
            <div className="mt-2 space-y-2 pt-2 border-t border-[var(--border)]">
              <p className="text-xs text-slate-400">
                Copy whatever the client messaged you in Instagram or WhatsApp, paste it here, and tap Auto-fill:
              </p>
              <textarea
                value={dmText}
                onChange={(e) => setDmText(e.target.value)}
                rows={3}
                placeholder="e.g. Hi bro! I'm Vikram, 9876543210, looking for the 2500 diet plan. Weight 80kg..."
                className="w-full text-xs"
              />
              <button
                type="button"
                onClick={handleParseDM}
                className="btn btn-sm btn-primary w-full text-xs"
              >
                ✨ Auto-fill Fields from Message
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Name *</label>
              <input
                type="text"
                placeholder="Client name"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Phone *</label>
              <div className="flex gap-1 items-center">
                <span className="text-[var(--text-muted)] text-xs whitespace-nowrap">+91</span>
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={form.phone.replace(/^\+91/, "")}
                  onChange={(e) => setField("phone", e.target.value.replace(/[^0-9]/g, ""))}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Instagram Handle</label>
              <input
                type="text"
                placeholder="@handle"
                value={form.instagram_handle}
                onChange={(e) => setField("instagram_handle", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Source</label>
              <select
                value={form.source}
                onChange={(e) => setField("source", e.target.value)}
              >
                <option value="instagram_dm">📸 Instagram DM</option>
                <option value="whatsapp">💬 WhatsApp</option>
                <option value="referral">🤝 Referral</option>
                <option value="other">📋 Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">
                Agreed Rate (₹) <span className="text-slate-500">(Base: ₹2,500)</span>
              </label>
              <input
                type="number"
                placeholder="2500"
                value={form.custom_rate}
                onChange={(e) => {
                  setField("custom_rate", e.target.value);
                  if (form.followup_amount === form.custom_rate) {
                    setField("followup_amount", e.target.value);
                  }
                }}
                required
              />
            </div>

            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Revenue / Payment Status</label>
              <select
                value={form.payment_status}
                onChange={(e) => setField("payment_status", e.target.value)}
              >
                <option value="pending">🟡 Payment Pending</option>
                <option value="paid">🟢 Already Paid</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Email (Optional)</label>
            <input
              type="email"
              placeholder="client@email.com"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
            />
          </div>

          {/* Follow-up scheduler */}
          <div className="bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border)] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.schedule_followup}
                  onChange={(e) => setField("schedule_followup", e.target.checked)}
                  className="!w-4 !h-4"
                />
                Schedule Next Follow-up
              </label>
              {form.payment_status === "pending" && (
                <span className="text-xs text-amber-400 font-medium">Payment Follow-up</span>
              )}
            </div>

            {form.schedule_followup && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Follow-up Date</label>
                  <input
                    type="date"
                    value={form.followup_date}
                    onChange={(e) => setField("followup_date", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Follow-up Amount (₹)</label>
                  <input
                    type="number"
                    value={form.followup_amount}
                    onChange={(e) => setField("followup_amount", e.target.value)}
                    placeholder="2500"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Notes</label>
            <textarea
              placeholder="Health background, diet preferences, goals..."
              rows={2}
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary flex-1">
              {saving ? "Adding..." : "Add Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── CSV Import Modal ──────────────────────────────────────

function CsvImportModal({
  onClose,
  onImported,
  showToast,
}: {
  onClose: () => void;
  onImported: () => void;
  showToast: (msg: string) => void;
}) {
  const [csvText, setCsvText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvText(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvText.trim()) {
      setError("Please select a CSV file or paste CSV content.");
      return;
    }
    setUploading(true);
    setError("");

    try {
      const res = await fetch("/api/clients/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Import failed");
      }

      showToast(`Successfully imported ${data.imported} clients! 🎉`);
      onImported();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to import");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-in max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span>📥</span> Import Clients via CSV
          </h2>
          <button onClick={onClose} className="btn-icon text-xl">✕</button>
        </div>

        {/* Template Download Banner */}
        <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-emerald-400">Need the CSV Template?</div>
            <div className="text-[11px] text-slate-400">Download our sample template with all columns ready</div>
          </div>
          <a
            href="/api/clients/import/template"
            download
            className="btn btn-sm btn-primary shrink-0 text-xs inline-flex items-center gap-1"
          >
            Download Template
          </a>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4 text-sm">
          <div>
            <label className="block text-xs text-slate-300 font-medium mb-1">
              Select CSV File from Device
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-emerald-500 file:text-white hover:file:bg-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Or paste CSV content directly:
            </label>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              rows={6}
              placeholder="Name,Phone,Email,Instagram,Source,Status,Rate,PaymentStatus,Notes&#10;Rahul Kumar,+919876543210,rahul@mail.com,@rahul_fit,instagram_dm,active,2500,paid,Diet plan"
              className="w-full text-xs font-mono"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={uploading}
              className="btn btn-primary flex-1"
            >
              {uploading ? "Importing..." : "Start Import"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Clients Content ──────────────────────────────────

function ClientsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [showModal, setShowModal] = useState(searchParams.get("new") === "true");
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore preferred view mode from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("fittrack_clients_view");
    if (saved === "card" || saved === "list") {
      setViewMode(saved);
    }
  }, []);

  const changeViewMode = (mode: "card" | "list") => {
    setViewMode(mode);
    localStorage.setItem("fittrack_clients_view", mode);
  };

  const showToast = (msg: string) => setToast(msg);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const fetchClients = useCallback(async (query?: string, statusFilter?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("search", query);
      if (statusFilter && !["all", "pending", "paid"].includes(statusFilter)) {
        params.set("status", statusFilter);
      }
      const res = await fetch(`/api/clients?${params.toString()}`);
      if (res.ok) {
        let data: Client[] = await res.json();
        if (statusFilter === "pending") {
          data = data.filter((c) => c.payment_status === "pending");
        } else if (statusFilter === "paid") {
          data = data.filter((c) => c.payment_status === "paid");
        }
        setClients(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients(search, activeTab);
  }, [activeTab, fetchClients, search]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchClients(search, activeTab);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, activeTab, fetchClients]);

  useEffect(() => {
    if (searchParams.get("new") === "true") setShowModal(true);
  }, [searchParams]);

  function openModal() {
    setShowModal(true);
    router.replace("/clients?new=true", { scroll: false });
  }

  function closeModal() {
    setShowModal(false);
    router.replace("/clients", { scroll: false });
  }

  function handleCreated() {
    closeModal();
    fetchClients(search, activeTab);
  }

  const markAsPaid = async (clientId: string, clientName: string, rate: number) => {
    try {
      await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          amount: rate || 2500,
          payment_method: "upi",
          service_type: "diet_plan",
        }),
      });
      showToast(`Marked ${clientName} as Paid! ✓`);
      fetchClients(search, activeTab);
    } catch {
      showToast("Failed to record payment");
    }
  };

  const statusTabs = [
    { label: "All Clients", value: "all" },
    { label: "Leads", value: "lead" },
    { label: "Active", value: "active" },
    { label: "🟡 Pending Payment", value: "pending" },
    { label: "🟢 Paid", value: "paid" },
    { label: "Completed", value: "completed" },
    { label: "Inactive", value: "inactive" },
  ];

  return (
    <div className="min-h-screen pb-24 animate-in">
      {/* Header */}
      <div className="pt-2 pb-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <span>👥</span> Clients & Leads
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              Manage client records, custom rates, and follow-ups
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Pattern Switcher */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-1 flex items-center gap-1">
              <button
                onClick={() => changeViewMode("card")}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === "card"
                    ? "bg-[var(--accent)] text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Card View"
              >
                🔲 Cards
              </button>
              <button
                onClick={() => changeViewMode("list")}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === "list"
                    ? "bg-[var(--accent)] text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Compact List View"
              >
                ☰ List
              </button>
            </div>

            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  const url = `${window.location.origin}/onboard`;
                  navigator.clipboard.writeText(url);
                  showToast("Client intake form link copied! 📋 Share on WhatsApp/IG");
                }
              }}
              className="btn btn-secondary btn-sm inline-flex items-center gap-1.5 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
              title="Copy shareable client intake link"
            >
              <span>🔗</span> Share Form
            </button>

            <button
              onClick={() => setShowCsvModal(true)}
              className="btn btn-secondary btn-sm inline-flex items-center gap-1.5"
            >
              <span>📥</span> Import CSV
            </button>

            <button onClick={openModal} className="btn btn-primary btn-sm inline-flex items-center gap-1">
              <span>+</span> Add Client
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search by name, phone, Instagram handle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="!pl-10"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeTab === tab.value
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div>
        {loading ? (
          <div className="text-center py-12 text-[var(--text-muted)]">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <div className="text-xs">Loading clients...</div>
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-16 card">
            <div className="text-5xl mb-3">🏋️</div>
            <h3 className="text-base font-semibold text-slate-100 mb-1">No clients found</h3>
            <p className="text-slate-400 text-xs mb-4">
              {search ? "No clients matched your search" : "Add a client or import a CSV to get started!"}
            </p>
            <div className="flex justify-center gap-2">
              <button onClick={openModal} className="btn btn-primary btn-sm">
                + Add Client
              </button>
              <button onClick={() => setShowCsvModal(true)} className="btn btn-secondary btn-sm">
                📥 Import CSV
              </button>
            </div>
          </div>
        ) : viewMode === "card" ? (
          /* ─── CARD VIEW ─── */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {clients.map((client) => {
              const isPending = client.payment_status === "pending";
              const rate = client.custom_rate || 2500;
              const hasInstagram = Boolean(client.instagram_handle);

              return (
                <div key={client.id} className="card flex flex-col justify-between hover:border-slate-500 transition-colors">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <Link
                          href={`/clients/${client.id}`}
                          className="font-bold text-slate-100 hover:text-emerald-400 transition-colors truncate block text-base"
                        >
                          {client.name}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <SourceIcon source={client.source} />
                          <span>{client.phone}</span>
                        </div>
                      </div>
                      <span className={`badge badge-${client.status} shrink-0`}>
                        {client.status}
                      </span>
                    </div>

                    {client.instagram_handle && (
                      <div className="text-xs text-pink-400 mb-2 truncate">
                        {client.instagram_handle}
                      </div>
                    )}

                    {/* Rate & Payment Status */}
                    <div className="flex items-center justify-between text-xs py-2 px-2.5 rounded-lg bg-[var(--bg-primary)] mb-3">
                      <div>
                        <span className="text-slate-500">Rate: </span>
                        <span className="font-semibold text-slate-200">{formatCurrency(rate)}</span>
                      </div>
                      <div>
                        {isPending ? (
                          <span className="badge bg-amber-500/15 text-amber-400">
                            🟡 Pending
                          </span>
                        ) : (
                          <span className="badge bg-emerald-500/15 text-emerald-400">
                            🟢 Paid
                          </span>
                        )}
                      </div>
                    </div>

                    {client.notes && (
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3 italic">
                        &quot;{client.notes}&quot;
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] text-xs">
                    <span className="text-slate-500">{timeAgo(client.created_at)}</span>

                    <div className="flex items-center gap-1.5">
                      {isPending && (
                        <button
                          onClick={() => markAsPaid(client.id, client.name, rate)}
                          className="btn btn-sm bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-[11px] py-1 px-2"
                          title="Record payment"
                        >
                          ✓ Mark Paid
                        </button>
                      )}

                      {/* WhatsApp Action */}
                      <button
                        onClick={() => {
                          const cleaned = client.phone.replace(/[^0-9]/g, "");
                          window.open(`https://wa.me/${cleaned}`, "_blank");
                        }}
                        className="btn-icon text-green-400 hover:text-green-300 p-1.5"
                        title="Open WhatsApp"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                      </button>

                      {/* Instagram DM Action */}
                      {hasInstagram && (
                        <button
                          onClick={() => {
                            const handle = client.instagram_handle.replace("@", "").trim();
                            window.open(`https://ig.me/m/${handle}`, "_blank");
                          }}
                          className="btn-icon text-pink-400 hover:text-pink-300 p-1.5"
                          title="Open Instagram DM"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ─── COMPACT LIST VIEW ─── */
          <div className="card p-0 overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Contact</th>
                  <th>Source</th>
                  <th>Rate</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => {
                  const isPending = client.payment_status === "pending";
                  const rate = client.custom_rate || 2500;
                  const hasInstagram = Boolean(client.instagram_handle);

                  return (
                    <tr key={client.id} className="hover:bg-[var(--bg-hover)]">
                      <td>
                        <Link
                          href={`/clients/${client.id}`}
                          className="font-semibold text-slate-100 hover:text-emerald-400 block"
                        >
                          {client.name}
                        </Link>
                        {client.instagram_handle && (
                          <span className="text-[11px] text-pink-400 block">
                            {client.instagram_handle}
                          </span>
                        )}
                      </td>
                      <td className="text-slate-300 font-mono text-xs">{client.phone}</td>
                      <td>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <SourceIcon source={client.source} />
                          <span className="capitalize">{client.source.replace("_", " ")}</span>
                        </div>
                      </td>
                      <td className="font-semibold text-slate-200 text-xs">
                        {formatCurrency(rate)}
                      </td>
                      <td>
                        {isPending ? (
                          <span className="badge bg-amber-500/15 text-amber-400 text-xs">
                            🟡 Pending
                          </span>
                        ) : (
                          <span className="badge bg-emerald-500/15 text-emerald-400 text-xs">
                            🟢 Paid
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-${client.status}`}>{client.status}</span>
                      </td>
                      <td className="text-slate-500 text-xs">{timeAgo(client.created_at)}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          {isPending && (
                            <button
                              onClick={() => markAsPaid(client.id, client.name, rate)}
                              className="btn btn-sm bg-emerald-500/15 text-emerald-400 text-xs px-2 py-1"
                              title="Mark Paid"
                            >
                              ✓ Paid
                            </button>
                          )}
                          <button
                            onClick={() => {
                              const cleaned = client.phone.replace(/[^0-9]/g, "");
                              window.open(`https://wa.me/${cleaned}`, "_blank");
                            }}
                            className="btn-icon text-green-400 hover:text-green-300 p-1.5"
                            title="WhatsApp"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                          </button>
                          {hasInstagram && (
                            <button
                              onClick={() => {
                                const handle = client.instagram_handle.replace("@", "").trim();
                                window.open(`https://ig.me/m/${handle}`, "_blank");
                              }}
                              className="btn-icon text-pink-400 hover:text-pink-300 p-1.5"
                              title="Instagram DM"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Floating Add Button for Mobile */}
      <button
        onClick={openModal}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-2xl shadow-lg flex items-center justify-center transition-colors z-40"
      >
        +
      </button>

      {/* Modals */}
      {showModal && (
        <AddClientModal
          onClose={closeModal}
          onCreated={handleCreated}
          showToast={showToast}
        />
      )}

      {showCsvModal && (
        <CsvImportModal
          onClose={() => setShowCsvModal(false)}
          onImported={() => {
            setShowCsvModal(false);
            fetchClients(search, activeTab);
          }}
          showToast={showToast}
        />
      )}

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default function ClientsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ClientsContent />
    </Suspense>
  );
}
