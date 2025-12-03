import React, { useEffect, useState, useCallback } from "react";
import { BASE_URL } from "../services/api";
import { toast } from "react-toastify";

function Icon({ name, className = "" }) {
  const common = `inline-block align-middle ${className}`;
  switch (name) {
    case "spinner":
      return (
        <svg className={`animate-spin ${common}`} viewBox="0 0 24 24" width="18" height="18" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
          <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "save":
      return (
        <svg className={common} viewBox="0 0 24 24" width="18" height="18" fill="none">
          <path d="M5 3v18h14V7.5L16.5 3H5z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 3v6h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

export default function RolePermissionsPage() {
  const [roles, setRoles] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [assigned, setAssigned] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/roles`, { credentials: "include" });
      const json = await res.json();
      if (res.ok || json.status === 1) setRoles(json.data || json || []);
    } catch (err) {
      toast.error("Failed to load roles");
    }
  }, []);

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/permission-groups`, { credentials: "include" });
      const json = await res.json();
      if (res.ok || json.status === 1) setGroups(json.data || json || []);
    } catch (err) {
      toast.error("Failed to load permission groups");
    }
  }, []);

  const fetchAssigned = useCallback(async (roleId) => {
    if (!roleId) {
      setAssigned(new Set());
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/roles/${roleId}/permissions`, { credentials: "include" });
      const json = await res.json();
      if (res.ok || json.status === 1) {
        const arr = Array.isArray(json.permissions) ? json.permissions : (json.data || json.permissions || []);
        setAssigned(new Set((arr || []).map(Number)));
      } else {
        toast.error(json.message || "Failed to load role permissions");
      }
    } catch (err) {
      toast.error(err.message || "Network error while fetching role permissions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
    fetchGroups();
  }, [fetchRoles, fetchGroups]);

  useEffect(() => {
    if (selectedRole) fetchAssigned(selectedRole);
    else setAssigned(new Set());
  }, [selectedRole, fetchAssigned]);

  function togglePermission(permissionId) {
    setAssigned(prev => {
      const s = new Set(prev);
      if (s.has(permissionId)) s.delete(permissionId);
      else s.add(permissionId);
      return s;
    });
  }

  function moduleSelectAll(moduleObj, checked) {
    const pids = (moduleObj.permissions || []).map(p => Number(p.id));
    setAssigned(prev => {
      const s = new Set(prev);
      pids.forEach(pid => {
        if (checked) s.add(pid);
        else s.delete(pid);
      });
      return s;
    });
  }

  function isModuleAllSelected(moduleObj) {
    const pids = (moduleObj.permissions || []).map(p => Number(p.id));
    if (pids.length === 0) return false;
    return pids.every(pid => assigned.has(pid));
  }

  function isModuleSomeSelected(moduleObj) {
    const pids = (moduleObj.permissions || []).map(p => Number(p.id));
    if (pids.length === 0) return false;
    const any = pids.some(pid => assigned.has(pid));
    const all = pids.every(pid => assigned.has(pid));
    return any && !all;
  }

  async function handleSave() {
    if (!selectedRole) {
      toast.error("Please select a role first");
      return;
    }
    setSaving(true);
    try {
      const payload = { permission_ids: Array.from(assigned).map(Number) };
      const res = await fetch(`${BASE_URL}/roles/${selectedRole}/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok || (typeof json.status !== "undefined" && json.status === 0)) {
        toast.error(json.message || "Failed to save permissions");
        return;
      }
      toast.success(json.message || "Permissions saved");
    } catch (err) {
      toast.error(err.message || "Network error while saving");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Role Permissions</h1>
          <p className="text-sm text-gray-500 mt-1">Assign permissions to roles (grouped by module).</p>
        </div>

        <div className="flex items-center gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Role</label>
            <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="border rounded px-3 py-2">
              <option value="">-- select role --</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>

          <div className="flex items-end gap-2 mt-5">
            <button onClick={handleSave} disabled={!selectedRole || saving} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded shadow">
              {saving ? <Icon name="spinner" /> : <Icon name="save" />} <span>{saving ? "Saving..." : "Save"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <div className="text-sm text-gray-600">Select permissions below. Use the "Select all" checkbox per module to quickly choose all permissions.</div>
        </div>

        <div className="p-4 space-y-6 max-h-[60vh] overflow-auto">
          {loading ? (
            <div className="text-center py-8 text-gray-500"><Icon name="spinner" /> <span className="ml-2">Loading…</span></div>
          ) : (
            groups.length === 0 ? (
              <div className="text-gray-600">No permission groups found.</div>
            ) : (
              groups.map(mod => (
                <div key={mod.id} className="border rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium text-gray-800">{mod.title} <span className="text-xs text-gray-400 ml-2">({mod.code})</span></div>
                      <div className="text-xs text-gray-500">{(mod.permissions || []).length} permission(s)</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={isModuleAllSelected(mod)}
                          ref={el => {
                            if (!el) return;
                            el.indeterminate = isModuleSomeSelected(mod);
                          }}
                          onChange={(e) => moduleSelectAll(mod, e.target.checked)}
                        />
                        <span>{isModuleAllSelected(mod) ? "All selected" : "Select all"}</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {(mod.permissions || []).map(p => {
                      const pid = Number(p.id);
                      const checked = assigned.has(pid);
                      const label = p.label || p.permission_key;
                      const actionTitle = (p.action && p.action.title) || p.action_code || "";
                      return (
                        <label key={pid} className="flex items-center gap-2 border rounded px-3 py-2 text-sm hover:bg-gray-50">
                          <input type="checkbox" checked={checked} onChange={() => togglePermission(pid)} />
                          <div>
                            <div className="font-medium text-gray-700">{label}</div>
                            <div className="text-xs text-gray-500">{p.permission_key}{actionTitle ? ` — ${actionTitle}` : ""}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
}
