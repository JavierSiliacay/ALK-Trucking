"use client";

import React, { useState } from "react";
import { PageShell } from "@/components/ui/PageShell";
import { useTrips, MasterTruck, MasterRoute } from "@/lib/trips-store";
import { Plus, Trash2, UserCheck, Users, Truck, Building2, MapPin, DollarSign, Shield, Check } from "lucide-react";

export default function SettingsPage() {
  const { masterData, updateMaster, isLoaded } = useTrips();
  const [activeTab, setActiveTab] = useState<
    "drivers" | "helpers" | "trucks" | "customers" | "owners" | "routes" | "categories"
  >("drivers");

  // Input states for adding master data
  const [newDriver, setNewDriver] = useState("");
  const [newHelper, setNewHelper] = useState("");

  const [truckUnit, setTruckUnit] = useState("");
  const [truckPlate, setTruckPlate] = useState("");
  const [truckOwner, setTruckOwner] = useState("ALK Trucking");

  const [newCustomer, setNewCustomer] = useState("");
  const [newOwner, setNewOwner] = useState("");

  const [routeOrigin, setRouteOrigin] = useState("CDO");
  const [routeDest, setRouteDest] = useState("");
  const [routeDist, setRouteDist] = useState("");

  const [newCategory, setNewCategory] = useState("");

  if (!isLoaded) {
    return (
      <PageShell title="Settings" subtitle="Loading master data...">
        <div className="py-20 text-center text-slate-400 text-sm">Loading master settings...</div>
      </PageShell>
    );
  }

  // Master Data Add Functions
  const handleAddDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriver.trim()) return;
    updateMaster({ drivers: [...masterData.drivers, newDriver.trim()] });
    setNewDriver("");
  };

  const handleDeleteDriver = (name: string) => {
    updateMaster({ drivers: masterData.drivers.filter((d) => d !== name) });
  };

  const handleAddHelper = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHelper.trim()) return;
    updateMaster({ helpers: [...masterData.helpers, newHelper.trim()] });
    setNewHelper("");
  };

  const handleDeleteHelper = (name: string) => {
    updateMaster({ helpers: masterData.helpers.filter((h) => h !== name) });
  };

  const handleAddTruck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!truckUnit.trim() || !truckPlate.trim()) return;
    const newTruck: MasterTruck = {
      id: `t_${Date.now()}`,
      unit: truckUnit.trim(),
      plateNo: truckPlate.trim(),
      owner: truckOwner || "ALK Trucking",
    };
    updateMaster({ trucks: [...masterData.trucks, newTruck] });
    setTruckUnit("");
    setTruckPlate("");
  };

  const handleDeleteTruck = (id: string) => {
    updateMaster({ trucks: masterData.trucks.filter((t) => t.id !== id) });
  };

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.trim()) return;
    updateMaster({ customers: [...masterData.customers, newCustomer.trim()] });
    setNewCustomer("");
  };

  const handleDeleteCustomer = (name: string) => {
    updateMaster({ customers: masterData.customers.filter((c) => c !== name) });
  };

  const handleAddOwner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOwner.trim()) return;
    updateMaster({ owners: [...masterData.owners, newOwner.trim()] });
    setNewOwner("");
  };

  const handleDeleteOwner = (name: string) => {
    updateMaster({ owners: masterData.owners.filter((o) => o !== name) });
  };

  const handleAddRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeOrigin.trim() || !routeDest.trim()) return;
    const newR: MasterRoute = {
      id: `r_${Date.now()}`,
      origin: routeOrigin.trim(),
      destination: routeDest.trim(),
      distance: routeDist.trim() || "N/A",
    };
    updateMaster({ routes: [...masterData.routes, newR] });
    setRouteDest("");
    setRouteDist("");
  };

  const handleDeleteRoute = (id: string) => {
    updateMaster({ routes: masterData.routes.filter((r) => r.id !== id) });
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    updateMaster({ expenseCategories: [...masterData.expenseCategories, newCategory.trim()] });
    setNewCategory("");
  };

  const handleDeleteCategory = (cat: string) => {
    updateMaster({ expenseCategories: masterData.expenseCategories.filter((c) => c !== cat) });
  };

  return (
    <PageShell
      title="Settings"
      subtitle="Master Data Management (Drivers, Trucks, Customers & Routes)"
    >
      {/* Master Data Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-2xl mb-8">
        <button
          onClick={() => setActiveTab("drivers")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === "drivers" ? "bg-[#1e3a8a] text-white shadow-md" : "text-slate-600 hover:bg-slate-200"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Drivers ({masterData.drivers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("helpers")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === "helpers" ? "bg-[#1e3a8a] text-white shadow-md" : "text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Helpers ({masterData.helpers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("trucks")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === "trucks" ? "bg-[#1e3a8a] text-white shadow-md" : "text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Trucks ({masterData.trucks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("customers")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === "customers" ? "bg-[#1e3a8a] text-white shadow-md" : "text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Customers ({masterData.customers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("owners")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === "owners" ? "bg-[#1e3a8a] text-white shadow-md" : "text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Truck Owners ({masterData.owners.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("routes")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === "routes" ? "bg-[#1e3a8a] text-white shadow-md" : "text-slate-600 hover:bg-slate-200"
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Routes ({masterData.routes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("categories")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === "categories" ? "bg-[#1e3a8a] text-white shadow-md" : "text-slate-600 hover:bg-slate-200"
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Expense Categories ({masterData.expenseCategories.length})</span>
        </button>
      </div>

      {/* TAB 1: DRIVERS */}
      {activeTab === "drivers" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <form onSubmit={handleAddDriver} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-manrope font-extrabold text-slate-900 text-base">+ Add Driver</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">DRIVER NAME *</label>
              <input
                type="text"
                required
                placeholder="e.g. Dela Cruz, Juan"
                value={newDriver}
                onChange={(e) => setNewDriver(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] outline-none font-bold text-slate-800"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-[#1e3a8a] text-white font-extrabold text-xs rounded-xl hover:bg-blue-900 transition-all cursor-pointer shadow-md"
            >
              Add Driver to Master Data
            </button>
          </form>

          <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-manrope font-extrabold text-slate-900 text-base border-b border-slate-100 pb-3">Master Driver List</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {masterData.drivers.map((d) => (
                <div key={d} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">{d}</span>
                  <button
                    onClick={() => handleDeleteDriver(d)}
                    className="p-1 text-slate-300 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HELPERS */}
      {activeTab === "helpers" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <form onSubmit={handleAddHelper} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-manrope font-extrabold text-slate-900 text-base">+ Add Helper</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">HELPER NAME *</label>
              <input
                type="text"
                required
                placeholder="e.g. Gomez, Bryan"
                value={newHelper}
                onChange={(e) => setNewHelper(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] outline-none font-bold text-slate-800"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-[#1e3a8a] text-white font-extrabold text-xs rounded-xl hover:bg-blue-900 transition-all cursor-pointer shadow-md"
            >
              Add Helper to Master Data
            </button>
          </form>

          <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-manrope font-extrabold text-slate-900 text-base border-b border-slate-100 pb-3">Master Helper List</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {masterData.helpers.map((h) => (
                <div key={h} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">{h}</span>
                  <button
                    onClick={() => handleDeleteHelper(h)}
                    className="p-1 text-slate-300 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TRUCKS */}
      {activeTab === "trucks" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <form onSubmit={handleAddTruck} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-manrope font-extrabold text-slate-900 text-base">+ Add Truck Unit</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">TRUCK UNIT MODEL *</label>
              <input
                type="text"
                required
                placeholder="e.g. CANTER"
                value={truckUnit}
                onChange={(e) => setTruckUnit(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] outline-none font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">PLATE NUMBER *</label>
              <input
                type="text"
                required
                placeholder="e.g. AAX-4163"
                value={truckPlate}
                onChange={(e) => setTruckPlate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] outline-none font-mono font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">TRUCK OWNER</label>
              <input
                type="text"
                placeholder="e.g. ALK Trucking"
                value={truckOwner}
                onChange={(e) => setTruckOwner(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] outline-none text-slate-800"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-[#1e3a8a] text-white font-extrabold text-xs rounded-xl hover:bg-blue-900 transition-all cursor-pointer shadow-md"
            >
              Add Truck Unit
            </button>
          </form>

          <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-manrope font-extrabold text-slate-900 text-base border-b border-slate-100 pb-3">Fleet Units List</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {masterData.trucks.map((t) => (
                <div key={t.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{t.unit}</p>
                    <p className="font-mono text-xs text-blue-700 font-semibold">{t.plateNo}</p>
                    <p className="text-[10px] text-slate-400">Owner: {t.owner}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteTruck(t.id)}
                    className="p-1 text-slate-300 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CUSTOMERS */}
      {activeTab === "customers" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <form onSubmit={handleAddCustomer} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-manrope font-extrabold text-slate-900 text-base">+ Add Customer</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">CUSTOMER / CLIENT NAME *</label>
              <input
                type="text"
                required
                placeholder="e.g. NEST-O"
                value={newCustomer}
                onChange={(e) => setNewCustomer(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] outline-none font-bold text-slate-800"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-[#1e3a8a] text-white font-extrabold text-xs rounded-xl hover:bg-blue-900 transition-all cursor-pointer shadow-md"
            >
              Add Customer
            </button>
          </form>

          <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-manrope font-extrabold text-slate-900 text-base border-b border-slate-100 pb-3">Master Customer List</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {masterData.customers.map((c) => (
                <div key={c} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">{c}</span>
                  <button
                    onClick={() => handleDeleteCustomer(c)}
                    className="p-1 text-slate-300 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TRUCK OWNERS */}
      {activeTab === "owners" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <form onSubmit={handleAddOwner} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-manrope font-extrabold text-slate-900 text-base">+ Add Truck Owner</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">OWNER NAME / ENTITY *</label>
              <input
                type="text"
                required
                placeholder="e.g. Mindanao Logistics"
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] outline-none font-bold text-slate-800"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-[#1e3a8a] text-white font-extrabold text-xs rounded-xl hover:bg-blue-900 transition-all cursor-pointer shadow-md"
            >
              Add Owner
            </button>
          </form>

          <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-manrope font-extrabold text-slate-900 text-base border-b border-slate-100 pb-3">Master Truck Owners</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {masterData.owners.map((o) => (
                <div key={o} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">{o}</span>
                  <button
                    onClick={() => handleDeleteOwner(o)}
                    className="p-1 text-slate-300 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: ROUTES */}
      {activeTab === "routes" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <form onSubmit={handleAddRoute} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-manrope font-extrabold text-slate-900 text-base">+ Add Route</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ORIGIN (POINT A) *</label>
              <input
                type="text"
                required
                placeholder="e.g. CDO"
                value={routeOrigin}
                onChange={(e) => setRouteOrigin(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] outline-none font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">DESTINATION (POINT B) *</label>
              <input
                type="text"
                required
                placeholder="e.g. SURIGAO"
                value={routeDest}
                onChange={(e) => setRouteDest(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] outline-none font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">DISTANCE (OPTIONAL)</label>
              <input
                type="text"
                placeholder="e.g. 310 km"
                value={routeDist}
                onChange={(e) => setRouteDist(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] outline-none text-slate-800"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-[#1e3a8a] text-white font-extrabold text-xs rounded-xl hover:bg-blue-900 transition-all cursor-pointer shadow-md"
            >
              Add Route
            </button>
          </form>

          <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-manrope font-extrabold text-slate-900 text-base border-b border-slate-100 pb-3">Master Routes List</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {masterData.routes.map((r) => (
                <div key={r.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="font-extrabold text-slate-900 text-sm">{r.origin} → {r.destination}</p>
                    <p className="text-xs text-slate-400 font-mono">Distance: {r.distance}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteRoute(r.id)}
                    className="p-1 text-slate-300 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: EXPENSE CATEGORIES */}
      {activeTab === "categories" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <form onSubmit={handleAddCategory} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-manrope font-extrabold text-slate-900 text-base">+ Add Expense Category</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">CATEGORY NAME *</label>
              <input
                type="text"
                required
                placeholder="e.g. Parking Fee"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] outline-none font-bold text-slate-800"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-[#1e3a8a] text-white font-extrabold text-xs rounded-xl hover:bg-blue-900 transition-all cursor-pointer shadow-md"
            >
              Add Category
            </button>
          </form>

          <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-manrope font-extrabold text-slate-900 text-base border-b border-slate-100 pb-3">Pre-set Expense Categories</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {masterData.expenseCategories.map((cat) => (
                <div key={cat} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">{cat}</span>
                  <button
                    onClick={() => handleDeleteCategory(cat)}
                    className="p-1 text-slate-300 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </PageShell>
  );
}
