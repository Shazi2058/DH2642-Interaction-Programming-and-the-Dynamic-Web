/*
  Authored by Muhammad Shahwaiz Abbasi · 2026
  startup.ts —> runs once when the app starts (called from main.jsx).
 
  Listens for sign-in changes. When someone signs in we subscribe to THEIR data in the
  database, whenever it changes (even from another browser tab or device) the store is
  updated, which is what makes My Universe live. When they sign out, everything of theirs
  is cleared from memory.
 */

// Load the mode and the sign-in listener.
import { authMode, onAuthChange } from "../persistence/authSource";

// Load the function that follows one user's data.
import { subscribeUserData } from "../persistence/userPersistence";

// Load the actions about the user.
import { setUser, setAuthMode, loadPreferences } from "./userSlice";

// Load the actions about saved items.
import { setCollection, clearCollection } from "./collectionSlice";

// Load the actions about progress.
import { setProgress, clearProgress } from "./progressSlice";

// Load the action that shows a toast.
import { pushToast } from "./uiSlice";

// Load the type of the dispatch function.
import type { AppDispatch } from "./store";

// Start the app's connection to sign-in and the database.
export function startApp(store: { dispatch: AppDispatch }): void {
  const { dispatch } = store; // Take the dispatch function out of the store.

  let stopListeningToData: () => void = () => {};

  // Tell the state which mode we run in.
  dispatch(setAuthMode(authMode));

  // Run the code below every time the user signs in or out.
  onAuthChange((user) => {
    stopListeningToData(); // Stop following the previous user's data.
    stopListeningToData = () => {}; // Reset to a function that does nothing.
    dispatch(clearCollection()); // Forget the previous user's saved items.
    dispatch(clearProgress()); // Forget the previous user's progress.
    dispatch(loadPreferences(null)); // Go back to the default preferences.
    dispatch(setUser(user)); // Store the new user (or null).
    if (!user) return; // Nobody signed in means nothing to follow.

    // Start following the new user's data.
    stopListeningToData = subscribeUserData(user.uid, {
      // When the saved items arrive or change, store them.
      onCollection: (items) => dispatch(setCollection(items)),

      // When the progress arrives or changes, store it.
      onExploration: (data) => dispatch(setProgress(data)),

      // When the preferences arrive or change, store them.
      onPreferences: (preferences) => dispatch(loadPreferences(preferences)),

      // When something goes wrong, show an error toast.
      onError: (error) =>
        // Build the toast.
        dispatch(
          pushToast({
            kind: "error",
            title: "Sync problem",
            body: error.message,
          }),
        ),
    });
  });
}
