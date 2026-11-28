/*
  Authored by Muhammad Shahwaiz Abbasi · 2026
  progressSlice —> the user's exploration progress: points, recently visited objects,
  explored planets, comparisons, achievements and recent searches.
 
  These reducers only record facts. The DECISIONS (does this earn points? did an
  achievement unlock?) are made in model/thunks.ts, using the rules in achievements.ts.
  Saved to the database by model/sideEffects.ts; `loaded` is app-only and never stored.
 */
// Load the function that creates a slice.
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// Load the types of our own data.
import type { HistoryEntry, ProgressData } from "./types";

// The progress as it lives in the state: the saved data plus the app-only `loaded` flag.
export interface ProgressState extends ProgressData {
  loaded: boolean; // True once the saved progress has arrived from the database.
}

// Make a fresh, empty progress object.
const emptyProgress = (): ProgressData => ({
  points: 0, // The points the user has.
  history: [], // Recently visited objects, newest first: { id, type, title, at }.
  explored: [], // The ids of the planets the user has visited.
  comparisons: [], // The pairs already compared, for example 'jupiter-saturn'.
  achievements: {}, // The unlocked achievements: { achievementId: time }.
  searches: [], // The recent search words, newest first.
  awarded: [], // The keys of one-time point awards, so points cannot be collected twice.
});

const HISTORY_LIMIT = 30; // The most history entries we keep.

const SEARCH_LIMIT = 8; // The most recent searches we keep.

// Create the slice for the progress.
const progressSlice = createSlice({
  name: "progress", // The name of this part of the state.
  initialState: { ...emptyProgress(), loaded: false } as ProgressState, // The start values: empty progress and "not loaded".
  // The only functions allowed to change this part of the state.
  reducers: {
    // The user visited an object.
    visited: {
      // `prepare` adds the current time to the data.
      prepare: ({
        id,
        type,
        title,
      }: {
        id: string;
        type: string;
        title: string;
      }) => ({
        // Build the data that goes into the reducer, with the current time added.
        payload: { id, type, title, at: Date.now() } as HistoryEntry,
      }),

      // Record the visit.
      reducer(state, action: PayloadAction<HistoryEntry>) {
        const entry = action.payload; // Short name for the new history entry.
        // Put the entry first and remove an older entry for the same object.
        state.history = [
          entry, // The new entry goes first.
          // Keep all older entries except the same object.
          ...state.history.filter(
            (h) => !(h.id === entry.id && h.type === entry.type),
          ),
          // Keep only the newest entries.
        ].slice(0, HISTORY_LIMIT);

        // For a planet that was not visited before...
        if (entry.type === "planet" && !state.explored.includes(entry.id)) {
          // ...add it to the explored planets.
          state.explored.push(entry.id);
        }
      },
    },

    // The user compared two planets.
    compared(state, action: PayloadAction<string[]>) {
      const pair = [...action.payload].sort().join("-"); // Make one name for the pair; the order does not matter.
      if (!state.comparisons.includes(pair)) state.comparisons.push(pair); // Add the pair only if it is new.
    },

    // The user made a search.
    searched(state, action: PayloadAction<string>) {
      const word = action.payload.trim(); // Remove spaces around the search word.
      if (!word) return; // Ignore empty searches.
      // Keep the older searches except the same word.
      const others = state.searches.filter(
        (s) => s.toLowerCase() !== word.toLowerCase(),
      );
      // Put the new word first and keep only the newest ones.
      state.searches = [word, ...others].slice(0, SEARCH_LIMIT);
    },

    // Delete all recent searches.
    clearSearches(state) {
      state.searches = []; // Empty the list.
    },

    // Give points but only the first time this key is used.
    pointsAwarded(
      state,
      action: PayloadAction<{ key: string; points: number }>,
    ) {
      const { key, points } = action.payload; // Get the key and the number of points.
      if (state.awarded.includes(key)) return; // Stop if this key was used before.
      state.awarded.push(key); // Remember that this key is used.
      state.points += points; // Add the points.
    },

    // An achievement was unlocked.
    achievementUnlocked: {
      // `prepare` adds the current time to the data.
      prepare: (achievementId: string) => ({
        // Build the data that goes into the reducer, with the current time added.
        payload: { achievementId, at: Date.now() },
      }),
      // Record the unlock.
      reducer(
        state,
        action: PayloadAction<{ achievementId: string; at: number }>,
      ) {
        const { achievementId, at } = action.payload; // Get the achievement id and the time.
        // Save the time only if it was not unlocked before.
        if (!state.achievements[achievementId])
          state.achievements[achievementId] = at;
      },
    },

    // Data arrived from the database (null means a new user).
    setProgress(
      _state,
      action: PayloadAction<Partial<ProgressData> | null>,
    ): ProgressState {
      // Start empty, add the saved data, and mark it as loaded.
      return { ...emptyProgress(), ...action.payload, loaded: true };
    },
    // Someone signed in or out: forget the previous user's progress.
    clearProgress(): ProgressState {
      return { ...emptyProgress(), loaded: false }; // Go back to empty and not loaded.
    },
  },
});

// Let other files use the action functions.
export const {
  visited,
  compared,
  searched,
  clearSearches,
  pointsAwarded,
  achievementUnlocked,
  setProgress,
  clearProgress,
} = progressSlice.actions;

export default progressSlice.reducer;
