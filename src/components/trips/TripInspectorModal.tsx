"use client";

import React from "react";
import { X, Printer, Check, MapPin, Truck, User, Calendar, CreditCard, DollarSign, Loader2, Map } from "lucide-react";
import dynamic from "next/dynamic";
import { Trip, calculateTripTotals } from "@/lib/trips-store";
import { formatDateLong } from "@/lib/utils";

const DynamicRouteMap = dynamic(() => import("./RouteMap"), { 
  ssr: false, 
  loading: () => (
    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-400 rounded-lg">
      <Loader2 className="w-5 h-5 animate-spin mr-2" />
      Loading Map Engine...
    </div>
  )
});

interface TripInspectorModalProps {
  trip: Trip | null;
  onClose: () => void;
  onPrint?: (trip: Trip) => void;
}

export default function TripInspectorModal({ trip, onClose, onPrint }: TripInspectorModalProps) {
  const [routeGeometry, setRouteGeometry] = React.useState<[number, number][]>([]);
  const [isMapLoading, setIsMapLoading] = React.useState(false);

  React.useEffect(() => {
    if (!trip) {
      setRouteGeometry([]);
      return;
    }
    
    let isMounted = true;
    
    const fetchRoute = async () => {
      const origin = trip.origin || "CDO";
      const destination = trip.destination;
      if (!destination) return;
      
      setIsMapLoading(true);
      try {
        const CITY_ALIASES: Record<string, string> = {
          "CDO": "Cagayan de Oro",
          "GENSAN": "General Santos City",
          "DVO": "Davao City",
          "ZAMBO": "Zamboanga City",
          "BUTUAN": "Butuan City",
          "ILIGAN": "Iligan City",
          "SURIGAO": "Surigao City",
        };

        const getCoordinates = async (city: string) => {
          const normalizedCity = CITY_ALIASES[city.toUpperCase()] || city;
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(normalizedCity)},+Philippines&format=json&limit=1`);
          const data = await res.json();
          if (data && data.length > 0) {
            return { lat: data[0].lat, lon: data[0].lon };
          }
          throw new Error(`Location not found: ${city}`);
        };

        const p1 = await getCoordinates(origin);
        const p2 = await getCoordinates(destination);

        const res = await fetch(`/api/routing?originLon=${p1.lon}&originLat=${p1.lat}&destLon=${p2.lon}&destLat=${p2.lat}`);
        if (!res.ok) throw new Error("Routing API failed");
        
        const data = await res.json();
        if (data.routes && data.routes.length > 0 && isMounted) {
          const route = data.routes[0];
          if (route.geometry && route.geometry.coordinates) {
            const coords = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
            setRouteGeometry(coords);
          }
        }
      } catch (err) {
        console.error("Failed to load map for inspector:", err);
      } finally {
        if (isMounted) setIsMapLoading(false);
      }
    };

    fetchRoute();
    return () => { isMounted = false; };
  }, [trip]);

  if (!trip) return null;

  const { totalExpense, remainder } = calculateTripTotals(trip);
  const compDate = trip.completedAt
    ? formatDateLong(trip.completedAt)
    : formatDateLong(trip.dateOfTravel);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto cursor-pointer no-print"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 cursor-default"
      >
        
        {/* Autoworx Inspector Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#00193c] text-white text-[10px] font-extrabold uppercase rounded">
                Inspector
              </span>
              <h3 className="text-base font-extrabold text-gray-900 font-manrope">
                Trip Record Inspector: {trip.seqNo || trip.id}
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Detailed parameters, travel expenses, and route metadata (ALK Standard Layout)
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Row 1: Key Financial Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-blue-50/70 border border-blue-200 p-3 rounded-lg">
              <span className="text-[10px] font-extrabold text-blue-900 uppercase block tracking-wider">Freight Revenue</span>
              <span className="text-base font-black text-[#00193c] font-mono mt-0.5 block">
                ₱{Number(trip.rate || 0).toLocaleString()}.00
              </span>
            </div>

            <div className="bg-rose-50/70 border border-rose-200 p-3 rounded-lg">
              <span className="text-[10px] font-extrabold text-rose-900 uppercase block tracking-wider">Total Expenses</span>
              <span className="text-base font-black text-rose-700 font-mono mt-0.5 block">
                ₱{totalExpense.toLocaleString()}.00
              </span>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-lg">
              <span className="text-[10px] font-extrabold text-emerald-900 uppercase block tracking-wider">Net Remainder</span>
              <span className="text-base font-black text-emerald-800 font-mono mt-0.5 block">
                ₱{remainder.toLocaleString()}.00
              </span>
            </div>
          </div>

          {/* Row 2: Trip Parameters & Vehicle Info */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-gray-900 border-b border-gray-200 pb-1">
                <Truck className="w-4 h-4 text-[#00193c]" />
                <span>Vehicle & Crew Details</span>
              </div>
              <p><span className="text-gray-500 font-medium">Truck Unit:</span> <strong>{trip.unit}</strong></p>
              <p><span className="text-gray-500 font-medium">Plate Number:</span> <strong className="font-mono">{trip.plateNo}</strong></p>
              <p><span className="text-gray-500 font-medium">Driver:</span> <strong>{trip.driver}</strong></p>
              <p><span className="text-gray-500 font-medium">Helper:</span> {trip.helper1 || "None"}</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-gray-900 border-b border-gray-200 pb-1">
                <MapPin className="w-4 h-4 text-[#00193c]" />
                <span>Customer & Route Details</span>
              </div>
              <p><span className="text-gray-500 font-medium">Customer:</span> <strong>{trip.customerName}</strong></p>
              <p><span className="text-gray-500 font-medium">Route:</span> <strong>{trip.origin || "CDO"} → {trip.destination} {trip.distance && `(${trip.distance})`}</strong></p>
              <p><span className="text-gray-500 font-medium">Date:</span> <strong>{compDate}</strong></p>
              <p><span className="text-gray-500 font-medium">Status:</span> 
                <span className={`ml-1.5 px-2 py-0.5 text-[9px] font-extrabold rounded uppercase ${
                  trip.status === "Active" ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"
                }`}>
                  {trip.status}
                </span>
              </p>
            </div>
          </div>

          {/* Row 3: Live Map Routing Visualization */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <Map className="w-4 h-4 text-[#00193c]" />
              <span>Live Route Visualization</span>
            </h4>
            <div className="w-full h-[220px] rounded-lg border border-gray-200 overflow-hidden relative bg-slate-50 shadow-inner">
              {isMapLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-xs font-bold text-slate-400 bg-slate-100/50">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-2" />
                  Calculating optimal route via ORS/Mapbox...
                </div>
              ) : routeGeometry.length > 0 ? (
                <DynamicRouteMap routeGeometry={routeGeometry} />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-400">
                  Route data unavailable or failed to load.
                </div>
              )}
            </div>
          </div>

          {/* Row 4: Itemized Expenses Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-[#00193c]" />
              <span>Travel & Expenses ({trip.expenses.length} Items)</span>
            </h4>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold uppercase text-[10px]">
                    <th className="p-2">Category</th>
                    <th className="p-2">Description</th>
                    <th className="p-2 text-right">Amount</th>
                    <th className="p-2">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 font-mono text-[11px]">
                  {trip.expenses.map((e, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-2 font-bold text-[#00193c] font-sans">{e.category}</td>
                      <td className="p-2 text-gray-700 font-sans">{e.description || "Operational expense"}</td>
                      <td className="p-2 text-right font-bold text-rose-700">₱{Number(e.amount || 0).toLocaleString()}.00</td>
                      <td className="p-2 text-gray-600 font-sans">{e.remarks || "—"}</td>
                    </tr>
                  ))}
                  {trip.expenses.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-gray-400 italic font-sans">No expenses recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Row 4: Remarks & Operational Notes */}
          {trip.notes && (
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg space-y-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Operational Notes</span>
              <p className="text-xs text-gray-800 italic whitespace-pre-wrap">{trip.notes}</p>
            </div>
          )}

        </div>

        {/* Action Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          {onPrint ? (
            <button
              onClick={() => {
                onClose();
                onPrint(trip);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#00193c] hover:bg-blue-900 text-white font-bold text-xs rounded-lg transition-all cursor-pointer no-print"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Monitoring Form</span>
            </button>
          ) : <div />}

          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
}
