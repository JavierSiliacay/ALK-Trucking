"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { getTrips, createTrip as createServerTrip, updateTrip as updateServerTrip, completeTrip as completeServerTrip, uncompleteTrip as uncompleteServerTrip, deleteTrip as deleteServerTrip } from "@/actions/trips";
import { toast } from "sonner";

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
};

const TRIPS_KEY = "alk_trips_data_v2";
const MASTER_KEY = "alk_master_data_v2";

// Replaced localStorage with DB
export function getStoredMasterData(): MasterData {
  return INITIAL_MASTER_DATA;
}

// Removed saveTrips as we use the database now

export function saveMasterData(masterData: MasterData) {
  // Deprecated. We now update via server actions.
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
  addTrip: (data: Omit<Trip, "id" | "createdAt" | "status">) => Promise<Trip | undefined>;
  updateTrip: (data: Trip) => void;
  markAsCompleted: (tripId: string, completionDate?: string) => void;
  revertToActive: (tripId: string) => void;
  deleteTrip: (tripId: string) => Promise<void>;
  updateMaster: (newMaster: Partial<MasterData>) => void;
  refresh: () => Promise<void>;
}

const TripsContext = createContext<TripsContextType | undefined>(undefined);

export function TripsProvider({ children, initialTrips, initialMasterData }: { children: ReactNode, initialTrips?: Trip[], initialMasterData?: MasterData }) {
  const [trips, setTrips] = useState<Trip[]>(initialTrips || []);
  const [masterData, setMasterData] = useState<MasterData>(initialMasterData || INITIAL_MASTER_DATA);
  const [isLoaded, setIsLoaded] = useState(!!initialTrips && !!initialMasterData);

  const refresh = async () => {
    try {
      const dbTrips = await getTrips();
      // To get master data dynamically, we would import getMasterData here.
      // But for refresh(), we usually just rely on page reloads to fetch master data,
      // as Server Actions call revalidatePath anyway.
      setTrips(dbTrips);
      setIsLoaded(true);
    } catch (e) {
      console.error("Error fetching trips from Neon:", e);
      setTrips(initialTrips || []);
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    if (!initialTrips) {
      refresh();
    }
    const handleUpdate = () => refresh();
    window.addEventListener("alk_trips_updated", handleUpdate);
    
    // Auto-refresh the trips data every 30 seconds
    const interval = setInterval(() => {
      refresh();
    }, 30000);

    return () => {
      window.removeEventListener("alk_trips_updated", handleUpdate);
      clearInterval(interval);
    };
  }, [initialTrips]);

  // Sync masterData prop from server layout when it re-renders due to revalidatePath
  useEffect(() => {
    if (initialMasterData) {
      setMasterData(initialMasterData);
    }
  }, [initialMasterData]);

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
      .then(() => {
        toast.success(`Trip ${seqNo} successfully recorded!`);
        refresh();
      })
      .catch((err) => {
        console.error("Failed to save trip", err);
        toast.error(`Failed to record trip ${seqNo}.`);
        refresh();
      });
    
    return optimisticTrip;
  };

  const updateTrip = async (updatedTrip: Trip) => {
    setTrips(prev => prev.map(t => t.id === updatedTrip.id ? updatedTrip : t));

    updateServerTrip(updatedTrip.id, updatedTrip)
      .then(() => {
        toast.success(`Trip ${updatedTrip.seqNo} updated successfully!`);
        refresh();
      })
      .catch((err) => {
        console.error("Failed to update trip", err);
        toast.error(`Failed to update trip ${updatedTrip.seqNo}.`);
        refresh();
      });
  };

  const markAsCompleted = async (tripId: string, completionDate?: string) => {
    toast.promise(completeServerTrip(tripId), {
      loading: 'Marking trip as completed...',
      success: () => {
        refresh();
        return 'Trip successfully marked as completed!';
      },
      error: 'Failed to complete trip.'
    });
  };

  const deleteTrip = async (tripId: string) => {
    toast.promise(deleteServerTrip(tripId), {
      loading: 'Deleting trip record...',
      success: () => {
        refresh();
        return 'Trip permanently deleted.';
      },
      error: 'Failed to delete trip.'
    });
  };

  const revertToActive = async (tripId: string) => {
    toast.promise(uncompleteServerTrip(tripId), {
      loading: 'Reverting trip to Active...',
      success: () => {
        refresh();
        return 'Trip successfully reverted to Active status!';
      },
      error: 'Failed to revert trip.'
    });
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
      revertToActive,
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
