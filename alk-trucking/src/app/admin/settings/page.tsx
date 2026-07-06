"use client";

import React, { useState } from "react";
import { Settings, Save, Building2, DollarSign, Truck, Users, Bell, Shield } from "lucide-react";
import { PageShell } from "@/components/ui/PageShell";

const COST_TYPES_DEFAULT = ["Fuel", "Toll Fee", "Driver Allowance", "Helper Allowance", "Loading Fee", "Unloading Fee", "Other"];

export default function SettingsPage() {
  const [systemName, setSystemName] = useState("ALK Trucking Management System");
  const [companyName, setCompanyName] = useState("ALK Trucking");
  const [address, setAddress] = useState("Cagayan de Oro City, Mindanao, Philippines");
  const [defaultDriverRate, setDefaultDriverRate] = useState("500");
  const [defaultHelperRate, setDefaultHelperRate] = useState("300");
  const [costTypes, setCostTypes] = useState(COST_TYPES_DEFAULT);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <PageShell
      title="Settings"
      subtitle="System configuration and preferences"
      actions={
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all ${
            saved ? "bg-emerald-500 text-white" : "bg-[#1e3a8a] hover:bg-[#1e40af] text-white"
          }`}
        >
          <Save className="w-4 h-4" />
          {saved ? "Saved!" : "Save Changes"}
        </button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Settings panels */}
        <div className="lg:col-span-2 space-y-4">
          {/* Company Info */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-[#1e3a8a]" />
              </div>
              <h2 className="font-manrope font-bold text-slate-800">Company Information</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "System Name", value: systemName, onChange: setSystemName },
                { label: "Company Name", value: companyName, onChange: setCompanyName },
              ].map((f) => (
                <div key={f.label}>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">{f.label}</label>
                  <input
                    value={f.value}
                    onChange={(e) => f.onChange(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-[#1e3a8a] focus:bg-white transition-all"
                  />
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Company Address</label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-[#1e3a8a] focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Payroll defaults */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <h2 className="font-manrope font-bold text-slate-800">Payroll Defaults</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Default Driver Rate per Trip (₱)", value: defaultDriverRate, onChange: setDefaultDriverRate },
                { label: "Default Helper Rate per Trip (₱)", value: defaultHelperRate, onChange: setDefaultHelperRate },
              ].map((f) => (
                <div key={f.label}>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">{f.label}</label>
                  <input
                    type="number"
                    value={f.value}
                    onChange={(e) => f.onChange(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-[#1e3a8a] focus:bg-white transition-all"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Cost Types */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                <Truck className="w-4 h-4 text-amber-600" />
              </div>
              <h2 className="font-manrope font-bold text-slate-800">Trip Cost Types</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {costTypes.map((ct, i) => (
                <div key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <span className="text-sm text-slate-700 font-medium">{ct}</span>
                  <button
                    onClick={() => setCostTypes(costTypes.filter((_, j) => j !== i))}
                    className="text-slate-400 hover:text-red-500 transition-colors text-xs font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const val = prompt("New cost type name:");
                  if (val) setCostTypes([...costTypes, val]);
                }}
                className="flex items-center gap-1.5 border-2 border-dashed border-slate-300 hover:border-[#1e3a8a] text-slate-400 hover:text-[#1e3a8a] rounded-lg px-3 py-2 text-sm transition-all"
              >
                + Add Type
              </button>
            </div>
          </div>
        </div>

        {/* Right — System controls */}
        <div className="space-y-4">
          {/* Maintenance Mode */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                <Shield className="w-4 h-4 text-red-500" />
              </div>
              <h2 className="font-manrope font-bold text-slate-800">System Access</h2>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <p className="text-sm font-semibold text-slate-700">Maintenance Mode</p>
                <p className="text-xs text-slate-400 mt-0.5">Block all non-developer access</p>
              </div>
              <button
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={`relative w-12 h-6 rounded-full transition-all ${maintenanceMode ? "bg-red-500" : "bg-slate-200"}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${maintenanceMode ? "left-6" : "left-0.5"}`} />
              </button>
            </div>
            {maintenanceMode && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-xs text-red-700 font-medium">⚠️ Maintenance mode is ON. Only developers can access the system.</p>
              </div>
            )}
          </div>

          {/* System Info */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="font-manrope font-bold text-slate-800 mb-4">System Info</h2>
            <div className="space-y-3">
              {[
                { label: "Version", value: "v1.0.0" },
                { label: "Environment", value: "Production" },
                { label: "Database", value: "Supabase (Pending)" },
                { label: "Auth", value: "Google OAuth" },
                { label: "Framework", value: "Next.js 16" },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{s.label}</span>
                  <span className="font-semibold text-slate-700 font-mono">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
