// src/pages/ZonesPage.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { BASE_URL } from "../services/api";
import { toast } from "react-toastify";

/* small icon helper */
function Icon({ name, className = "" }) {
  const common = `inline-block align-middle ${className}`;
  switch (name) {
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
    case "edit":
      return (
        <svg className={common} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-3.75L17.81 2.69a2.12 2.12 0 0 1 3 0l.5.5a2.12 2.12 0 0 1 0 3L6.5 20.75H3z" />
        </svg>
      );
    default:
      return null;
  }
}

/* Confirm modal (compact) */
function ConfirmModal({ open, title = "Confirm", message = "Are you sure?", confirmText = "Yes", cancelText = "No", onConfirm = () => {}, onCancel = () => {} }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative z-70 w-full max-w-xs bg-white rounded-lg shadow-lg p-4">
        <div className="mb-2"><h3 className="text-sm font-semibold text-gray-800">{title}</h3></div>
        <div className="text-sm text-gray-600 mb-4">{message}</div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-3 py-1 rounded border text-sm text-gray-700 bg-gray-50 hover:bg-gray-100">{cancelText}</button>
          <button type="button" onClick={onConfirm} className="px-3 py-1 rounded bg-emerald-600 text-white text-sm hover:bg-emerald-700">{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

/* Searchable select that supports disabled options and informs caller when disabled item clicked */
function SearchableSelect({ label, options = [], value, onChange, placeholder = "Search...", disabled = false, onDisabledSelect = () => {} }) {
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
        <button
          type="button"
          onClick={() => !disabled && setOpen(s => !s)}
          disabled={disabled}
          className={`w-full text-left px-3 py-2 border rounded-md shadow-sm bg-white flex items-center justify-between ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          <span className={`truncate ${selected ? "text-gray-900" : "text-gray-500"}`}>
            {selected ? selected.name : placeholder}
          </span>
          <svg className="w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="none"><path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>

        {open && (
          <div className="absolute left-0 right-0 mt-2 z-40 bg-white border rounded-md shadow-lg">
            <div className="p-2">
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Type to search..." className="w-full border rounded px-3 py-2 text-sm" autoFocus />
            </div>

            <div className="max-h-48 overflow-auto">
              {filtered.length === 0 ? (
                <div className="p-3 text-sm text-gray-500">No results</div>
              ) : (
                filtered.map(opt => {
                  const isActive = Number(opt.status) === 1;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        if (!isActive) {
                          // tell parent user clicked inactive city
                          onDisabledSelect(opt);
                          setOpen(false);
                          setQuery("");
                          return;
                        }
                        onChange(String(opt.id));
                        setOpen(false);
                        setQuery("");
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-50 text-sm flex items-center justify-between ${!isActive ? "opacity-70 cursor-not-allowed" : ""}`}
                    >
                      <span className={`${!isActive ? "text-red-600" : ""}`}>{opt.name}</span>
                      {!isActive && <span className="text-xs text-red-600 ml-2">Inactive</span>}
                    </button>
                  );
                })
              )}
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

export default function ZonesPage() {
  const [zones, setZones] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 0, from: 0, to: 0 });
  const [loading, setLoading] = useState(false);

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]); // will contain both active & inactive
  const [availablePincodes, setAvailablePincodes] = useState([]);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    state_id: "",
    city_id: "",
    name: "",
    code: "",
    pincodes_text: "",
    selected_pincode_ids: [],
    status: 1
  });

  const [submitError, setSubmitError] = useState(null);
  const [conflictPincodes, setConflictPincodes] = useState([]);
  const [togglingId, setTogglingId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  // city status confirm (when user clicks inactive city or toggles)
  const [cityActionConfirm, setCityActionConfirm] = useState(null); // { city, newStatus }

  const searchTimerRef = useRef(null);

  // load states
  const fetchStates = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/allstates`, { credentials: "include" });
      const json = await res.json();
      if (res.ok && json.data) setStates(json.data);
    } catch (err) { }
  }, []);

  // fetch cities for a state: fetch ALL cities (active + inactive) so admin can see them,
  // but the searchable select will prevent selection if city is inactive
  const fetchCities = useCallback(async (stateId) => {
    if (!stateId) { setCities([]); return; }
    try {
      const res = await fetch(`${BASE_URL}/cities/state/${stateId}`, { credentials: "include" });
      const json = await res.json();
      if (res.ok && Array.isArray(json.data)) {
        setCities(json.data);
      } else {
        setCities([]);
      }
    } catch (err) { setCities([]); }
  }, []);

  const fetchPincodesForCity = useCallback(async (cityId) => {
    if (!cityId) { setAvailablePincodes([]); return; }
    try {
      const res = await fetch(`${BASE_URL}/cities/${cityId}/pincodes`, { credentials: "include" });
      const json = await res.json();
      if (res.ok && json.data) setAvailablePincodes(json.data);
      else setAvailablePincodes([]);
    } catch (err) { setAvailablePincodes([]); }
  }, []);

  const fetchZones = useCallback(async (opts = {}) => {
    const qPage = opts.page ?? page;
    const qLimit = opts.limit ?? limit;
    const qSearch = typeof opts.search !== "undefined" ? opts.search : search;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: qPage, limit: qLimit, search: qSearch || "" });
      const res = await fetch(`${BASE_URL}/zones?${params.toString()}`, { credentials: "include" });
      const json = await res.json();
      if (res.ok && json.data) {
        setZones(json.data);
        setMeta(json.meta || { total: 0, page: qPage, limit: qLimit, totalPages: 0, from: 0, to: 0 });
        setPage(qPage);
        setLimit(qLimit);
      } else {
        toast.error(json.message || "Failed to load zones");
      }
    } catch (err) {
      toast.error(err.message || "Network error while fetching zones");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchStates();
    fetchZones({ page: 1, limit: 10 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSearchChange(e) {
    const v = e.target.value;
    setSearch(v);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchZones({ page: 1, limit, search: v });
      searchTimerRef.current = null;
    }, 400);
  }

  const onLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10) || 10;
    setLimit(newLimit);
    fetchZones({ page: 1, limit: newLimit, search });
  };

  const goToPage = (p) => {
    if (p < 1 || p > (meta.totalPages || 1)) return;
    fetchZones({ page: p, limit, search });
  };

  // when state selected - load all cities for that state (active + inactive)
  useEffect(() => {
    if (form.state_id) fetchCities(form.state_id);
    else setCities([]);
    setForm(p => ({ ...p, city_id: "", selected_pincode_ids: [], pincodes_text: "" }));
    setAvailablePincodes([]);
    setSubmitError(null);
    setConflictPincodes([]);
  }, [form.state_id, fetchCities]);

  // when city selected, load pincodes
  useEffect(() => {
    if (form.city_id) fetchPincodesForCity(form.city_id);
    else setAvailablePincodes([]);
    setForm(p => ({ ...p, selected_pincode_ids: [], pincodes_text: "" }));
    setSubmitError(null);
    setConflictPincodes([]);
  }, [form.city_id, fetchPincodesForCity]);

  function setFormField(k, v) { setForm(p => ({ ...p, [k]: v })); }

  function toggleSelectPincode(id) {
    setForm(p => {
      const s = new Set(p.selected_pincode_ids || []);
      if (s.has(id)) s.delete(id); else s.add(id);
      return { ...p, selected_pincode_ids: Array.from(s) };
    });
  }

  function openCreate() {
    setEditingId(null);
    setForm({ state_id: "", city_id: "", name: "", code: "", pincodes_text: "", selected_pincode_ids: [], status: 1 });
    setSubmitError(null);
    setConflictPincodes([]);
    setShowModal(true);
  }

  // edit: ensure city is present in cities list (append when it is inactive and not in list)
  async function openEdit(zone) {
    setEditingId(zone.id);
    const cityId = zone.city ? String(zone.city.id || zone.city_id || "") : (zone.city_id ? String(zone.city_id) : "");
    const stateId = zone.city ? String(zone.city.state_id || zone.state_id || "") : (zone.state_id ? String(zone.state_id) : "");
    setForm({ state_id: stateId, city_id: cityId, name: zone.name || "", code: zone.code || "", pincodes_text: "", selected_pincode_ids: [], status: zone.status ?? 1 });
    setSubmitError(null);
    setConflictPincodes([]);

    try {
      if (stateId) await fetchCities(stateId);
      if (cityId) {
        // ensure city present: fetch city detail and append to cities array if missing
        const resCity = await fetch(`${BASE_URL}/cities/${cityId}`, { credentials: "include" });
        const jsonCity = await resCity.json();
        if (resCity.ok && jsonCity.data) {
          const cityObj = jsonCity.data;
          if (!cities.find(c => String(c.id) === String(cityObj.id))) setCities(prev => [...prev, cityObj]);
          await fetchPincodesForCity(cityId);
        }
      }
    } catch (_) { /* ignore */ }

    setShowModal(true);
  }

  async function doSave(e) {
    e.preventDefault();
    setSubmitError(null);
    setConflictPincodes([]);
    if (!form.city_id || !form.name.trim()) {
      toast.error("City and zone name are required");
      return;
    }

    let combined = [];
    try {
      if (form.selected_pincode_ids && form.selected_pincode_ids.length > 0 && availablePincodes.length > 0) {
        const selectedCodes = availablePincodes.filter(p => form.selected_pincode_ids.includes(p.id)).map(p => p.pincode);
        combined = combined.concat(selectedCodes);
      }
      if (form.pincodes_text && form.pincodes_text.trim()) {
        const fromText = String(form.pincodes_text).split(/[\s,;|]+/).map(s => s.trim()).filter(Boolean);
        combined = combined.concat(fromText);
      }
      combined = Array.from(new Set(combined.map(s => String(s).trim()).filter(s => /^\d{6}$/.test(s))));
      if (combined.length === 0) {
        toast.error("At least one valid 6-digit pincode required");
        return;
      }
    } catch (err) {
      toast.error("Invalid pincodes input");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        city_id: parseInt(form.city_id, 10),
        name: form.name.trim(),
        code: form.code ? form.code.trim() : undefined,
        pincodes: combined,
        status: form.status
      };

      let res, json;
      if (editingId) {
        res = await fetch(`${BASE_URL}/zones/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload)
        });
        json = await res.json();
      } else {
        res = await fetch(`${BASE_URL}/zones`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload)
        });
        json = await res.json();
      }

      const appError = (typeof json.status !== "undefined" && (json.status === 0 || json.status === "0"));
      if (!res.ok || appError) {
        const conflicts = json.conflicts || json.conflict || [];
        let msg = json.message || (res.status === 409 ? "Some pincodes already assigned" : "Save failed");
        if (Array.isArray(conflicts) && conflicts.length > 0) {
          const list = conflicts.map(c => `${c.pincode}${c.zone_name ? ` (in ${c.zone_name})` : ""}`).join(", ");
          msg += ": " + list;
          setConflictPincodes(conflicts.map(c => String(c.pincode)));
        }
        toast.error(msg);
        setSubmitError(msg);
        return;
      }

      toast.success(editingId ? "Zone updated" : "Zone created");
      setShowModal(false);
      setEditingId(null);
      setForm({ state_id: form.state_id, city_id: "", name: "", code: "", pincodes_text: "", selected_pincode_ids: [], status: 1 });
      fetchZones({ page: 1, limit, search: "" });
    } catch (err) {
      toast.error(err.message || "Network error while saving");
      setSubmitError(err.message || "Network error while saving");
    } finally {
      setSaving(false);
    }
  }

  // toggle zone status (backend route expected: /zones/:id/status)
  async function doToggleStatus(zone) {
    const newStatus = zone.status === 1 ? 0 : 1;
    setTogglingId(zone.id);
    const oldZones = [...zones];
    setZones(prev => prev.map(z => (z.id === zone.id ? { ...z, status: newStatus } : z)));
    try {
      const res = await fetch(`${BASE_URL}/zones/${zone.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      const appError = (typeof json.status !== "undefined" && (json.status === 0 || json.status === "0"));
      if (!res.ok || appError) {
        setZones(oldZones);
        toast.error(json.message || "Failed to update status");
        return;
      }
      toast.success(newStatus === 1 ? "Activated" : "Deactivated");
    } catch (err) {
      setZones(oldZones);
      toast.error(err.message || "Network error updating status");
    } finally {
      setTogglingId(null);
    }
  }

  async function doDeleteZone(zone) {
    try {
      const res = await fetch(`${BASE_URL}/zones/${zone.id}`, { method: "DELETE", credentials: "include" });
      const json = await res.json();
      if (!res.ok || json.status === 0) {
        toast.error(json.message || "Delete failed");
        return;
      }
      toast.success("Zone deleted");
      fetchZones({ page: 1, limit, search: "" });
    } catch (err) {
      toast.error(err.message || "Network error deleting zone");
    }
  }

  // Called when user clicks an inactive city inside searchable list.
  // We open a confirm to toggle that city's status (usually activate).
  function onInactiveCityClicked(city) {
    const newStatus = Number(city.status) === 1 ? 0 : 1;
    setCityActionConfirm({ city, newStatus });
  }

  // Inline toggle for the currently selected city (small button next to select)
  async function toggleSelectedCityStatus() {
    const cityId = form.city_id;
    if (!cityId) {
      toast.info("Select a city first");
      return;
    }
    const cityObj = cities.find(c => String(c.id) === String(cityId));
    if (!cityObj) {
      toast.error("City data not found");
      return;
    }
    const newStatus = Number(cityObj.status) === 1 ? 0 : 1;
    setCityActionConfirm({ city: cityObj, newStatus });
  }

  // Performs the city status change by calling backend update. Assumes PUT /cities/:id accepts { status }
  async function doToggleCityStatus(city, newStatus) {
    try {
      const res = await fetch(`${BASE_URL}/cities/${city.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (!res.ok || json.status === 0) {
        toast.error(json.message || "Failed to update city status");
        return;
      }

      toast.success(newStatus === 1 ? "City activated" : "City deactivated");

      // update cities array in-place
      setCities(prev => prev.map(c => (String(c.id) === String(city.id) ? { ...c, status: newStatus } : c)));

      // if the currently selected city was deactivated, clear selection so it's not used
      if (String(form.city_id) === String(city.id) && Number(newStatus) !== 1) {
        setForm(p => ({ ...p, city_id: "" }));
        setAvailablePincodes([]);
      }

    } catch (err) {
      toast.error(err.message || "Network error while updating city");
    } finally {
      setCityActionConfirm(null);
    }
  }

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

  return (
    <div className="p-6 mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Zones</h1>
          <p className="text-sm text-gray-500 mt-1">Create, edit and manage delivery zones and their pincodes.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Show</label>
            <select value={limit} onChange={onLimitChange} className="border rounded px-2 py-1 text-sm">
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div>
            <input value={search} onChange={onSearchChange} placeholder="Search zones..." className="border rounded px-3 py-2 w-64" />
          </div>

          <button onClick={openCreate} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded shadow">
            <Icon name="plus" /> Add Zone
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Zone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">City</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Pincodes</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>

            <tbody className="bg-white">
              {loading ? (
                <tr><td colSpan="8" className="px-4 py-8 text-center text-gray-500"><Icon name="spinner" /> <span className="ml-2">Loading…</span></td></tr>
              ) : zones.length === 0 ? (
                <tr><td colSpan="8" className="px-4 py-8 text-center text-gray-500">No zones found</td></tr>
              ) : (
                zones.map((z, idx) => (
                  <tr key={z.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">{(meta.from || 0) + idx}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{z.name}</td>
                    <td className="px-4 py-3 text-gray-700">{(z.city && z.city.name) || "-"}</td>
                    <td className="px-4 py-3 text-gray-700">{z.code || "-"}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {Array.isArray(z.pincodes) && z.pincodes.length > 0 ? <span className="text-xs text-gray-600">{z.pincodes.map(p => p.pincode || p).slice(0,6).join(", ")}{z.pincodes.length > 6 ? "…" : ""}</span> : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {z.status === 1 ? <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Active</span> :
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Inactive</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{z.created_at ? new Date(z.created_at).toLocaleString() : "-"}</td>
                    <td className="px-4 py-3">
                      <div className="inline-flex items-center gap-2">
                        <button onClick={() => openEdit(z)} title="Edit" className="px-2 py-1 border rounded text-sm bg-white hover:bg-gray-50"><Icon name="edit" /></button>
                        <button
                          onClick={() => setConfirmAction({ type: "status", zone: z })}
                          disabled={togglingId === z.id}
                          className={`px-3 py-1 rounded text-xs font-medium ${z.status === 1 ? "bg-red-50 text-red-700 border" : "bg-emerald-50 text-emerald-700 border"}`}
                        >
                          {togglingId === z.id ? <><Icon name="spinner" /> <span className="ml-2">...</span></> : (z.status === 1 ? "Deactivate" : "Activate")}
                        </button>
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
            <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-2 py-1 border rounded disabled:opacity-50">‹</button>
            {getPageNumbers().map(p => (<button key={p} onClick={() => goToPage(p)} className={`px-3 py-1 border rounded ${p === page ? "bg-emerald-600 text-white" : "bg-white"}`}>{p}</button>))}
            <button onClick={() => goToPage(page + 1)} disabled={page === meta.totalPages || meta.totalPages === 0} className="px-2 py-1 border rounded disabled:opacity-50">›</button>
            <button onClick={() => goToPage(meta.totalPages || 1)} disabled={page === meta.totalPages || meta.totalPages === 0} className="px-2 py-1 border rounded disabled:opacity-50">»</button>
          </div>
        </div>
      </div>

      {/* Add / Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-16">
          <div className="fixed inset-0 bg-black opacity-40" onClick={() => setShowModal(false)} />
          <form onSubmit={doSave} className="relative z-60 bg-white rounded-lg shadow-xl w-full max-w-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">{editingId ? "Edit Zone" : "Add Zone"}</h3>
              <button type="button" onClick={() => { setShowModal(false); setEditingId(null); }} className="text-gray-500">✕</button>
            </div>

            {submitError && (
              <div className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">
                <strong>Error:</strong>
                <div className="mt-1">{submitError}</div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <SearchableSelect label="State" options={states} value={form.state_id} onChange={(v) => setFormField("state_id", v)} placeholder="Select state" />
              </div>

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <SearchableSelect
                    label="City"
                    options={cities}
                    value={form.city_id}
                    onChange={(v) => setFormField("city_id", v)}
                    placeholder="Select city"
                    disabled={!form.state_id}
                    onDisabledSelect={(city) => onInactiveCityClicked(city)}
                  />
                </div>
                {/* inline toggle button for currently selected city */}
                <div className="mb-1">
                  <button type="button" onClick={toggleSelectedCityStatus} className="px-3 py-2 border rounded text-sm bg-white hover:bg-gray-50">
                    Toggle City
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zone Code</label>
                <input value={form.code} onChange={(e) => setFormField("code", e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Z-XX-1" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Zone Name</label>
                <input value={form.name} onChange={(e) => setFormField("name", e.target.value)} className="w-full border rounded px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincodes (paste)</label>
                <input value={form.pincodes_text} onChange={(e) => setFormField("pincodes_text", e.target.value)} className="w-full border rounded px-3 py-2" placeholder="110001, 110002 or newline separated" />
                <div className="text-xs text-gray-400 mt-1">Only 6-digit pincodes processed.</div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Existing pincodes for city</label>
              <div className="max-h-44 overflow-auto border rounded p-2 bg-gray-50">
                {availablePincodes.length === 0 ? (
                  <div className="text-sm text-gray-500">No pincodes loaded for this city.</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {availablePincodes.map(p => {
                      const checked = form.selected_pincode_ids.includes(p.id);
                      const isConflict = conflictPincodes.includes(String(p.pincode));
                      return (
                        <label key={p.id} className={`flex items-center gap-2 text-sm p-2 rounded ${checked ? "bg-emerald-100" : "hover:bg-white"} ${isConflict ? "border border-red-300 bg-red-50" : ""}`}>
                          <input type="checkbox" checked={checked} onChange={() => toggleSelectPincode(p.id)} className="w-4 h-4" />
                          <span className={`${isConflict ? "text-red-700" : ""}`}>{p.pincode}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={Number(form.status) === 1} onChange={(e) => setFormField("status", e.target.checked ? 1 : 0)} className="w-4 h-4" />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button type="button" onClick={() => { setShowModal(false); setEditingId(null); }} className="px-4 py-2 bg-gray-100 rounded">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-emerald-600 text-white rounded">
                  {saving ? <><Icon name="spinner" /> <span className="ml-2">Saving…</span></> : (editingId ? "Update" : "Save")}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction?.type === "delete" ? "Delete zone?" : "Confirm status change"}
        message={confirmAction?.type === "delete" ? `Delete zone "${confirmAction.zone.name}"? This cannot be undone.` : `${confirmAction?.zone?.status === 1 ? "Deactivate" : "Activate"} zone "${confirmAction?.zone?.name}"?`}
        confirmText={confirmAction?.type === "delete" ? "Delete" : (confirmAction?.zone?.status === 1 ? "Deactivate" : "Activate")}
        cancelText="Cancel"
        onConfirm={async () => {
          if (!confirmAction) return;
          const { type, zone } = confirmAction;
          setConfirmAction(null);
          if (type === "status") await doToggleStatus(zone);
          if (type === "delete") await doDeleteZone(zone);
        }}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmModal
        open={!!cityActionConfirm}
        title={cityActionConfirm?.newStatus === 1 ? "Activate city?" : "Deactivate city?"}
        message={cityActionConfirm ? `${cityActionConfirm.newStatus === 1 ? "Activate" : "Deactivate"} city "${cityActionConfirm.city.name}"?` : ""}
        confirmText={cityActionConfirm?.newStatus === 1 ? "Activate" : "Deactivate"}
        cancelText="Cancel"
        onConfirm={async () => {
          if (!cityActionConfirm) return;
          await doToggleCityStatus(cityActionConfirm.city, cityActionConfirm.newStatus);
        }}
        onCancel={() => setCityActionConfirm(null)}
      />
    </div>
  );
}
