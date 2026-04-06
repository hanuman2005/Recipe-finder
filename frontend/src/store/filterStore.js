import { create } from "zustand";

export const useFilterStore = create((set) => ({
  // Equipment filter state (Feature #3)
  selectedEquipment: [],
  maxPrepTime: null,
  maxCookTime: null,
  difficulty: null,
  minRating: 0,
  searchQuery: "",

  // Filter actions
  toggleEquipment: (equipment) =>
    set((state) => ({
      selectedEquipment: state.selectedEquipment.includes(equipment)
        ? state.selectedEquipment.filter((e) => e !== equipment)
        : [...state.selectedEquipment, equipment],
    })),

  setMaxPrepTime: (time) => set({ maxPrepTime: time }),
  setMaxCookTime: (time) => set({ maxCookTime: time }),
  setDifficulty: (difficulty) => set({ difficulty }),
  setMinRating: (rating) => set({ minRating: rating }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Clear all filters
  clearFilters: () =>
    set({
      selectedEquipment: [],
      maxPrepTime: null,
      maxCookTime: null,
      difficulty: null,
      minRating: 0,
      searchQuery: "",
    }),

  // Get filter object for API
  getFilters: (state) => ({
    equipment:
      state.selectedEquipment.length > 0 ? state.selectedEquipment : undefined,
    maxPrepTime: state.maxPrepTime,
    maxCookTime: state.maxCookTime,
    difficulty: state.difficulty,
    minRating: state.minRating,
    search: state.searchQuery,
  }),
}));
