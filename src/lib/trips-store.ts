"use client";

import { useState, useEffect } from "react";

export interface ExpenseItem {
  id: string;
  category: string;
  dateRequest: string;
  rsNo: string;
  description: string;
  amount: number;
  remarks: string;
}

export interface Trip {
  id: string;
  seqNo: string;
  dateOfTravel: string;
  customerName: string;
  owner: string;
  unit: string;
  plateNo: string;
  driver: string;
  helper1: string;
  helper2: string;
  origin: string;
  destination: string;
  distance?: string;
  gatePassNo: string;
  gatePassDate: string;
  rate: number;
  expenses: ExpenseItem[];
  notes?: string;
  status: "Active" | "Completed";
  createdAt: string;
  completedAt?: string;
}

export interface MasterTruck {
  id: string;
  unit: string;
  plateNo: string;
  owner: string;
}

export interface MasterRoute {
  id: string;
  origin: string;
  destination: string;
  distance: string;
}

export interface MasterData {
  drivers: string[];
  helpers: string[];
  trucks: MasterTruck[];
  customers: string[];
  owners: string[];
  routes: MasterRoute[];
  expenseCategories: string[];
}

export const DEFAULT_EXPENSE_CATEGORIES = [
  "DIESEL",
  "DRIVER RATE",
  "HELPER 1 RATE",
  "HELPER 2 RATE",
  "ALLOWANCES",
  "STRIPPER",
  "MAINTENANCE",
  "CHARGE",
  "STICKER",
  "SOP",
];

const INITIAL_MASTER_DATA: MasterData = {
  drivers: ["ARA, R.", "Santos, Pedro", "Lim, Eduardo", "Reyes, Ramon", "Torres, Miguel", "Dela Cruz, Juan"],
  helpers: ["Gomez, B.", "Castro, Kevin", "Villanueva, Mark", "Soriano, Allen", "Ramos, Dennis"],
  trucks: [
    { id: "t1", unit: "CANTER", plateNo: "AAX-4163", owner: "ALK Trucking" },
    { id: "t2", unit: "ISUZU FORWARD", plateNo: "MAA-9120", owner: "ALK Trucking" },
    { id: "t3", unit: "FUSO SUPER GREAT", plateNo: "KKB-3381", owner: "Mindanao Logistics" },
    { id: "t4", unit: "HINO 500", plateNo: "NDB-5521", owner: "ALK Trucking" },
  ],
  customers: ["NEST-O", "Mindanao Fresh Produce Inc.", "CDO Builders Supply Corp.", "Cagayan Agri Ventures", "Northern Mindanao Trading"],
  owners: ["ALK Trucking", "Mindanao Logistics", "Trans-Mindanao Hauling"],
  routes: [
    { id: "r1", origin: "CDO", destination: "SURIGAO", distance: "310 km" },
    { id: "r2", origin: "CDO", destination: "Iligan City", distance: "88 km" },
    { id: "r3", origin: "CDO", destination: "Davao City", distance: "265 km" },
    { id: "r4", origin: "CDO", destination: "Bukidnon", distance: "120 km" },
  ],
  expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
};

const INITIAL_TRIPS: Trip[] = [
  {
    id: "TRP-001",
    seqNo: "JLY-056-26",
    dateOfTravel: "2026-07-27",
    customerName: "NEST-O",
    owner: "ALK Trucking",
    unit: "CANTER",
    plateNo: "AAX-4163",
    driver: "ARA, R.",
    helper1: "Gomez, B.",
    helper2: "",
    origin: "CDO",
    destination: "SURIGAO",
    distance: "310 km",
    gatePassNo: "015975",
    gatePassDate: "2026-07-27",
    rate: 20000,
    expenses: [
      { id: "e1", category: "Fuel", dateRequest: "2026-07-28", rsNo: "RS-991", description: "90 Ltrs Diesel", amount: 6300, remarks: "Shell Station" },
      { id: "e2", category: "Driver Allowance", dateRequest: "2026-07-27", rsNo: "", description: "Food & Lodging", amount: 2000, remarks: "" },
      { id: "e3", category: "Helper Allowance", dateRequest: "2026-07-27", rsNo: "", description: "Helper Fee", amount: 1000, remarks: "" },
      { id: "e4", category: "Toll Fee", dateRequest: "2026-07-27", rsNo: "", description: "Expressway Toll", amount: 1000, remarks: "" },
      { id: "e5", category: "Repair & Maintenance", dateRequest: "2026-07-28", rsNo: "", description: "Tire Inspection", amount: 2000, remarks: "" },
    ],
    notes: "Handle cargo with extra care. Customer requires delivery before 5:00 PM.",
    status: "Active",
    createdAt: "2026-07-27T08:00:00Z",
  },
  {
    id: "TRP-002",
    seqNo: "JLY-042-26",
    dateOfTravel: "2026-07-25",
    customerName: "Mindanao Fresh Produce Inc.",
    owner: "ALK Trucking",
    unit: "ISUZU FORWARD",
    plateNo: "MAA-9120",
    driver: "Santos, Pedro",
    helper1: "Castro, Kevin",
    helper2: "",
    origin: "CDO",
    destination: "Iligan City",
    distance: "88 km",
    gatePassNo: "015840",
    gatePassDate: "2026-07-25",
    rate: 15000,
    expenses: [
      { id: "e201", category: "Fuel", dateRequest: "2026-07-25", rsNo: "RS-102", description: "70 Ltrs Diesel", amount: 4900, remarks: "Shell CDO" },
      { id: "e202", category: "Driver Allowance", dateRequest: "2026-07-25", rsNo: "", description: "", amount: 1800, remarks: "" },
      { id: "e203", category: "Helper Allowance", dateRequest: "2026-07-25", rsNo: "", description: "", amount: 900, remarks: "" },
      { id: "e204", category: "Toll Fee", dateRequest: "2026-07-25", rsNo: "", description: "", amount: 800, remarks: "" },
    ],
    notes: "Completed smoothly without delay.",
    status: "Completed",
    createdAt: "2026-07-25T06:00:00Z",
    completedAt: "2026-07-26T17:30:00Z",
  },
  {
    id: "TRP-003",
    seqNo: "AUG-001-26",
    dateOfTravel: "2026-08-02",
    customerName: "CDO Builders Supply Corp.",
    owner: "Mindanao Logistics",
    unit: "FUSO SUPER GREAT",
    plateNo: "KKB-3381",
    driver: "Lim, Eduardo",
    helper1: "Villanueva, Mark",
    helper2: "Soriano, Allen",
    origin: "CDO",
    destination: "Davao City",
    distance: "265 km",
    gatePassNo: "016012",
    gatePassDate: "2026-08-02",
    rate: 35000,
    expenses: [
      { id: "e301", category: "Fuel", dateRequest: "2026-08-02", rsNo: "RS-205", description: "180 Ltrs", amount: 12600, remarks: "Petron Highway" },
      { id: "e302", category: "Driver Allowance", dateRequest: "2026-08-02", rsNo: "", description: "", amount: 3000, remarks: "" },
      { id: "e303", category: "Helper Allowance", dateRequest: "2026-08-02", rsNo: "", description: "", amount: 3000, remarks: "" },
      { id: "e304", category: "Miscellaneous", dateRequest: "2026-08-02", rsNo: "", description: "Port Pass", amount: 500, remarks: "" },
    ],
    notes: "Heavy equipment transport.",
    status: "Active",
    createdAt: "2026-08-02T05:30:00Z",
  },
];

const TRIPS_KEY = "alk_trips_data_v2";
const MASTER_KEY = "alk_master_data_v2";

export function getStoredTrips(): Trip[] {
  if (typeof window === "undefined") return INITIAL_TRIPS;
  try {
    const raw = localStorage.getItem(TRIPS_KEY);
    if (!raw) {
      localStorage.setItem(TRIPS_KEY, JSON.stringify(INITIAL_TRIPS));
      return INITIAL_TRIPS;
    }
    return JSON.parse(raw);
  } catch (err) {
    return INITIAL_TRIPS;
  }
}

export function getStoredMasterData(): MasterData {
  if (typeof window === "undefined") return INITIAL_MASTER_DATA;
  try {
    const raw = localStorage.getItem(MASTER_KEY);
    if (!raw) {
      localStorage.setItem(MASTER_KEY, JSON.stringify(INITIAL_MASTER_DATA));
      return INITIAL_MASTER_DATA;
    }
    return JSON.parse(raw);
  } catch (err) {
    return INITIAL_MASTER_DATA;
  }
}

export function saveTrips(trips: Trip[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
    window.dispatchEvent(new Event("alk_trips_updated"));
  } catch (err) {
    console.error("Failed to save trips", err);
  }
}

export function saveMasterData(masterData: MasterData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MASTER_KEY, JSON.stringify(masterData));
    window.dispatchEvent(new Event("alk_master_updated"));
  } catch (err) {
    console.error("Failed to save master data", err);
  }
}

export function calculateTripTotals(trip: Trip) {
  const totalExpense = trip.expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const remainder = (Number(trip.rate) || 0) - totalExpense;
  return { totalExpense, remainder };
}

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [masterData, setMasterData] = useState<MasterData>(INITIAL_MASTER_DATA);
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = () => {
    setTrips(getStoredTrips());
    setMasterData(getStoredMasterData());
    setIsLoaded(true);
  };

  useEffect(() => {
    refresh();
    const handleUpdate = () => refresh();
    window.addEventListener("alk_trips_updated", handleUpdate);
    window.addEventListener("alk_master_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("alk_trips_updated", handleUpdate);
      window.removeEventListener("alk_master_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const addTrip = (newTripData: Omit<Trip, "id" | "createdAt" | "status">) => {
    const current = getStoredTrips();
    const nextNum = current.length + 1;
    const newTrip: Trip = {
      ...newTripData,
      id: `TRP-${String(nextNum).padStart(3, "0")}`,
      status: "Active",
      createdAt: new Date().toISOString(),
    };
    const updated = [newTrip, ...current];
    saveTrips(updated);
    return newTrip;
  };

  const updateTrip = (updatedTrip: Trip) => {
    const current = getStoredTrips();
    const updated = current.map((t) => (t.id === updatedTrip.id ? updatedTrip : t));
    saveTrips(updated);
  };

  const markAsCompleted = (tripId: string, completionDate?: string) => {
    const current = getStoredTrips();
    const updated = current.map((t) =>
      t.id === tripId
        ? {
            ...t,
            status: "Completed" as const,
            completedAt: completionDate
              ? new Date(completionDate).toISOString()
              : new Date().toISOString(),
          }
        : t
    );
    saveTrips(updated);
  };

  const deleteTrip = (tripId: string) => {
    const current = getStoredTrips();
    const updated = current.filter((t) => t.id !== tripId);
    saveTrips(updated);
  };

  const updateMaster = (newMaster: Partial<MasterData>) => {
    const current = getStoredMasterData();
    const updated = { ...current, ...newMaster };
    saveMasterData(updated);
  };

  return {
    trips,
    activeTrips: trips.filter((t) => t.status === "Active"),
    completedTrips: trips.filter((t) => t.status === "Completed"),
    masterData,
    isLoaded,
    addTrip,
    updateTrip,
    markAsCompleted,
    deleteTrip,
    updateMaster,
    refresh,
  };
}
