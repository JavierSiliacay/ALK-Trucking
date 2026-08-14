"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Undo, Check, Loader2, X } from "lucide-react";
import dynamic from "next/dynamic";
import { Trip, ExpenseItem, useTrips, DEFAULT_EXPENSE_CATEGORIES } from "@/lib/trips-store";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { LocationAutocomplete } from "@/components/ui/LocationAutocomplete";

const DynamicRouteMap = dynamic(() => import("./RouteMap"), { 
  ssr: false, 
  loading: () => (
    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-400 rounded">
      Map Loading...
    </div>
  )
});

interface TripFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tripData: Omit<Trip, "id" | "createdAt" | "status"> | Trip) => void | Promise<void>;
  initialTrip?: Trip | null;
}

const EXPENSE_CATEGORIES = DEFAULT_EXPENSE_CATEGORIES;

export default function TripFormModal({ isOpen, onClose, onSave, initialTrip }: TripFormModalProps) {
  const { masterData, trips } = useTrips();

  const uniqueCustomers = Array.from(new Set(trips.map((t) => t.customerName).filter(Boolean)));
  const uniqueDestinations = Array.from(new Set(trips.map((t) => t.destination).filter(Boolean)));
  const uniqueOrigins = Array.from(new Set(trips.map((t) => t.origin).filter(Boolean)));

  const [seqNo, setSeqNo] = useState("");
  const [dateOfTravel, setDateOfTravel] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [owner, setOwner] = useState("ALK Trucking");
  const [unit, setUnit] = useState("");
  const [plateNo, setPlateNo] = useState("");
  const [driver, setDriver] = useState("");
  const [helper1, setHelper1] = useState("");
  const [helper2, setHelper2] = useState("");

  const [origin, setOrigin] = useState("CDO");
  const [destination, setDestination] = useState("");
  const [distance, setDistance] = useState("310 km");

  const [gatePassNo, setGatePassNo] = useState("");
  const [gatePassDate, setGatePassDate] = useState("");
  const [rate, setRate] = useState<number | "">(20000);
  const [notes, setNotes] = useState("");

  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [lastDeletedExpense, setLastDeletedExpense] = useState<{ expense: ExpenseItem; index: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [routeGeometry, setRouteGeometry] = useState<[number, number][]>([]);
  const [alternativeRoutes, setAlternativeRoutes] = useState<any[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

  useEffect(() => {
    setLastDeletedExpense(null);
    if (initialTrip) {
      setSeqNo(initialTrip.seqNo || "");
      setDateOfTravel(initialTrip.dateOfTravel || "");
      setCustomerName(initialTrip.customerName || "");
      setOwner(initialTrip.owner || "ALK Trucking");
      setUnit(initialTrip.unit || "");
      setPlateNo(initialTrip.plateNo || "");
      setDriver(initialTrip.driver || "");
      setHelper1(initialTrip.helper1 || "");
      setHelper2(initialTrip.helper2 || "");
      setOrigin(initialTrip.origin || "CDO");
      setDestination(initialTrip.destination || "");
      setDistance(initialTrip.distance || "");
      setGatePassNo(initialTrip.gatePassNo || "");
      setGatePassDate(initialTrip.gatePassDate || "");
      setRate(initialTrip.rate || 0);
      setNotes(initialTrip.notes || "");
      setExpenses(initialTrip.expenses || []);
    } else {
      
      setSeqNo("");
      setDateOfTravel("");
      setCustomerName("");
      setOwner("ALK Trucking");

      setUnit("");
      setPlateNo("");

      setDriver("");
      setHelper1("");
      setHelper2("");
      setOrigin("");
      setDestination("");
      setDistance("");
      setGatePassNo("");
      setGatePassDate("");
      setRate("");
      setNotes("");
      setExpenses([]);
      setAlternativeRoutes([]);
      setSelectedRouteIndex(0);
    }
  }, [initialTrip, isOpen, masterData]);

  if (!isOpen) return null;

  const totalExpense = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const remainder = (Number(rate) || 0) - totalExpense;

  const selectedTruck = masterData.trucks.find(t => t.unit === unit);
  let truckClass = selectedTruck?.truckClass;
  
  // Fallback if truckClass isn't saved in the DB yet
  if (!truckClass && unit) {
    const unitUpper = unit.toUpperCase();
    if (unitUpper.includes("CANTER")) truckClass = "CANTER";
    else if (unitUpper.includes("FORWARD")) truckClass = "FORWARD";
    else if (unitUpper.includes("WINGVAN") || unitUpper.includes("FUSO") || unitUpper.includes("HINO")) truckClass = "WINGVAN";
  }

  const parsedDistance = parseFloat(distance) || 0;
  
  let estimatedLiters = 0;
  let ratioDivisor = 0;
  
  if (truckClass === "CANTER") ratioDivisor = 5;
  else if (truckClass === "FORWARD") ratioDivisor = 4;
  else if (truckClass === "WINGVAN") ratioDivisor = 3;

  if (ratioDivisor > 0) {
    estimatedLiters = parsedDistance / ratioDivisor;
  }

  const handleTruckSelect = (unitName: string) => {
    setUnit(unitName);
    const found = masterData.trucks.find((t) => t.unit === unitName);
    if (found) {
      setPlateNo(found.plateNo);
      if (found.owner) setOwner(found.owner);
    }
  };

  const handleExpenseChange = (index: number, field: keyof ExpenseItem, value: any) => {
    const updated = [...expenses];
    updated[index] = { ...updated[index], [field]: value };
    setExpenses(updated);
  };

  const handleAddExpenseRow = () => {
    const newRow: ExpenseItem = {
      id: `exp_${Date.now()}`,
      category: EXPENSE_CATEGORIES[0],
      dateRequest: dateOfTravel,
      rsNo: "",
      description: "",
      amount: 0,
      remarks: "",
    };
    setExpenses([...expenses, newRow]);
  };

  const handleRemoveExpenseRow = (index: number) => {
    const itemToRemove = expenses[index];
    if (itemToRemove) {
      setLastDeletedExpense({ expense: itemToRemove, index });
    }
    setExpenses(expenses.filter((_, i) => i !== index));
  };

  const handleUndoDeleteExpense = () => {
    if (!lastDeletedExpense) return;
    const { expense, index } = lastDeletedExpense;
    const updated = [...expenses];
    updated.splice(Math.min(index, updated.length), 0, expense);
    setExpenses(updated);
    setLastDeletedExpense(null);
  };

  const getCoordinates = async (city: string) => {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)},+Philippines&format=json&limit=1`);
    const data = await res.json();
    if (data && data.length > 0) {
      return { lat: data[0].lat, lon: data[0].lon };
    }
    throw new Error(`Location not found: ${city}`);
  };

  const applyRoute = (route: any) => {
    const distKm = (route.distance / 1000).toFixed(1);
    setDistance(`${distKm} km`);
    
    // Extract geometry, OSRM GeoJSON is [lon, lat], Leaflet wants [lat, lon]
    if (route.geometry && route.geometry.coordinates) {
      const coords = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
      setRouteGeometry(coords);
    }
  };

  const calculateDistance = async () => {
    if (!origin || !destination) {
      alert("Please enter both origin and destination.");
      return;
    }
    setIsCalculatingDistance(true);
    try {
      const p1 = await getCoordinates(origin);
      const p2 = await getCoordinates(destination);

      const res = await fetch(`/api/routing?originLon=${p1.lon}&originLat=${p1.lat}&destLon=${p2.lon}&destLat=${p2.lat}`);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to calculate route");
      }
      
      const data = await res.json();

      if (data.routes && data.routes.length > 0) {
        setAlternativeRoutes(data.routes);
        setSelectedRouteIndex(0);
        applyRoute(data.routes[0]);
      } else {
        throw new Error("Route not found between these cities");
      }
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Failed to calculate distance");
    } finally {
      setIsCalculatingDistance(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const d = driver.trim().toLowerCase();
    const h1 = helper1.trim().toLowerCase();
    const h2 = helper2.trim().toLowerCase();

    if (h1 && h2 && h1 === h2) {
      alert("Helper 1 and Helper 2 cannot be the same person.");
      return;
    }
    if (d && (d === h1 || d === h2)) {
      alert("The Assigned Driver cannot also be assigned as a Helper.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...(initialTrip ? { ...initialTrip } : {}),
        seqNo: seqNo || `TRP-${Date.now()}`,
        dateOfTravel,
        customerName,
        owner: owner || "ALK Trucking",
        unit,
        plateNo,
        driver,
        helper1,
        helper2,
        origin,
        destination,
        distance,
        gatePassNo,
        gatePassDate,
        rate: Number(rate) || 0,
        expenses,
        notes,
      };

      await onSave(payload as any);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-300 w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Autoworx-style Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 font-manrope">
              {initialTrip ? "Edit Trip / Purchasing Record" : "Add Trip / Expense Record"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              ALK Trucking Fleet Trip & Expense Monitoring
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Calculation Banner (Autoworx Style) */}
        <div className="bg-blue-50/80 text-[#00193c] px-6 py-2.5 shrink-0 flex flex-wrap items-center justify-between gap-4 font-mono text-xs border-b border-blue-200">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00193c] text-[18px]">calculate</span>
            <span className="font-bold text-[#00193c]">Totals Summary:</span>
          </div>
          <div className="flex items-center gap-6">
            <div>
              <span className="text-slate-600 mr-1 font-sans font-semibold">Freight Revenue:</span>
              <span className="font-extrabold text-emerald-800">₱{(Number(rate) || 0).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-600 mr-1 font-sans font-semibold">Total Expenses:</span>
              <span className="font-extrabold text-rose-700">₱{totalExpense.toLocaleString()}</span>
            </div>
            <div className="bg-white px-2.5 py-0.5 rounded border border-blue-300 shadow-xs">
              <span className="text-slate-700 font-sans font-bold mr-1">Net Remainder:</span>
              <span className="font-extrabold text-[#00193c] text-sm">₱{remainder.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Form Body (Autoworx 2-Column Standard Grid Layout) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Top 2-Column Form Fields (Identical to Autoworx Purchasing Form) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3.5">
            
            {/* Left Column */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-gray-700 font-semibold text-xs uppercase block">
                  Date Request <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={dateOfTravel}
                  onChange={(e) => setDateOfTravel(e.target.value)}
                  onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                  className="w-full h-9 px-3 bg-white border border-gray-300 rounded text-sm text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-700 font-semibold text-xs uppercase block">
                  Sequence # <span className="text-gray-400 text-[10px] normal-case ml-1">(Auto-generated)</span>
                </label>
                <input
                  type="text"
                  disabled
                  placeholder="Assigned upon saving"
                  value={seqNo}
                  className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded text-sm font-mono font-bold text-gray-500 cursor-not-allowed outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-700 font-semibold text-xs uppercase block">
                  Customer / Client Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  list="customer-list"
                  placeholder="e.g. WEST-O"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-gray-300 rounded text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <datalist id="customer-list">
                  {uniqueCustomers.map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-gray-700 font-semibold text-xs uppercase block">
                    Gate Pass # <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 015975"
                    value={gatePassNo}
                    onChange={(e) => setGatePassNo(e.target.value)}
                    className="w-full h-9 px-3 bg-white border border-gray-300 rounded text-sm font-mono font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-700 font-semibold text-xs uppercase block">
                    Gate Pass Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={gatePassDate}
                    onChange={(e) => setGatePassDate(e.target.value)}
                    onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                    className="w-full h-9 px-3 bg-white border border-gray-300 rounded text-sm text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1 relative">
                <div className="flex justify-between items-end mb-1">
                  <label className="text-gray-700 font-semibold text-xs uppercase block">
                    Route & Distance <span className="text-red-500">*</span>
                  </label>
                  <button 
                    type="button" 
                    onClick={calculateDistance} 
                    disabled={isCalculatingDistance}
                    className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-bold hover:bg-blue-100 disabled:opacity-50 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {isCalculatingDistance ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    {isCalculatingDistance ? 'CALCULATING...' : 'CALCULATE DISTANCE'}
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <LocationAutocomplete
                    value={origin}
                    onChange={setOrigin}
                    placeholder="e.g. Cagayan de Oro"
                    required
                  />
                  <span className="text-gray-400 font-bold text-sm">→</span>
                  <LocationAutocomplete
                    value={destination}
                    onChange={setDestination}
                    placeholder="e.g. Surigao City"
                    required
                  />
                  <input
                    type="text"
                    required
                    placeholder="0 km"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    className="w-24 h-9 px-2 bg-white border border-gray-300 rounded text-sm font-bold text-blue-700 focus:ring-2 focus:ring-blue-500 outline-none text-center shrink-0"
                    title="Distance in km"
                  />
                </div>
                {alternativeRoutes.length > 1 && (
                  <div className="flex gap-2 mt-2">
                    {alternativeRoutes.map((route, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedRouteIndex(idx);
                          applyRoute(route);
                        }}
                        className={`px-2 py-1 text-[10px] font-bold rounded border transition-colors cursor-pointer ${
                          selectedRouteIndex === idx
                            ? "bg-blue-100 text-blue-800 border-blue-300 shadow-sm"
                            : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        Route {idx + 1} ({(route.distance / 1000).toFixed(1)} km)
                      </button>
                    ))}
                  </div>
                )}

              </div>

              <div className="space-y-1">
                <label className="text-gray-700 font-semibold text-xs uppercase block">
                  Trip Rate (₱) <span className="text-red-500">*</span>
                </label>
                <CurrencyInput
                  required
                  placeholder="20,000"
                  value={rate}
                  onChange={(val) => setRate(val)}
                  className="w-full h-9 px-3 bg-white border border-gray-300 rounded text-sm font-mono font-bold text-emerald-800 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-gray-700 font-semibold text-xs uppercase block">
                    Truck Unit Model <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => handleTruckSelect(e.target.value)}
                    className="w-full h-9 px-3 bg-white border border-gray-300 rounded text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="" disabled>Select Truck...</option>
                    {masterData.trucks.map((t) => (
                      <option key={t.plateNo} value={t.unit}>
                        {t.unit} ({t.plateNo})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-gray-700 font-semibold text-xs uppercase block">
                    Plate Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AAX-4163"
                    value={plateNo}
                    onChange={(e) => setPlateNo(e.target.value)}
                    className="w-full h-9 px-3 bg-white border border-gray-300 rounded text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-700 font-semibold text-xs uppercase block">
                  Vehicle Owner <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ALK Trucking"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-gray-300 rounded text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-700 font-semibold text-xs uppercase block">
                  Assigned Driver <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  list="driver-list"
                  placeholder="e.g. ARA, R."
                  value={driver}
                  onChange={(e) => setDriver(e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-gray-300 rounded text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <datalist id="driver-list">
                  {masterData.drivers.map((d) => <option key={d} value={d} />)}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-gray-700 font-semibold text-xs uppercase block">
                    Helper 1 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="helper-list"
                    placeholder="e.g. Gomez, B."
                    value={helper1}
                    onChange={(e) => setHelper1(e.target.value)}
                    className="w-full h-9 px-3 bg-white border border-gray-300 rounded text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <datalist id="helper-list">
                    {masterData.helpers.map((h) => <option key={h} value={h} />)}
                  </datalist>
                </div>
                <div className="space-y-1">
                  <label className="text-gray-700 font-semibold text-xs uppercase block">
                    Helper 2 <span className="text-gray-400 text-[10px] normal-case ml-1">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    list="helper-list"
                    placeholder="e.g. Cruz, J."
                    value={helper2}
                    onChange={(e) => setHelper2(e.target.value)}
                    className="w-full h-9 px-3 bg-white border border-gray-300 rounded text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              
              {/* Fuel Estimator */}
              {estimatedLiters > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded px-3 py-2 flex items-center justify-between shadow-sm mt-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-700 text-[20px]">local_gas_station</span>
                    <div className="leading-tight">
                      <span className="font-bold text-[11px] text-emerald-900 uppercase block">Estimated Diesel Allocation</span>
                      <span className="text-[10px] text-emerald-700 font-medium">
                        Based on {parsedDistance} km ({truckClass} Ratio: 1L / {ratioDivisor}km)
                      </span>
                    </div>
                  </div>
                  <div className="text-right bg-white px-2 py-0.5 rounded border border-emerald-200 shadow-xs">
                    <span className="text-base font-black text-emerald-800 font-mono">
                      {estimatedLiters.toFixed(1)} <span className="text-[10px] font-bold text-emerald-600 font-sans">Liters</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Map Visualization Area */}
              <div className="w-full h-[180px] pt-1 mt-2">
                <DynamicRouteMap routeGeometry={routeGeometry} />
              </div>
              
              {origin && destination && (
                <div className="text-[10px] text-gray-500 text-center italic pt-1">
                  * For accurate distance (km) for this trip, <a href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">click here to verify in Google Maps</a>.
                </div>
              )}
            </div>

          </div>

          {/* Autoworx Multi-Item Purchased Expenses Breakdown Section */}
          <div className="space-y-2.5 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="text-gray-900 font-bold text-xs uppercase block">
                  Purchased Expenses / Items <span className="text-red-500">*</span>
                </label>
                {lastDeletedExpense && (
                  <button
                    type="button"
                    onClick={handleUndoDeleteExpense}
                    className="flex items-center gap-1 px-2 py-0.5 text-[11px] text-amber-700 hover:text-amber-800 hover:bg-amber-50 font-bold rounded cursor-pointer transition-colors"
                  >
                    <Undo className="w-3 h-3" /> Undo Delete ({lastDeletedExpense.expense.category})
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={handleAddExpenseRow}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-white text-blue-700 border border-blue-300 hover:bg-blue-50 rounded cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Expense Item
              </button>
            </div>

            {/* Dynamic Items Table Rows (Identical to Autoworx System) */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {expenses.map((exp, index) => (
                <div 
                  key={exp.id || index} 
                  className="flex gap-2 items-center group"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddExpenseRow();
                      setTimeout(() => {
                        document.getElementById(`expense-desc-${expenses.length}`)?.focus();
                      }, 50);
                    }
                  }}
                >
                  
                  {/* Category Dropdown or Input */}
                  <div className="w-[160px] shrink-0 relative flex items-center">
                    {EXPENSE_CATEGORIES.includes(exp.category) ? (
                      <select
                        value={exp.category}
                        onChange={(e) => handleExpenseChange(index, "category", e.target.value)}
                        className="w-full h-9 px-2.5 bg-white border border-gray-300 rounded text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="Custom">Custom...</option>
                      </select>
                    ) : (
                      <div className="relative w-full">
                        <input
                          type="text"
                          autoFocus
                          placeholder="Type custom category..."
                          value={exp.category === "Custom" ? "" : exp.category}
                          onChange={(e) => handleExpenseChange(index, "category", e.target.value)}
                          className="w-full h-9 px-2.5 pr-6 bg-white border border-gray-300 rounded text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleExpenseChange(index, "category", EXPENSE_CATEGORIES[0])}
                          className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 w-5 h-5 flex items-center justify-center font-bold text-sm"
                          title="Back to list"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Description Input */}
                  <div className="flex-1">
                    <input
                      id={`expense-desc-${index}`}
                      type="text"
                      placeholder="Expense item description"
                      value={exp.description}
                      onChange={(e) => handleExpenseChange(index, "description", e.target.value)}
                      className="w-full h-9 px-3 bg-white border border-gray-300 rounded text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  {/* Amount Input */}
                  <div className="w-[120px] relative shrink-0">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-xs">₱</span>
                    <CurrencyInput
                      placeholder="0.00"
                      value={exp.amount === 0 ? "" : exp.amount}
                      onChange={(val) => handleExpenseChange(index, "amount", val === "" ? 0 : val)}
                      className="w-full h-9 pl-6 pr-2 bg-white border border-gray-300 rounded text-xs font-mono font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none text-right"
                    />
                  </div>

                  {/* Remarks Input */}
                  <div className="flex-1 max-w-[150px]">
                    <input
                      type="text"
                      placeholder="Remarks..."
                      value={exp.remarks || ""}
                      onChange={(e) => handleExpenseChange(index, "remarks", e.target.value)}
                      className="w-full h-9 px-3 bg-white border border-gray-300 rounded text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  {/* Delete Row Button */}
                  {expenses.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveExpenseRow(index)}
                      className="h-9 w-9 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded opacity-70 group-hover:opacity-100 transition-opacity shrink-0 cursor-pointer"
                      title="Remove expense row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Total Expense Summary Row */}
            <div className="flex justify-end pt-2 border-t border-gray-200 mt-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-600 uppercase">Total Expenses Amount:</span>
                <span className="text-sm font-black text-rose-700 font-mono">
                  ₱{totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Remarks / Operational Notes */}
          <div className="space-y-1 pt-1">
            <label className="text-gray-700 font-semibold text-xs uppercase block">Remarks / Notes</label>
            <textarea
              placeholder="Any operational or trip notes (Optional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-14 p-3 bg-white border border-gray-300 rounded text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          {/* Autoworx Action Footer Buttons */}
          <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-[#00193c] hover:bg-blue-900 text-white rounded font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{isSaving ? "Saving..." : (initialTrip ? "Update Record" : "Save Trip Record")}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
