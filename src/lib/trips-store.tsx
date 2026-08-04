"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { getTrips, createTrip as createServerTrip, updateTrip as updateServerTrip, completeTrip as completeServerTrip, deleteTrip as deleteServerTrip } from "@/actions/trips";

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
  customers: ["Magnolia", "San Miguel", "Purefoods", "Bounty Fresh"],
  owners: ["ALK Trucking", "Mindanao Logistics", "Third Party"],
  routes: [
    { id: "r1", origin: "CDO", destination: "Davao", distance: "260km" },
    { id: "r2", origin: "CDO", destination: "Bukidnon", distance: "110km" }
  ],
  expenseCategories: DEFAULT_EXPENSE_CATEGORIES
};

const TRIPS_KEY = "alk_trips_data_v2";
const MASTER_KEY = "alk_master_data_v2";

// No longer saving trips to local storage
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

// Removed saveTrips as we use the database now

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

export interface TripsContextType {
  trips: Trip[];
  activeTrips: Trip[];
  completedTrips: Trip[];
  masterData: MasterData;
  isLoaded: boolean;
  addTrip: (newTripData: Omit<Trip, "id" | "createdAt" | "status">) => Promise<Trip>;
  updateTrip: (updatedTrip: Trip) => Promise<void>;
  markAsCompleted: (tripId: string, completionDate?: string) => Promise<void>;
  deleteTrip: (tripId: string) => Promise<void>;
  updateMaster: (newMaster: Partial<MasterData>) => void;
  refresh: () => Promise<void>;
}

const TripsContext = createContext<TripsContextType | undefined>(undefined);

export function TripsProvider({ children, initialTrips }: { children: ReactNode, initialTrips?: Trip[] }) {
  const [trips, setTrips] = useState<Trip[]>(initialTrips || []);
  const [masterData, setMasterData] = useState<MasterData>(INITIAL_MASTER_DATA);
  const [isLoaded, setIsLoaded] = useState(!!initialTrips);

  const refresh = async () => {
    try {
      const dbTrips = await getTrips();
      setTrips(dbTrips);
      setMasterData(getStoredMasterData());
      setIsLoaded(true);
    } catch (e) {
      console.error("Error fetching trips from Neon:", e);
      setTrips(initialTrips || []);
      setMasterData(getStoredMasterData());
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    if (!initialTrips) {
      refresh();
    } else {
      // If we got initialTrips from server, just load master data
      setMasterData(getStoredMasterData());
    }
    const handleUpdate = () => refresh();
    window.addEventListener("alk_trips_updated", handleUpdate);
    window.addEventListener("alk_master_updated", handleUpdate);
    return () => {
      window.removeEventListener("alk_trips_updated", handleUpdate);
      window.removeEventListener("alk_master_updated", handleUpdate);
    };
  }, [initialTrips]);

  const addTrip = async (newTripData: Omit<Trip, "id" | "createdAt" | "status">) => {
    const nextNum = trips.length + 1;
    const seqNo = newTripData.seqNo || `JLY-${String(nextNum).padStart(3, "0")}-26`;
    
    const optimisticTrip: Trip = {
      ...newTripData,
      seqNo,
      id: crypto.randomUUID ? crypto.randomUUID() : `temp_${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: "Active",
    };
    
    setTrips(prev => [optimisticTrip, ...prev]);

    createServerTrip({ ...newTripData, seqNo })
      .then(() => refresh())
      .catch((err) => {
        console.error("Failed to save trip", err);
        refresh();
      });
    
    return optimisticTrip;
  };

  const updateTrip = async (updatedTrip: Trip) => {
    setTrips(prev => prev.map(t => t.id === updatedTrip.id ? updatedTrip : t));

    updateServerTrip(updatedTrip.id, updatedTrip)
      .then(() => refresh())
      .catch((err) => {
        console.error("Failed to update trip", err);
        refresh();
      });
  };

  const markAsCompleted = async (tripId: string, completionDate?: string) => {
    await completeServerTrip(tripId);
    refresh();
  };

  const deleteTrip = async (tripId: string) => {
    await deleteServerTrip(tripId);
    refresh();
  };

  const updateMaster = (newMaster: Partial<MasterData>) => {
    const current = getStoredMasterData();
    const updated = { ...current, ...newMaster };
    saveMasterData(updated);
  };

  return (
    <TripsContext.Provider value={{
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
    }}>
      {children}
    </TripsContext.Provider>
  );
}

export function useTrips() {
  const context = useContext(TripsContext);
  if (context === undefined) {
    throw new Error("useTrips must be used within a TripsProvider");
  }
  return context;
}
