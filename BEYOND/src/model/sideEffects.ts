/*
  Authored by Muhammad Shahwaiz Abbasi · 2026
  sideEffects.ts —> things that must happen BECAUSE the state changed, kept out of presenters
  and thunks. Built with Redux Toolkit's listener middleware: "when action X happens, run Y".
 
    saveItem / removeItem / setNote   → write that one saved item to the database
    visited, pointsAwarded etc        → write the progress document (after a short pause)
    setPreferences                    → write the preferences document
    setUser                           → write the account profile document
    pushToast                         → dismiss the toast after its `duration`
 
  So a presenter only dispatches ONE thing (e.g. savePlanet) and persistence follows
  automatically. The reducers and thunks never mention the database and swapping Firebase
  for something else only touches persistence/.
 */

// Load the tools that listen for actions.
import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";

// Load the functions that write to the database.
import {
  saveDiscovery, // Save one item.
  removeDiscovery, // Delete one item.
  saveExploration, // Save the progress.
  savePreferences, // Save the preferences.
  saveProfile, // Save the account name and email.
} from "../persistence/userPersistence";

// Load the actions about saved items.
import { saveItem, removeItem, setNote } from "./collectionSlice";

// Load the actions about progress.
import {
  visited, // A planet was visited.
  compared, // Two planets were compared.
  searched, // A search was made.
  clearSearches, // The searches were cleared.
  pointsAwarded, // Points were given.
  achievementUnlocked, // An achievement was unlocked.
} from "./progressSlice";

// Load the actions about the user.
import { setPreferences, setUser } from "./userSlice";

// Load the actions about toasts.
import { pushToast, dismissToast } from "./uiSlice";

// Load the type of the whole state.
import type { RootState } from "./store";

// Create the middleware that holds all our listeners.
export const sideEffects = createListenerMiddleware<RootState>();
const listen = sideEffects.startListening; // A short name for the function that adds a listener.

// How long to wait (ms) before saving the progress.
const PROGRESS_SAVE_DELAY_MS = 500;

// Get the id of the signed-in user or null.
const currentUid = (api: { getState: () => RootState }): string | null =>
  api.getState().user.user?.uid ?? null; // Read the user id from the state.

// Run a database call; if it fails, tell the user instead of failing silently.

// Try a database call and show a toast if it fails.
async function attempt(
  api: { dispatch: (action: ReturnType<typeof pushToast>) => unknown }, // Something that can show a toast.
  whatWeTried: string, // A few words that say what we tried, for the error message.
  // The database call to run.
  databaseCall: () => Promise<unknown>,
): Promise<void> {
  // Try the call.
  try {
    // Run it and wait until it is done.
    await databaseCall();
    // If it failed  show an error toast.
  } catch (error) {
    api.dispatch(
      // Build the toast with the problem described.
      pushToast({
        kind: "error",
        title: `Could not ${whatWeTried}`,
        body: (error as Error).message,
      }),
    );
  }
}

// ----- saved items: one document per item -----

// Listen for actions that change saved items.
listen({
  matcher: isAnyOf(saveItem, removeItem, setNote), // These three actions trigger the listener.
  // This runs after each of those actions.
  effect: async (action, api) => {
    const uid = currentUid(api); // Find out who is signed in.
    if (!uid) return; // Visitors who are not signed in keep their items for this visit only.

    // If an item was removed delete it from the database.
    if (removeItem.match(action)) {
      await attempt(api, "remove this item", () =>
        removeDiscovery(uid, action.payload),
      );
      return; // Nothing more to do.
    }

    // Otherwise the action is a save or a note change, both carry the id of the item.
    const { id } = (
      action as ReturnType<typeof saveItem> | ReturnType<typeof setNote>
    ).payload;

    const item = api.getState().collection.items[id]; // Read the current version of the item from the state.

    // If it exists, save it to the database.
    if (item)
      await attempt(api, "save this item", () => saveDiscovery(uid, item));
  },
});

// ----- progress: one document, saved after the user pauses (so a burst = one write) -----

// Listen for actions that change the progress.
listen({
  // These actions trigger the listener.
  matcher: isAnyOf(
    visited,
    compared,
    searched,
    clearSearches,
    pointsAwarded,
    achievementUnlocked,
  ),
  // This runs after each of those actions.
  effect: async (_action, api) => {
    api.cancelActiveListeners(); // Stop an older waiting run, so a newer change restarts the pause.
    await api.delay(PROGRESS_SAVE_DELAY_MS); // Wait a short time.
    const state = api.getState(); // Read the newest state.
    const uid = state.user.user?.uid; // Find out who is signed in.
    if (!uid || !state.progress.loaded) return; // Stop if nobody is signed in or the saved data has not arrived yet.
    const { loaded, ...data } = state.progress; // Take out `loaded` because it belongs to the app, not the database.
    await attempt(api, "save your progress", () => saveExploration(uid, data)); // Save the progress to the database.
  },
});

// ----- preferences -----

// Listen for changed preferences.
listen({
  // Only this action triggers the listener.
  actionCreator: setPreferences,
  // This runs after the action.
  effect: async (_action, api) => {
    const uid = currentUid(api); // Find out who is signed in.
    // Only save when someone is signed in.
    if (uid) {
      // Save the current preferences.
      await attempt(
        api,
        "save your settings",
        () => savePreferences(uid, api.getState().user.preferences), // Write the preferences from the state.
      );
    }
  },
});

// ----- account profile (name + email), written whenever someone signs in -----

// Listen for a new signed-in user.
listen({
  actionCreator: setUser, // Only this action triggers the listener.
  // This runs after the action.
  effect: async (action, api) => {
    const user = action.payload; // The new user (or null).
    if (!user || user.isLocal) return; // Do nothing for signed-out visitors and offline guests.
    // Save the name and email.
    await attempt(api, "update your profile", () =>
      // Write the account document.
      saveProfile(user.uid, {
        displayName: user.displayName,
        email: user.email,
      }),
    );
  },
});

// ----- toasts remove themselves -----

// Listen for new toasts.
listen({
  actionCreator: pushToast, // Only this action triggers the listener.
  // This runs after the action.
  effect: async (action, api) => {
    const { id, duration } = action.payload; // Get the id and how long the toast should stay.
    if (!duration) return; // Duration 0 means the toast stays until the user closes it.
    await api.delay(duration); // Wait for the given time.
    api.dispatch(dismissToast(id)); // Remove the toast.
  },
});
