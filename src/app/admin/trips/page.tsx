"use client";

import React, { useState } from "react";
import { useTrips, Trip, calculateTripTotals } from "@/lib/trips-store";
import { formatDateLong } from "@/lib/utils";
import TripFormModal from "@/components/trips/TripFormModal";
import DigitalPaperForm from "@/components/trips/DigitalPaperForm";
import TripInspectorModal from "@/components/trips/TripInspectorModal";
import { X } from "lucide-react";

export default function TripsPage() {
  const {
    trips,
    activeTrips,
    completedTrips,
    isLoaded,
    addTrip,
    updateTrip,
    markAsCompleted,
    revertToActive,
    deleteTrip,
  } = useTrips();

  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [justSavedTripId, setJustSavedTripId] = useState<string | null>(null);
  const [viewingPaperTrip, setViewingPaperTrip] = useState<Trip | null>(null);
  const [inspectingTrip, setInspectingTrip] = useState<Trip | null>(null);
  const [confirmCompleteTrip, setConfirmCompleteTrip] = useState<Trip | null>(null);
  const [confirmDeleteTrip, setConfirmDeleteTrip] = useState<Trip | null>(null);
  const [confirmRevertTrip, setConfirmRevertTrip] = useState<Trip | null>(null);
  const [completionDate, setCompletionDate] = useState(new Date().toISOString().split("T")[0]);

  if (!isLoaded) {
    return (
      <div className="p-10 text-center text-slate-400 font-semibold">
        Loading trips...
      </div>
    );
  }

  const filterList = (list: Trip[]) => {
    if (!search.trim()) return list;
    const tokens = search.toLowerCase().trim().split(/\s+/).filter(Boolean);

    return list.filter((t) => {
      const searchableBlob = [
        t.id,
        t.seqNo || "",
        t.unit || "",
        t.plateNo || "",
        t.driver || "",
        t.helper1 || "",
        t.helper2 || "",
        t.customerName || "",
        t.origin || "",
        t.destination || "",
        t.gatePassNo || "",
        t.status || "",
        `₱${Number(t.rate || 0).toLocaleString()}`,
        t.expenses.map((e) => `${e.category} ${e.description} ${e.remarks} ₱${e.amount}`).join(" ")
      ].join(" ").toLowerCase();

      return tokens.every((token) => searchableBlob.includes(token));
    });
  };

  const filteredActive = filterList(activeTrips);
  const filteredCompleted = filterList(completedTrips);

  const handleConfirmComplete = () => {
    if (confirmCompleteTrip) {
      markAsCompleted(confirmCompleteTrip.id, completionDate);
      setConfirmCompleteTrip(null);
    }
  };

  const handleConfirmRevert = () => {
    if (confirmRevertTrip) {
      revertToActive(confirmRevertTrip.id);
      setConfirmRevertTrip(null);
    }
  };

  const handleDeleteTrip = () => {
    if (confirmDeleteTrip) {
      deleteTrip(confirmDeleteTrip.id);
      setConfirmDeleteTrip(null);
    }
  };

  return (
    <div className="p-6 max-w-[1440px] mx-auto w-full space-y-6">

      {/* Page Title & Primary Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4 no-print">
        <div>
          <h2 className="font-extrabold text-2xl text-[#00193c] font-manrope">Trips Management</h2>
          <p className="text-[#43474f] text-xs mt-0.5">Oversee and coordinate active fleet shipments for ALK Trucking Services.</p>
        </div>

        {/* Large Primary Add Trip Button */}
        <button
          onClick={() => {
            setEditingTrip(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#00193c] hover:bg-[#002d62] text-white font-extrabold text-xs rounded-xl shadow-md hover:scale-[1.01] active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Add Trip</span>
        </button>
      </div>

      {/* DEDICATED TABLE CONTROL TOOLBAR (HIGH-VISIBILITY SEARCH & TABS) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 bg-slate-50 p-3 rounded-2xl border border-slate-200 shadow-2xs no-print">

        {/* Prominent High-Visibility Search Bar (Primary Staff Focal Point) */}
        <div className="relative w-full sm:w-[400px]">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Sequence #, Driver, Truck Unit, Plate, Customer, Route..."
            className="w-full pl-10 pr-9 py-2.5 bg-white border-2 border-slate-300 focus:border-[#00193c] rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#00193c]/20 transition-all shadow-2xs"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded-full"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tab Navigation (Active / Completed) */}
        <div className="flex bg-[#e5e8eb] p-1 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab("active")}
            className={`px-5 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${activeTab === "active"
                ? "bg-white text-[#00193c] shadow-xs"
                : "text-[#43474f] hover:text-[#00193c]"
              }`}
          >
            Active Trips ({activeTrips.length})
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`px-5 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${activeTab === "completed"
                ? "bg-white text-[#00193c] shadow-xs"
                : "text-[#43474f] hover:text-[#00193c]"
              }`}
          >
            Completed Trips ({completedTrips.length})
          </button>
        </div>
      </div>

      {/* ACTIVE TRIPS TABLE */}
      {activeTab === "active" && (
        <div className="bg-white rounded-xl border border-[#c4c6d1] overflow-hidden shadow-sm no-print">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f1f4f7] border-b border-[#c4c6d1]">
                  <th className="px-6 py-4 font-bold text-[#00193c]">Sequence #</th>
                  <th className="px-6 py-4 font-bold text-[#00193c]">Date</th>
                  <th className="px-6 py-4 font-bold text-[#00193c]">Truck / Plate</th>
                  <th className="px-6 py-4 font-bold text-[#00193c]">Crew</th>
                  <th className="px-6 py-4 font-bold text-[#00193c]">Route (A → B)</th>
                  <th className="px-6 py-4 font-bold text-[#00193c]">Customer</th>
                  <th className="px-6 py-4 font-bold text-[#00193c]">Status</th>
                  <th className="px-6 py-4 font-bold text-[#00193c] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c4c6d1]">
                {filteredActive.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setInspectingTrip(t)}
                    className={`transition-all duration-1000 cursor-pointer group ${
                      justSavedTripId === t.id 
                        ? 'bg-blue-100 ring-2 ring-blue-500 ring-inset shadow-[inset_0_0_15px_rgba(59,130,246,0.3)]' 
                        : 'hover:bg-blue-50/60'
                    }`}
                    title="Click to view detailed Trip Inspector modal"
                  >
                    <td className="px-6 py-5 font-mono font-extrabold text-[#00193c] group-hover:underline">{t.seqNo || t.id}</td>
                    <td className="px-6 py-5 text-[#181c1e]">{formatDateLong(t.dateOfTravel)}</td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-[#181c1e]">{t.unit}</span>
                        <span className="text-[11px] font-mono text-slate-500">{t.plateNo}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#181c1e]">{t.driver}</span>
                        <span className="text-[11px] text-slate-500">H: {[t.helper1, t.helper2].filter(Boolean).join(", ") || "None"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-bold text-[#181c1e]">
                      <div className="flex flex-col">
                        <span>{t.origin || "CDO"} → {t.destination}</span>
                        {t.distance && <span className="text-[11px] font-mono text-slate-500 font-normal">{t.distance}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-5 font-semibold text-[#181c1e]">{t.customerName}</td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1 bg-amber-100 text-amber-900 text-xs font-extrabold rounded-full uppercase">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewingPaperTrip(t)}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
                          title="View Digital Form"
                        >
                          <span className="material-symbols-outlined text-[20px]">visibility</span>
                        </button>
                        <button
                          onClick={() => {
                            setEditingTrip(t);
                            setIsFormOpen(true);
                          }}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
                          title="Edit Trip Record"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button
                          onClick={() => setViewingPaperTrip(t)}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
                          title="Print Form"
                        >
                          <span className="material-symbols-outlined text-[20px]">print</span>
                        </button>
                        <button
                          onClick={() => setConfirmDeleteTrip(t)}
                          className="p-2 hover:bg-red-100 rounded-lg text-red-500 transition-colors cursor-pointer"
                          title="Delete Trip"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>

                        {/* Large Green Mark Completed Button */}
                        <button
                          onClick={() => {
                            setCompletionDate(new Date().toISOString().split("T")[0]);
                            setConfirmCompleteTrip(t);
                          }}
                          className="ml-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs rounded-lg transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
                        >
                          Mark Completed
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredActive.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                      No active trips found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* COMPLETED TRIPS TABLE (NO ARCHIVE BUTTON - SERVES AS AUTOMATIC ARCHIVE) */}
      {activeTab === "completed" && (
        <div className="bg-white rounded-xl border border-[#c4c6d1] overflow-hidden shadow-sm no-print">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f1f4f7] border-b border-[#c4c6d1]">
                  <th className="px-6 py-4 font-bold text-[#00193c]">Completed Date</th>
                  <th className="px-6 py-4 font-bold text-[#00193c]">Trip Number</th>
                  <th className="px-6 py-4 font-bold text-[#00193c]">Truck / Plate</th>
                  <th className="px-6 py-4 font-bold text-[#00193c]">Driver</th>
                  <th className="px-6 py-4 font-bold text-[#00193c]">Customer</th>
                  <th className="px-6 py-4 font-bold text-[#00193c]">Route</th>
                  <th className="px-6 py-4 font-bold text-[#00193c] text-right">Total Cost</th>
                  <th className="px-6 py-4 font-bold text-[#00193c] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c4c6d1]">
                {filteredCompleted.map((t) => {
                  const { totalExpense } = calculateTripTotals(t);
                  const displayDate = t.completedAt ? formatDateLong(t.completedAt) : formatDateLong(t.dateOfTravel);
                  return (
                    <tr
                      key={t.id}
                      onClick={() => setInspectingTrip(t)}
                      className="hover:bg-blue-50/60 transition-colors cursor-pointer group"
                      title="Click to view detailed Trip Inspector modal"
                    >
                      <td className="px-6 py-5 text-[#181c1e]">{displayDate}</td>
                      <td className="px-6 py-5 font-mono font-extrabold text-[#00193c] group-hover:underline">{t.seqNo || t.id}</td>
                      <td className="px-6 py-5 font-bold text-[#181c1e]">{t.unit} ({t.plateNo})</td>
                      <td className="px-6 py-5 font-semibold text-[#181c1e]">{t.driver}</td>
                      <td className="px-6 py-5 text-[#181c1e]">{t.customerName}</td>
                      <td className="px-6 py-5 text-[#181c1e]">
                        <div className="flex flex-col">
                          <span className="font-bold">{t.origin || "CDO"} → {t.destination}</span>
                          {t.distance && <span className="text-[11px] font-mono text-slate-500">{t.distance}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right font-mono font-extrabold text-rose-700">₱{totalExpense.toLocaleString()}</td>
                      <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setConfirmRevertTrip(t)}
                            className="p-2 hover:bg-amber-100 rounded-lg text-amber-600 transition-colors cursor-pointer"
                            title="Revert to Active Trip"
                          >
                            <span className="material-symbols-outlined text-[20px]">undo</span>
                          </button>
                          <button
                            onClick={() => setViewingPaperTrip(t)}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
                            title="View Form"
                          >
                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                          </button>
                          <button
                            onClick={() => setViewingPaperTrip(t)}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
                            title="Print Form"
                          >
                            <span className="material-symbols-outlined text-[20px]">print</span>
                          </button>
                          <button
                            onClick={() => setConfirmDeleteTrip(t)}
                            className="p-2 hover:bg-red-100 rounded-lg text-red-500 transition-colors cursor-pointer"
                            title="Delete Trip"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredCompleted.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                      No completed trips recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal View Digital Form */}
      {viewingPaperTrip && (
        <div
          onClick={() => setViewingPaperTrip(null)}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto cursor-pointer print:p-0 print:bg-white print:static print:overflow-visible print:block"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl max-h-[95vh] overflow-y-auto print:max-h-none print:overflow-visible print:w-full print:max-w-none cursor-default"
          >
            <DigitalPaperForm trip={viewingPaperTrip} onClose={() => setViewingPaperTrip(null)} />
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      <TripFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTrip(null);
        }}
        onSave={async (data) => {
          let savedTrip: any;
          if (editingTrip) {
            await updateTrip(data as Trip);
            savedTrip = data;
          } else {
            savedTrip = await addTrip(data as any);
          }
          
          if (savedTrip && savedTrip.id) {
            setJustSavedTripId(savedTrip.id);
            setTimeout(() => setJustSavedTripId(null), 5000);
          }
        }}
        initialTrip={editingTrip}
      />

      {/* Mark Completed Confirmation Modal */}
      {confirmCompleteTrip && (
        <div className="fixed inset-0 z-50 bg-[#00193c]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[32px]">task_alt</span>
            </div>
            <h3 className="font-extrabold text-[#00193c] text-xl font-manrope">Mark Trip as Completed</h3>
            <p className="text-xs text-slate-500 mt-2">
              Confirm completion of trip <strong className="text-slate-800">{confirmCompleteTrip.seqNo || confirmCompleteTrip.id}</strong> ({confirmCompleteTrip.customerName}):
            </p>

            {/* Date Selection Box */}
            <div className="mt-5 text-left bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Completion Date *
              </label>
              <input
                type="date"
                required
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
                className="w-full h-11 px-3.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 bg-white outline-none focus:ring-2 focus:ring-[#00193c]/20"
              />
              <p className="text-[11px] text-slate-400 mt-1">Defaulted to today. You can select another date if needed.</p>
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setConfirmCompleteTrip(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold text-xs hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmComplete}
                className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
              >
                Yes, Mark Completed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revert to Active Confirmation Modal */}
      {confirmRevertTrip && (
        <div className="fixed inset-0 z-50 bg-[#00193c]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[32px]">settings_backup_restore</span>
            </div>
            <h3 className="font-extrabold text-[#00193c] text-xl font-manrope">Revert Trip to Active</h3>
            <p className="text-sm text-slate-500 mt-2">
              Are you sure you want to revert trip <strong className="text-slate-800">{confirmRevertTrip.seqNo || confirmRevertTrip.id}</strong> back to Active status?
            </p>
            <p className="text-xs text-amber-600 font-semibold mt-2">
              This will remove its completion date and move it back to the Active Trips queue.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setConfirmRevertTrip(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold text-xs hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRevert}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
              >
                Yes, Revert to Active
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteTrip && (
        <div className="fixed inset-0 z-50 bg-[#00193c]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[32px]">delete_forever</span>
            </div>
            <h3 className="font-extrabold text-[#00193c] text-xl font-manrope">Delete Trip Record</h3>
            <p className="text-sm text-slate-500 mt-2">
              Are you sure you want to permanently delete trip <strong className="text-slate-800">{confirmDeleteTrip.seqNo || confirmDeleteTrip.id}</strong>?
            </p>
            <p className="text-xs text-red-500 font-semibold mt-2">
              This action cannot be undone.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setConfirmDeleteTrip(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold text-xs hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTrip}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Autoworx Detailed Floating Inspector Modal */}
      <TripInspectorModal
        trip={inspectingTrip}
        onClose={() => setInspectingTrip(null)}
        onPrint={(t) => {
          setInspectingTrip(null);
          setViewingPaperTrip(t);
        }}
      />

    </div>
  );
}
