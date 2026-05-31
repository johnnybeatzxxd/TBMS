import { create } from 'zustand';

interface ActionState {
  pendingActions: Record<string, boolean>;
  startAction: (key: string) => void;
  stopAction: (key: string) => void;
  isActionPending: (key: string) => boolean;
}

export const useActionStore = create<ActionState>((set, get) => ({
  pendingActions: {},
  startAction: (key) => set((state) => ({ pendingActions: { ...state.pendingActions, [key]: true } })),
  stopAction: (key) => set((state) => {
    const newActions = { ...state.pendingActions };
    delete newActions[key];
    return { pendingActions: newActions };
  }),
  isActionPending: (key) => !!get().pendingActions[key],
}));
