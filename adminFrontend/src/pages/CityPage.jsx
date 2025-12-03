// src/pages/CitiesPage.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { BASE_URL } from "../services/api";
import { toast } from "react-toastify";

/* --- Small Icon component --- */
function Icon({ name, className = "" }) {
  const common = `inline-block align-middle ${className}`;
  switch (name) {
    case "pencil":
      return (
        <svg className={common} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-3.75L17.81 2.69a2.12 2.12 0 0 1 3 0l.5.5a2.12 2.12 0 0 1 0 3L6.5 20.75H3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 5.5L18.5 9.5" />
        </svg>
      );
    case "trash":
      return (
        <svg className={common} viewBox="0 0 24 24" width="16" height="16" fill="none">
          <path d="M3 6h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 6V4h8v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case "plus":
      return (
        <svg className={common} viewBox="0 0 24 24" width="16" height="16" fill="none">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case "spinner":
      return (
        <svg className={`animate-spin ${common}`} viewBox="0 0 24 24" width="18" height="18" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
          <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

/* --- Small confirm modal (compact) --- */
function ConfirmModal({ open, title = "Confirm", message = "Are you sure?", confirmText = "Yes", cancelText = "No", onConfirm = () => {}, onCancel = () => {} }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative z-70 w-full max-w-xs bg-white rounded-lg shadow-lg p-4">
        <div className="mb-2">
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        </div>
        <div className="text-sm text-gray-600 mb-4">{message}</div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-3 py-1 rounded border text-sm text-gray-700 bg-gray-50 hover:bg-gray-100">{cancelText}</button>
          <button type="button" onClick={onConfirm} className="px-3 py-1 rounded bg-emerald-600 text-white text-sm hover:bg-emerald-700">{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

/* --- SearchableSelect for states --- */
function SearchableSelect({ label, options = [], value, onChange, placeholder = "Search...", disabled = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const filtered = options.filter(o => String(o.name).toLowerCase().includes(query.toLowerCase()));
  const selected = options.find(o => String(o.id) === String(value));

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <button type="button" disabled={disabled} onClick={() => setOpen(s => !s)} className={`w-full text-left px-3 py-2 border rounded-md shadow-sm bg-white flex items-center justify-between ${disabled ? "opacity-60" : ""}`}>
          <span className={`truncate ${selected ? "text-gray-900" : "text-gray-500"}`}>{selected ? selected.name : placeholder}</span>
          <svg className="w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="none"><path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>

        {open && (
          <div className="absolute left-0 right-0 mt-2 z-40 bg-white border rounded-md shadow-lg">
            <div className="p-2">
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Type to search..." className="w-full border rounded px-3 py-2 text-sm" autoFocus/>
            </div>
            <div className="max-h-48 overflow-auto">
              {filtered.length === 0 ? <div className="p-3 text-sm text-gray-500">No results</div> : filtered.map(opt => (
                <button key={opt.id} onClick={() => { onChange(String(opt.id)); setOpen(false); setQuery(""); }} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm">{opt.name}</button>
              ))}
            </div>
            <div className="flex items-center justify-end p-2 border-t">
              <button type="button" onClick={() => { onChange(""); setOpen(false); setQuery(""); }} className="text-xs text-gray-500 mr-2">Clear</button>
              <button type="button" onClick={() => setOpen(false)} className="text-xs text-gray-500">Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* --- Main CitiesPage --- */
export default function CitiesPage() {
  const [cities, setCities] = useState([]);
  const [states, setStates] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 0, from: 0, to: 0 });
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ state_id: "", name: "", city_code: "", status: 1 });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [confirmAction, setConfirmAction] = useState(null); // { type: 'delete'|'status', city }
  const searchTimerRef = useRef(null);

  const fetchStates = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/allstate`, { credentials: "include" });
      const json = await res.json();
      if (res.ok || json.status === 1) setStates(json.data || json || []);
    } catch (err) {}
  }, []);

  const fetchCities = useCallback(async (opts = {}) => {
    const qPage = opts.page ?? page;
    const qLimit = opts.limit ?? limit;
    const qSearch = typeof opts.search !== "undefined" ? opts.search : search;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: qPage, limit: qLimit, search: qSearch || "" });
      const res = await fetch(`${BASE_URL}/city?${params.toString()}`, { credentials: "include" });
      const json = await res.json();
      if (res.ok || json.status === 1) {
        setCities(json.data || []);
        setMeta(json.meta || { total: 0, page: qPage, limit: qLimit, totalPages: 0, from: 0, to: 0 });
        setPage(qPage);
        setLimit(qLimit);
      } else {
        toast.error(json.message || "Failed to load cities");
      }
    } catch (err) {
      toast.error(err.message || "Network error while fetching cities");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchStates();
    fetchCities({ page: 1, limit: 10 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSearchChange(e) {
    const v = e.target.value;
    setSearch(v);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchCities({ page: 1, limit, search: v });
      searchTimerRef.current = null;
    }, 400);
  }

  const onLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10) || 10;
    setLimit(newLimit);
    fetchCities({ page: 1, limit: newLimit, search });
  };

  const goToPage = (p) => {
    if (p < 1 || p > (meta.totalPages || 1)) return;
    fetchCities({ page: p, limit, search });
  };
  const prev = () => goToPage(page - 1);
  const next = () => goToPage(page + 1);
  const getPageNumbers = () => {
    const total = meta.totalPages || 1;
    const current = page;
    const delta = 2;
    let left = Math.max(1, current - delta);
    let right = Math.min(total, current + delta);
    if (current - left < delta) right = Math.min(total, right + (delta - (current - left)));
    if (right - current < delta) left = Math.max(1, left - (delta - (right - current)));
    const arr = [];
    for (let i = left; i <= right; i++) arr.push(i);
    return arr;
  };

  function setFormField(k, v) { setForm(p => ({ ...p, [k]: v })); }

  function openAdd() {
    setEditingId(null);
    setForm({ state_id: "", name: "", city_code: "", status: 1 });
    setShowModal(true);
  }

  async function openEdit(city) {
    setEditingId(city.id);
    setForm({
      state_id: String(city.state_id || (city.state && city.state.id) || ""),
      name: city.name || "",
      city_code: city.city_code || "",
      status: city.status ?? 1
    });
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.state_id || !form.name.trim()) {
      toast.error("State and city name are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        state_id: parseInt(form.state_id, 10),
        name: form.name.trim(),
        city_code: (form.city_code || "").trim() || null,
        status: form.status
      };
      let res, json;
      if (editingId) {
        res = await fetch(`${BASE_URL}/cities/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload)
        });
        json = await res.json();
      } else {
        res = await fetch(`${BASE_URL}/cities`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload)
        });
        json = await res.json();
      }
      const appError = (typeof json.status !== "undefined" && (json.status === 0 || json.status === "0"));
      if (!res.ok || appError) {
        toast.error(json.message || "Save failed");
        return;
      }
      toast.success(editingId ? "City updated" : "City created");
      setShowModal(false);
      setEditingId(null);
      fetchCities({ page: 1, limit, search: "" });
    } catch (err) {
      toast.error(err.message || "Network error while saving city");
    } finally {
      setSaving(false);
    }
  }

  async function doToggleStatus(city) {
    const newStatus = city.status === 1 ? 0 : 1;
    const old = [...cities];
    setCities(prev => prev.map(c => (c.id === city.id ? { ...c, status: newStatus } : c)));
    try {
      const res = await fetch(`${BASE_URL}/cities/${city.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      const appError = (typeof json.status !== "undefined" && (json.status === 0 || json.status === "0"));
      if (!res.ok || appError) {
        setCities(old);
        toast.error(json.message || "Failed to update status");
        return;
      }
      toast.success(newStatus === 1 ? "Activated" : "Deactivated");
    } catch (err) {
      setCities(old);
      toast.error(err.message || "Network error while updating status");
    }
  }

  async function doDelete(city) {
    try {
      const res = await fetch(`${BASE_URL}/cities/${city.id}`, {
        method: "DELETE",
        credentials: "include"
      });
      const json = await res.json();
      if (!res.ok || json.status === 0) {
        toast.error(json.message || "Delete failed");
        return;
      }
      toast.success("City deleted");
      fetchCities({ page: 1, limit, search: "" });
    } catch (err) {
      toast.error(err.message || "Network error while deleting");
    }
  }

  return (
    <div className="p-6  mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Cities</h1>
          <p className="text-sm text-gray-500 mt-1">Create, edit and manage cities.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Show</label>
            <select value={limit} onChange={onLimitChange} className="border rounded px-2 py-1 text-sm">
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div>
            <input value={search} onChange={onSearchChange} placeholder="Search cities..." className="border rounded px-3 py-2 w-64" />
          </div>

          <button onClick={openAdd} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded shadow">
            <Icon name="plus" /> Add City
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">State</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">City</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {loading ? (
                <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500"><Icon name="spinner" /> <span className="ml-2">Loading…</span></td></tr>
              ) : cities.length === 0 ? (
                <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500">No data available</td></tr>
              ) : (
                cities.map((c, idx) => (
                  <tr key={c.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">{(meta.from || 0) + idx}</td>
                    <td className="px-4 py-3">{(c.state && c.state.name) || c.state_name || "-"}</td>
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3">{c.city_code || "-"}</td>
                    <td className="px-4 py-3">
                      {c.status === 1 ? <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Active</span> : <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Inactive</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.created_at ? new Date(c.created_at).toLocaleString() : "-"}</td>
                    <td className="px-4 py-3">
                      <div className="inline-flex gap-2">
                        <button onClick={() => openEdit(c)} title="Edit" className="px-2 py-1 border rounded text-sm bg-white hover:bg-gray-50"><Icon name="pencil" /></button>
                        <button onClick={() => setConfirmAction({ type: "status", city: c })} title="Toggle status" className={`px-3 py-1 rounded text-xs font-medium ${c.status === 1 ? "bg-red-50 text-red-700 border" : "bg-emerald-50 text-emerald-700 border"}`}>{c.status === 1 ? "Deactivate" : "Activate"}</button>
                        {/* <button onClick={() => setConfirmAction({ type: "delete", city: c })} title="Delete" className="px-2 py-1 border rounded text-sm bg-white hover:bg-gray-50 text-red-600"><Icon name="trash" /></button> */}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <div className="text-sm text-gray-600">Showing {meta.from || 0} to {meta.to || 0} of {meta.total || 0}</div>
          <div className="flex items-center gap-2">
            <button onClick={() => goToPage(1)} disabled={page === 1} className="px-2 py-1 border rounded disabled:opacity-50">«</button>
            <button onClick={() => prev()} disabled={page === 1} className="px-2 py-1 border rounded disabled:opacity-50">‹</button>
            {getPageNumbers().map(p => (<button key={p} onClick={() => goToPage(p)} className={`px-3 py-1 border rounded ${p === page ? "bg-emerald-600 text-white" : "bg-white"}`}>{p}</button>))}
            <button onClick={() => next()} disabled={page === meta.totalPages || meta.totalPages === 0} className="px-2 py-1 border rounded disabled:opacity-50">›</button>
            <button onClick={() => goToPage(meta.totalPages || 1)} disabled={page === meta.totalPages || meta.totalPages === 0} className="px-2 py-1 border rounded disabled:opacity-50">»</button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-16">
          <div className="fixed inset-0 bg-black opacity-40" onClick={() => setShowModal(false)} />
          <form onSubmit={handleSave} className="relative z-60 bg-white rounded-lg shadow-xl w-full max-w-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">{editingId ? "Edit City" : "Add City"}</h3>
              <button type="button" onClick={() => { setShowModal(false); setEditingId(null); }} className="text-gray-500">✕</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <SearchableSelect label="State" options={states} value={form.state_id} onChange={(v) => setFormField("state_id", v)} placeholder="Select state" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City name</label>
                <input value={form.name} onChange={e => setFormField("name", e.target.value)} className="w-full border rounded px-3 py-2" placeholder="e.g. Pune" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code (optional)</label>
                <input value={form.city_code} onChange={e => setFormField("city_code", e.target.value)} className="w-full border rounded px-3 py-2" />
              </div>
            </div>

            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-700">Status</label>
                <select value={form.status} onChange={e => setFormField("status", parseInt(e.target.value, 10))} className="border rounded px-2 py-1 text-sm">
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button type="button" onClick={() => { setShowModal(false); setEditingId(null); }} className="px-4 py-2 bg-gray-100 rounded">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-emerald-600 text-white rounded">{saving ? (<><Icon name="spinner" /></>) : (editingId ? "Update" : "Save")}</button>
              </div>
            </div>
          </form>
        </div>
      )}

      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction?.type === "delete" ? "Delete city?" : "Confirm status change"}
        message={confirmAction?.type === "delete" ? `Delete city "${confirmAction.city.name}"? This cannot be undone.` : `${confirmAction?.city?.status === 1 ? "Deactivate" : "Activate"} city "${confirmAction?.city?.name}"?`}
        confirmText={confirmAction?.type === "delete" ? "Delete" : (confirmAction?.city?.status === 1 ? "Deactivate" : "Activate")}
        cancelText="Cancel"
        onConfirm={async () => {
          if (!confirmAction) return;
          const { type, city } = confirmAction;
          setConfirmAction(null);
          if (type === "status") await doToggleStatus(city);
          if (type === "delete") await doDelete(city);
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
