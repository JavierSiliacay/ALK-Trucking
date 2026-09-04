"use client";

import React, { useState, useEffect } from "react";
import { PageShell } from "@/components/ui/PageShell";
import { useTrips } from "@/lib/trips-store";
import { UserCheck, Users, Truck, Plus, Search, Archive, AlertTriangle, ShieldCheck, XCircle, Sparkles, Link as LinkIcon, Lock, Pencil, Loader2 } from "lucide-react";
import { addDriver, archiveDriver, addHelper, archiveHelper, addTruck, archiveTruck, editTruck } from "@/actions/master";
import { getAuthorizedUsers, addAuthorizedUser, revokeUserAccess } from "@/actions/users";
import { getSystemSetting, updateSystemSetting } from "@/actions/settings";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import Image from "next/image";
import wingvanImg from "../../../../public/wingvan.png";
import canterImg from "../../../../public/canter6wheelers.png";
import forwardImg from "../../../../public/forward.png";

export default function SettingsPage() {
  const { masterData, isLoaded } = useTrips();
  const { data: session } = useSession();
  const isDeveloper = session?.user?.email === "siliacay.javier@gmail.com";
  const [activeTab, setActiveTab] = useState<"drivers" | "helpers" | "trucks" | "access" | "integrations">("drivers");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [isHelperModalOpen, setIsHelperModalOpen] = useState(false);
  const [isTruckModalOpen, setIsTruckModalOpen] = useState(false);
  const [editingTruckId, setEditingTruckId] = useState<string | null>(null);
  const [truckToArchive, setTruckToArchive] = useState<{ id: string, plateNo: string } | null>(null);
  const [isArchiveTruckModalOpen, setIsArchiveTruckModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);

  // Auth states
  const [authorizedUsers, setAuthorizedUsers] = useState<any[]>([]);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [newAuthEmail, setNewAuthEmail] = useState("");
  const [newAuthName, setNewAuthName] = useState("");

  const [isAutoworxSyncEnabled, setIsAutoworxSyncEnabled] = useState(false);
  const [isSettingLoading, setIsSettingLoading] = useState(false);
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState("50000");
  const [isThresholdSaving, setIsThresholdSaving] = useState(false);

  useEffect(() => {
    if (activeTab === "access") {
      loadAuthorizedUsers();
    }
    if (activeTab === "integrations") {
      loadIntegrationSettings();
    }
  }, [activeTab]);

  const loadIntegrationSettings = async () => {
    setIsSettingLoading(true);
    const setting = await getSystemSetting("ENABLE_AUTOWORX_SYNC", "true");
    setIsAutoworxSyncEnabled(setting === "true");
    
    const threshold = await getSystemSetting("FINANCIAL_LOW_BALANCE_THRESHOLD", "50000");
    setLowBalanceThreshold(threshold);
    setIsSettingLoading(false);
  };

  const loadAuthorizedUsers = async () => {
    setIsAuthLoading(true);
    const users = await getAuthorizedUsers();
    setAuthorizedUsers(users);
    setIsAuthLoading(false);
  };

  // Form states
  const [newName, setNewName] = useState("");
  const [truckUnit, setTruckUnit] = useState("");
  const [truckPlate, setTruckPlate] = useState("");
  const [truckOwner, setTruckOwner] = useState("ALK Trucking");

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoaded) {
    return (
      <PageShell title="Settings" subtitle="Loading master data...">
        <div className="py-20 text-center text-slate-400 text-sm">Loading master settings...</div>
      </PageShell>
    );
  }

  // Action Handlers
  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsSubmitting(true);
    await addDriver(newName.trim());
    setIsSubmitting(false);
    setNewName("");
    setIsDriverModalOpen(false);
  };

  const handleArchiveDriver = async (name: string) => {
    if (confirm(`Are you sure you want to archive ${name}? They will no longer appear in new trips.`)) {
      await archiveDriver(name);
    }
  };

  const handleAddHelper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsSubmitting(true);
    await addHelper(newName.trim());
    setIsSubmitting(false);
    setNewName("");
    setIsHelperModalOpen(false);
  };

  const handleArchiveHelper = async (name: string) => {
    if (confirm(`Are you sure you want to archive ${name}? They will no longer appear in new trips.`)) {
      await archiveHelper(name);
    }
  };

  const handleAddTruck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!truckUnit.trim() || !truckPlate.trim()) return;
    setIsSubmitting(true);
    if (editingTruckId) {
      await editTruck(editingTruckId, truckUnit.trim(), truckPlate.trim(), truckOwner);
    } else {
      await addTruck(truckUnit.trim(), truckPlate.trim(), truckOwner);
    }
    setIsSubmitting(false);
    setEditingTruckId(null);
    setTruckUnit("");
    setTruckPlate("");
    setTruckOwner("ALK Trucking");
    setIsTruckModalOpen(false);
  };

  const openEditTruckModal = (t: any) => {
    setEditingTruckId(t.id);
    setTruckPlate(t.plateNo);
    setTruckUnit(t.unit);
    setTruckOwner(t.owner);
    setIsTruckModalOpen(true);
  };

  const handleArchiveTruckConfirm = async () => {
    if (!truckToArchive) return;
    setIsSubmitting(true);
    await archiveTruck(truckToArchive.id);
    setIsSubmitting(false);
    setIsArchiveTruckModalOpen(false);
    setTruckToArchive(null);
  };

  const openArchiveTruckModal = (id: string, plateNo: string) => {
    setTruckToArchive({ id, plateNo });
    setIsArchiveTruckModalOpen(true);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthEmail.trim()) return;
    setIsSubmitting(true);
    const res = await addAuthorizedUser(newAuthEmail.trim(), newAuthName.trim());
    if (res.success) {
      toast.success(res.message);
      loadAuthorizedUsers();
      setIsUserModalOpen(false);
      setNewAuthEmail("");
      setNewAuthName("");
    } else {
      toast.error(res.message);
    }
    setIsSubmitting(false);
  };

  const handleRevokeUser = async (id: string, email: string) => {
    if (confirm(`Are you sure you want to revoke access for ${email}? They will no longer be able to log in.`)) {
      const res = await revokeUserAccess(id);
      if (res.success) {
        toast.success(res.message);
        loadAuthorizedUsers();
      } else {
        toast.error(res.message);
      }
    }
  };

  const handleToggleSync = async () => {
    if (!isDeveloper) {
      setShowDeveloperModal(true);
      return;
    }
    
    const newValue = !isAutoworxSyncEnabled;
    const actionText = newValue ? "ENABLE" : "DISABLE";
    if (!window.confirm(`Are you sure you want to ${actionText} Cross-System Sync?`)) {
      return;
    }
    
    setIsSettingLoading(true);
    const res = await updateSystemSetting("ENABLE_AUTOWORX_SYNC", newValue ? "true" : "false");
    
    if (res.success) {
      setIsAutoworxSyncEnabled(newValue);
      toast.success(newValue ? "Autoworx Sync Enabled!" : "Autoworx Sync Disabled - Stealth Mode Active!");
    } else {
      toast.error("Failed to update setting");
    }
    setIsSettingLoading(false);
  };

  const handleSaveThreshold = async () => {
    if (!isDeveloper) {
      setShowDeveloperModal(true);
      return;
    }
    
    setIsThresholdSaving(true);
    const res = await updateSystemSetting("FINANCIAL_LOW_BALANCE_THRESHOLD", lowBalanceThreshold);
    if (res.success) {
      toast.success("Low Balance Threshold updated successfully!");
    } else {
      toast.error("Failed to update threshold");
    }
    setIsThresholdSaving(false);
  };

  // Filtering
  const filteredDrivers = masterData.drivers.filter(d => d.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredHelpers = masterData.helpers.filter(h => h.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredTrucks = masterData.trucks.filter(t => t.plateNo.toLowerCase().includes(searchQuery.toLowerCase()) || t.unit.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredUsers = authorizedUsers.filter(u => u.email.toLowerCase().includes(searchQuery.toLowerCase()) || (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())));

  return (
    <PageShell
      title="Settings"
      subtitle="Manage your Core Fleet Assets and Security"
    >
      {/* Dashboard Cards for Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div 
          onClick={() => setActiveTab("drivers")}
          className={`p-6 rounded-2xl cursor-pointer border-2 transition-all flex items-center gap-4 ${activeTab === "drivers" ? "bg-blue-50 border-[#1e3a8a] shadow-md" : "bg-white border-slate-200 hover:border-slate-300"}`}
        >
          <div className={`p-3 rounded-xl ${activeTab === "drivers" ? "bg-[#1e3a8a] text-white" : "bg-slate-100 text-slate-500"}`}>
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900">Drivers</h3>
            <p className="text-xs text-slate-500 font-bold">{masterData.drivers.length} Active</p>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab("helpers")}
          className={`p-6 rounded-2xl cursor-pointer border-2 transition-all flex items-center gap-4 ${activeTab === "helpers" ? "bg-blue-50 border-[#1e3a8a] shadow-md" : "bg-white border-slate-200 hover:border-slate-300"}`}
        >
          <div className={`p-3 rounded-xl ${activeTab === "helpers" ? "bg-[#1e3a8a] text-white" : "bg-slate-100 text-slate-500"}`}>
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900">Helpers</h3>
            <p className="text-xs text-slate-500 font-bold">{masterData.helpers.length} Active</p>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab("trucks")}
          className={`p-6 rounded-2xl cursor-pointer border-2 transition-all flex items-center gap-4 ${activeTab === "trucks" ? "bg-blue-50 border-[#1e3a8a] shadow-md" : "bg-white border-slate-200 hover:border-slate-300"}`}
        >
          <div className={`p-3 rounded-xl ${activeTab === "trucks" ? "bg-[#1e3a8a] text-white" : "bg-slate-100 text-slate-500"}`}>
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900">Trucks</h3>
            <p className="text-xs text-slate-500 font-bold">{masterData.trucks.length} Active</p>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab("access")}
          className={`p-6 rounded-2xl cursor-pointer border-2 transition-all flex items-center gap-4 ${activeTab === "access" ? "bg-rose-50 border-rose-800 shadow-md" : "bg-white border-slate-200 hover:border-slate-300"}`}
        >
          <div className={`p-3 rounded-xl ${activeTab === "access" ? "bg-rose-800 text-white" : "bg-slate-100 text-slate-500"}`}>
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900">Access</h3>
            <p className="text-xs text-slate-500 font-bold">Authorized Users</p>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab("integrations")}
          className={`p-6 rounded-2xl cursor-pointer border-2 transition-all flex items-center gap-4 ${activeTab === "integrations" ? "bg-purple-50 border-purple-800 shadow-md" : "bg-white border-slate-200 hover:border-slate-300"}`}
        >
          <div className={`p-3 rounded-xl ${activeTab === "integrations" ? "bg-purple-800 text-white" : "bg-slate-100 text-slate-500"}`}>
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900">System</h3>
            <p className="text-xs text-slate-500 font-bold">Integrations & Rules</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {/* Header bar with Search and Add Button */}
        {activeTab !== "integrations" && (
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder={`Search ${activeTab}...`} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
            />
          </div>
          <button
            onClick={() => {
              if (activeTab === "drivers") setIsDriverModalOpen(true);
              if (activeTab === "helpers") setIsHelperModalOpen(true);
              if (activeTab === "trucks") {
                setEditingTruckId(null);
                setTruckPlate("");
                setTruckUnit("");
                setTruckOwner("ALK Trucking");
                setIsTruckModalOpen(true);
              }
              if (activeTab === "access") setIsUserModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1e3a8a] text-white font-extrabold text-sm rounded-xl hover:bg-blue-900 transition-colors shadow-md shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New {activeTab === "drivers" ? "Driver" : activeTab === "helpers" ? "Helper" : activeTab === "trucks" ? "Truck" : "User"}</span>
          </button>
        </div>
        )}

        {/* List Grid */}
        <div className="p-4 sm:p-6 bg-slate-50/50 min-h-[400px]">
          
          {/* DRIVERS */}
          {activeTab === "drivers" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredDrivers.map(d => (
                <div key={d} className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between group hover:border-[#1e3a8a]/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-800 flex items-center justify-center font-black text-sm">
                      {d.charAt(0)}
                    </div>
                    <span className="font-extrabold text-slate-800 text-sm">{d}</span>
                  </div>
                  <button 
                    onClick={() => handleArchiveDriver(d)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Archive Driver"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {filteredDrivers.length === 0 && (
                <div className="col-span-full py-10 text-center text-slate-400 font-bold text-sm">No drivers found.</div>
              )}
            </div>
          )}

          {/* HELPERS */}
          {activeTab === "helpers" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredHelpers.map(h => (
                <div key={h} className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between group hover:border-[#1e3a8a]/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-800 flex items-center justify-center font-black text-sm">
                      {h.charAt(0)}
                    </div>
                    <span className="font-extrabold text-slate-800 text-sm">{h}</span>
                  </div>
                  <button 
                    onClick={() => handleArchiveHelper(h)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Archive Helper"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {filteredHelpers.length === 0 && (
                <div className="col-span-full py-10 text-center text-slate-400 font-bold text-sm">No helpers found.</div>
              )}
            </div>
          )}

          {/* TRUCKS */}
          {activeTab === "trucks" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTrucks.map(t => {
                const normalizedUnit = t.unit.toLowerCase();
                let iconSrc = null;
                if (normalizedUnit.includes("wingvan")) iconSrc = wingvanImg;
                else if (normalizedUnit.includes("canter")) iconSrc = canterImg;
                else if (normalizedUnit.includes("forward")) iconSrc = forwardImg;

                return (
                <div key={t.id} className="bg-white border border-slate-200 p-5 rounded-2xl group hover:border-[#1e3a8a]/30 transition-colors relative">
                  <div className="absolute top-4 right-4 flex gap-1">
                    <button 
                      onClick={() => openEditTruckModal(t)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Edit Truck"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => openArchiveTruckModal(t.id, t.plateNo)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Archive Truck"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    {iconSrc ? (
                      <div className="w-12 h-12 relative rounded-xl overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 shadow-sm p-1">
                        <Image src={iconSrc} alt={t.unit} fill sizes="48px" className="object-contain p-1" />
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
                        <Truck className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-black text-slate-900 text-lg uppercase tracking-tight">{t.plateNo}</h4>
                      <p className="text-xs text-slate-500 font-bold">{t.unit}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Owner</span>
                    <span className="text-xs font-extrabold text-[#1e3a8a] px-2 py-1 bg-blue-50 rounded-md">{t.owner}</span>
                  </div>
                </div>
              )})}
              {filteredTrucks.length === 0 && (
                <div className="col-span-full py-10 text-center text-slate-400 font-bold text-sm">No trucks found.</div>
              )}
            </div>
          )}

          {/* ACCESS CONTROL */}
          {activeTab === "access" && (
            <div className="space-y-4">
              {isAuthLoading ? (
                <div className="py-10 text-center text-slate-400 text-sm font-bold">Loading users...</div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 font-bold text-slate-700">Name</th>
                        <th className="px-6 py-4 font-bold text-slate-700">Google Email</th>
                        <th className="px-6 py-4 font-bold text-slate-700">Role</th>
                        <th className="px-6 py-4 font-bold text-slate-700 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-extrabold text-slate-800">{user.name || "-"}</td>
                          <td className="px-6 py-4 font-medium text-slate-600">{user.email}</td>
                          <td className="px-6 py-4">
                            {user.email === 'siliacay.javier@gmail.com' ? (
                              <div className="relative group inline-flex items-center justify-center">
                                <div className="absolute -inset-[1.5px] bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 rounded-md blur-[3px] opacity-60 group-hover:opacity-100 transition duration-500 animate-pulse" />
                                <div className="relative flex items-center gap-1.5 px-3 py-1 bg-slate-950 rounded-md leading-none border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                                  <span className="font-mono text-[11px] font-black text-emerald-400 flex items-center pt-[1px]">
                                    &lt;/&gt;
                                  </span>
                                  <span className="text-[10px] font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-emerald-50 via-cyan-100 to-blue-100 uppercase">
                                    Developer
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-[#1e3a8a] border border-blue-100">
                                {user.role}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {isDeveloper && user.email !== "siliacay.javier@gmail.com" && (
                              <button
                                onClick={() => handleRevokeUser(user.id, user.email)}
                                className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-colors font-bold flex items-center gap-2 ml-auto"
                              >
                                <XCircle className="w-4 h-4" />
                                <span className="text-xs">Revoke</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-10 text-center text-slate-400 font-bold">
                            No authorized users found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* INTEGRATIONS */}
          {activeTab === "integrations" && (
            <div className="space-y-6">
              {isSettingLoading ? (
                <div className="py-10 text-center text-slate-400 text-sm font-bold">Loading configurations...</div>
              ) : (
                <>
                <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                  <div className="max-w-2xl">
                    <h3 className="font-black text-lg text-slate-900 mb-2 flex items-center gap-2">
                      <LinkIcon className="w-5 h-5 text-purple-600" />
                      Autoworx Cross-System Sync
                    </h3>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed mb-4">
                      When enabled, ALK Trucking will automatically accept, parse, and synchronize fleet repair data from the Autoworx Repair Shop dashboard in real-time. This eliminates manual data entry for job orders, repair statuses, and detailed costing.
                    </p>
                    <div className="flex gap-2 items-center">
                      <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md border ${isAutoworxSyncEnabled ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                        {isAutoworxSyncEnabled ? "Currently Enabled" : "Stealth Mode Active"}
                      </span>
                    </div>
                  </div>
                  
                  {/* Toggle Switch */}
                  <button 
                    onClick={handleToggleSync}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${isAutoworxSyncEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <span className="sr-only">Toggle Autoworx Sync</span>
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${isAutoworxSyncEnabled ? 'translate-x-7' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
                
                <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                  <div className="max-w-2xl">
                    <h3 className="font-black text-lg text-slate-900 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-600" />
                      Financial Low Balance Warning Threshold
                    </h3>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed mb-4">
                      When the running balance in the Financial module drops below this amount, a critical warning modal will alert the user to prevent issuing checks with insufficient funds.
                    </p>
                  </div>
                  
                  <div className="flex gap-2 items-center w-full md:w-auto">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₱</span>
                      <input 
                        type="text"
                        value={(() => {
                          if (!lowBalanceThreshold) return "";
                          const parts = lowBalanceThreshold.toString().split('.');
                          parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                          return parts.join('.');
                        })()}
                        onChange={(e) => {
                          let value = e.target.value.replace(/[^0-9.]/g, '');
                          const decimalParts = value.split('.');
                          if (decimalParts.length > 2) {
                            value = decimalParts[0] + '.' + decimalParts.slice(1).join('');
                          }
                          setLowBalanceThreshold(value);
                        }}
                        placeholder="0.00"
                        className="pl-8 pr-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 w-44 focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono text-sm"
                      />
                    </div>
                    <button 
                      onClick={handleSaveThreshold}
                      disabled={isThresholdSaving}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-xl transition-colors disabled:opacity-50"
                    >
                      {isThresholdSaving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {/* Driver/Helper Modal */}
      {(isDriverModalOpen || isHelperModalOpen) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-extrabold text-slate-900">Add New {isDriverModalOpen ? "Driver" : "Helper"}</h2>
            </div>
            <form onSubmit={isDriverModalOpen ? handleAddDriver : handleAddHelper} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Full Name *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Dela Cruz, Juan"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] outline-none font-bold text-slate-800"
                />
              </div>
              
              <div className="bg-blue-50 p-3 rounded-xl flex gap-3 text-blue-900">
                <AlertTriangle className="w-5 h-5 shrink-0 text-blue-700" />
                <p className="text-xs font-medium leading-relaxed">
                  Please use a consistent naming format (e.g. Last Name, First Name) to make reporting easier.
                </p>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsDriverModalOpen(false);
                    setIsHelperModalOpen(false);
                    setNewName("");
                  }}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-extrabold text-sm rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-[#1e3a8a] text-white font-extrabold text-sm rounded-xl hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : "Save to Database"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Truck Modal */}
      {isTruckModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-extrabold text-slate-900">{editingTruckId ? "Edit Truck" : "Add New Truck"}</h2>
            </div>
            <form onSubmit={handleAddTruck} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Plate Number *</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. ABC-1234"
                    value={truckPlate}
                    onChange={(e) => setTruckPlate(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] outline-none font-black text-slate-800 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Truck Unit *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CANTER"
                    value={truckUnit}
                    onChange={(e) => setTruckUnit(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] outline-none font-bold text-slate-800 uppercase"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Truck Owner *</label>
                <select
                  value={truckOwner}
                  onChange={(e) => setTruckOwner(e.target.value)}
                  className="w-full px-4 py-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] outline-none font-bold text-slate-800 bg-white"
                >
                  <option value="ALK Trucking">ALK Trucking</option>
                  <option value="Mindanao Logistics">Mindanao Logistics</option>
                  <option value="Third Party">Third Party</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsTruckModalOpen(false);
                    setEditingTruckId(null);
                    setTruckPlate("");
                    setTruckUnit("");
                    setTruckOwner("ALK Trucking");
                  }}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-extrabold text-sm rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-[#1e3a8a] text-white font-extrabold text-sm rounded-xl hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : "Save to Database"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-rose-700" />
                Authorize New Staff
              </h2>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Google Email Address *</label>
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="e.g. employee@gmail.com"
                  value={newAuthEmail}
                  onChange={(e) => setNewAuthEmail(e.target.value.toLowerCase())}
                  className="w-full px-4 py-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] outline-none font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Full Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={newAuthName}
                  onChange={(e) => setNewAuthName(e.target.value)}
                  className="w-full px-4 py-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] outline-none font-bold text-slate-800"
                />
              </div>
              
              <div className="bg-amber-50 p-3 rounded-xl flex gap-3 text-amber-900 mt-2">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-700" />
                <p className="text-xs font-medium leading-relaxed">
                  Only explicitly listed Google emails can bypass the security lockdown.
                </p>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserModalOpen(false);
                    setNewAuthEmail("");
                    setNewAuthName("");
                  }}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-extrabold text-sm rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-[#1e3a8a] text-white font-extrabold text-sm rounded-xl hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Granting...
                    </>
                  ) : "Grant Access"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Developer Restricted Modal */}
      {showDeveloperModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-6 shadow-sm border border-rose-200">
                <Lock className="w-8 h-8" />
              </div>
              <h2 className="font-black text-slate-900 text-xl mb-3 tracking-tight">ACCESS DENIED</h2>
              <p className="text-slate-600 text-sm font-bold mb-8 uppercase tracking-widest text-rose-600">
                ONLY THE DEVELOPER CAN ENABLE IT
              </p>
              <button
                onClick={() => setShowDeveloperModal(false)}
                className="w-full px-5 py-3 bg-slate-900 text-white font-extrabold text-sm rounded-xl hover:bg-slate-800 transition-colors shadow-md"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Archive Truck Warning Modal */}
      {isArchiveTruckModalOpen && truckToArchive && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <h2 className="font-extrabold text-slate-900">Archive Truck {truckToArchive.plateNo}?</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
                <p className="text-sm font-bold text-rose-800 leading-relaxed uppercase tracking-wide mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> 
                  Warning: Critical Action
                </p>
                <p className="text-xs font-medium text-rose-700 leading-relaxed">
                  Are you absolutely sure you want to archive this truck? Archiving it means it will no longer appear in new trips. While it will not permanently delete historical data, it could severely disrupt connected data, maintenance records, and inventory transactions linked to this specific truck.
                </p>
                <p className="text-xs font-black text-rose-800 mt-3 uppercase">
                  Proceed with extreme caution!
                </p>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsArchiveTruckModalOpen(false);
                    setTruckToArchive(null);
                  }}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-extrabold text-sm rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleArchiveTruckConfirm}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-rose-600 text-white font-extrabold text-sm rounded-xl hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Archiving...
                    </>
                  ) : "Archive Truck"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
