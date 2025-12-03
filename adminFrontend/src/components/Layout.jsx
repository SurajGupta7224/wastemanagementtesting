// src/components/Layout.jsx
import React, { useEffect, useState, lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

import Dashboard from "../pages/Dashboard";
import ModulesPage from "../pages/ModulesPage";
import ModuleGenericPage from "../pages/ModuleGenericPage";

import { BASE_URL } from "../services/api";

export default function Layout() {
  const [modules, setModules] = useState([]);

  useEffect(() => {
    fetch(`${BASE_URL}/modules`)
      .then(res => res.json())
      .then(json => setModules(json.data || []))
      .catch(() => setModules([]));
  }, []);

  const loadComponent = (code) => {
    const fileName = code.charAt(0).toUpperCase() + code.slice(1) + "Page";

    try {
      return lazy(() => import(`../pages/${fileName}.jsx`));
    } catch (err) {
      return null;
    }
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <div style={{ marginLeft: 288 }} className="flex-1 bg-gray-50 min-h-screen pt-20">
        <Topbar />

        <div className="p-6">
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              <Route index element={<Dashboard />} />

              {modules.map((m) => {
                const code = m.code;

                if (code === "modules") {
                  return <Route key={code} path={code} element={<ModulesPage />} />;
                }

                const DynamicPage = loadComponent(code);

                return (
                  <Route
                    key={code}
                    path={code}
                    element={
                      DynamicPage ? (
                        <DynamicPage />
                      ) : (
                        <ModuleGenericPage module={m} />
                      )
                    }
                  />
                );
              })}

              <Route path="*" element={<Dashboard />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </div>
  );
}
