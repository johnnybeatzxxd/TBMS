import { create } from 'zustand';
import { Trip } from '../types/trip.types';
import { Expense } from '../types/expense.types';
import { Transfer } from '../types/transfer.types';
import { Refuel } from '../types/refuel.types';
import { FormSubmission } from '../types/form.types';

interface CacheState {
  trips: Trip[];
  expenses: Expense[];
  transfers: Transfer[];
  refuels: Refuel[];
  requests: FormSubmission[];
  
  setTrips: (trips: Trip[]) => void;
  setExpenses: (expenses: Expense[]) => void;
  setTransfers: (transfers: Transfer[]) => void;
  setRefuels: (refuels: Refuel[]) => void;
  setRequests: (requests: FormSubmission[]) => void;
  
  clearCache: () => void;
}

export const useCacheStore = create<CacheState>((set) => ({
  trips: [],
  expenses: [],
  transfers: [],
  refuels: [],
  requests: [],
  
  setTrips: (trips) => set({ trips }),
  setExpenses: (expenses) => set({ expenses }),
  setTransfers: (transfers) => set({ transfers }),
  setRefuels: (refuels) => set({ refuels }),
  setRequests: (requests) => set({ requests }),
  
  clearCache: () => set({
    trips: [],
    expenses: [],
    transfers: [],
    refuels: [],
    requests: [],
  }),
}));
