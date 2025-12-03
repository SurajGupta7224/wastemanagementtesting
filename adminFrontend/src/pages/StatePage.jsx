// src/pages/StatesPage.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { BASE_URL } from "../services/api";
import { toast } from "react-toastify";

/* Small Icon component (only spinner kept) */
function Icon({ name, className = "" }) {
  const common = `inline-block align-middle ${className}`;
  if (name === "spinner") {
    return (
      <svg className={`animate-spin ${common}`} viewBox="0 0 24 24" width="18" height="18" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
        <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return null;
}

/* Main page (Add/Edit/Delete removed) */
export default function StatesPage() {
  const [states, setStates] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 0, from: 0, to: 0 });
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);

  const searchTimerRef = useRef(null);

  const fetchStates = useCallback(async (opts = {}) => {
    const qPage = opts.page ?? page;
    const qLimit = opts.limit ?? limit;
    const qSearch = typeof opts.search !== "undefined" ? opts.search : search;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: qPage, limit: qLimit, search: qSearch || "" });
      const res = await fetch(`${BASE_URL}/states?${params.toString()}`, { credentials: "include" });
      const json = await res.json();
      if (res.ok || json.status === 1) {
        setStates(json.data || []);
        setMeta(json.meta || { total: 0, page: qPage, limit: qLimit, totalPages: 0, from: 0, to: 0 });
        setPage(qPage);
        setLimit(qLimit);
      } else {
        toast.error(json.message || "Failed to load states");
      }
    } catch (err) {
      toast.error(err.message || "Network error while fetching states");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchStates({ page: 1, limit: 10 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSearchChange(e) {
    const v = e.target.value;
    setSearch(v);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchStates({ page: 1, limit, search: v });
      searchTimerRef.current = null;
    }, 400);
  }

  function onLimitChange(e) {
    const newLimit = parseInt(e.target.value, 10) || 10;
    setLimit(newLimit);
    fetchStates({ page: 1, limit: newLimit, search });
  }

  const goToPage = (p) => {
    if (p < 1 || p > (meta.totalPages || 1)) return;
    fetchStates({ page: p, limit, search });
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

  return (
    <div className="p-6 mx-auto">
      {/* header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">States</h1>
          <p className="text-sm text-gray-500 mt-1">View state list — search</p>
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
            <input value={search} onChange={onSearchChange} placeholder="Search states..." className="border rounded px-3 py-2 w-72" />
          </div>
        </div>
      </div>

      {/* table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Created</th>
              </tr>
            </thead>

            <tbody className="bg-white">
              {loading ? (
                <tr><td colSpan="5" className="px-4 py-8 text-center text-gray-500"><Icon name="spinner" /> <span className="ml-2">Loading…</span></td></tr>
              ) : states.length === 0 ? (
                <tr><td colSpan="5" className="px-4 py-8 text-center text-gray-500">No data available</td></tr>
              ) : (
                states.map((s, idx) => (
                  <tr key={s.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">{(meta.from || 0) + idx}</td>
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3">{s.code || "-"}</td>
                    <td className="px-4 py-3">
                      {s.status === 1 ? <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Active</span> :
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Inactive</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.created_at ? new Date(s.created_at).toLocaleString() : "-"}</td>
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
    </div>
  );
}
