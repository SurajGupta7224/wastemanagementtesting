// src/components/Sidebar.jsx
import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { HomeIcon, TagIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { BASE_URL } from "../services/api";

export default function Sidebar({ modules: propModules = null, loading: propLoading = false, error: propError = null }) {
  const [open, setOpen] = useState(null);
  const [modules, setModules] = useState(propModules ?? []);
  const [loadingModules, setLoadingModules] = useState(propModules ? propLoading : true);
  const [modulesError, setModulesError] = useState(propError);

  useEffect(() => {
    // If parent passed modules, use those and skip fetch
    if (propModules) {
      setModules(propModules);
      setLoadingModules(propLoading);
      setModulesError(propError);
      return;
    }

    // otherwise fetch modules (backwards compatibility)
    let cancelled = false;
    async function fetchModules() {
      setLoadingModules(true);
      try {
        const r = await fetch(`${BASE_URL}/modules`, { headers: { "Content-Type": "application/json" }});
        const json = await r.json().catch(() => null);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const list = (json?.status === 1 && Array.isArray(json.data)) ? json.data : (Array.isArray(json) ? json : []);
        if (!cancelled) setModules(list);
      } catch (err) {
        console.error("[Sidebar] Failed to load modules:", err);
        if (!cancelled) {
          setModules([]);
          setModulesError("Unable to load modules");
        }
      } finally {
        if (!cancelled) setLoadingModules(false);
      }
    }
    fetchModules();
    return () => (cancelled = true);
  }, [propModules, propLoading, propError]);

  const staticMenu = [{ id: "dashboard", name: "Dashboard", to: "/dashboard", icon: HomeIcon }];

  const dynamicTopMenu = modules.map((m) => ({
    id: `module-${m.code}`,
    name: m.title,
    to: `/dashboard/${m.code}`,
    icon: TagIcon,
  }));

  const menu = [...staticMenu, ...dynamicTopMenu];
  const toggle = (id) => setOpen((prev) => (prev === id ? null : id));

  return (
    <aside className="w-72 bg-emerald-900 text-white min-h-screen fixed left-0 top-0 z-40 shadow-lg">
      <div className="px-6 py-4 flex items-center gap-3 border-b border-emerald-800">
        <div className="w-12 h-12 rounded-md bg-white/10 flex items-center justify-center">
          <span className="text-2xl font-extrabold text-emerald-50">E</span>
        </div>
        <div>
          <div className="font-bold text-lg">Ecosphere</div>
          <div className="text-xs text-emerald-200">Waste Solution</div>
        </div>
      </div>

      <div className="px-4 py-2 text-xs text-yellow-200">
        {loadingModules ? "Loading modules..." : modulesError ? modulesError : ""}
      </div>

      <nav className="px-1 py-4 overflow-auto" style={{ height: "calc(100vh - 95px)" }}>
        {menu.map((m) => {
          const Icon = m.icon;
          if (m.children) {
            const isOpen = open === m.id;
            return (
              <div key={m.id} className="px-2">
                <button onClick={() => toggle(m.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-md my-1 text-sm transition ${isOpen ? "bg-emerald-800/70" : "hover:bg-emerald-800/30"}`}>
                  <Icon className="h-5 w-5 text-emerald-100" />
                  <span className="flex-1">{m.name}</span>
                  {isOpen ? <ChevronUpIcon className="h-4 w-4 text-emerald-100" /> : <ChevronDownIcon className="h-4 w-4 text-emerald-100" />}
                </button>
                {isOpen && (
                  <div className="pl-10 pr-2">
                    {m.children.map((c) => {
                      const CIcon = c.icon;
                      return (
                        <NavLink key={c.to} to={c.to} className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-md text-sm my-1 transition ${isActive ? "bg-emerald-800/70 text-white" : "hover:bg-emerald-800/20 text-emerald-100"}`}>
                          <CIcon className="h-4 w-4 text-emerald-100" />
                          <span>{c.name}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink key={m.id} to={m.to} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-md my-1 text-sm transition ${isActive ? "bg-emerald-800/70" : "hover:bg-emerald-800/30"}`}>
              <Icon className="h-5 w-5 text-emerald-100" />
              <span>{m.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 w-full px-6 py-4 border-t border-emerald-800">
        <div className="text-xs text-emerald-200">© {new Date().getFullYear()} Hommlie</div>
      </div>
    </aside>
  );
}
