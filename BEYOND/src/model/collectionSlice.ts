/*
  Authored by Muhammad Shahwaiz Abbasi · 2026
  collectionSlice —> the user's saved items (My Universe).
 
  state.collection = { items: { 'planet-saturn': {...item}, 'img-123': {...item} }, loaded }
  loaded becomes true once the saved items have arrived from the database.
  Saving to the database is NOT done here so see model/sideEffects.ts.
 */

// Load the function that creates a slice and the type of an action with data.
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CollectionItem } from "./types"; // Load the type of a saved item.

// The shape of this part of the state.
interface CollectionState {
  items: Record<string, CollectionItem>; // The saved items, found by their id.
  loaded: boolean; // True once the saved items have arrived from the database.
}

// The state at the start: no items, and nothing loaded yet.
const initialState: CollectionState = { items: {}, loaded: false };

// Create the slice for saved items.
const collectionSlice = createSlice({
  name: "collection", // The name of this part of the state.
  initialState, // The start values.
  // The only functions allowed to change this part of the state.
  reducers: {
    // Add an item to the collection.
    saveItem(state, action: PayloadAction<CollectionItem>) {
      state.items[action.payload.id] = action.payload; // Store the item under its id.
    },

    // Remove an item from the collection.
    removeItem(state, action: PayloadAction<string>) {
      delete state.items[action.payload]; // Delete the item with that id.
    },

    // Change the note of an item.
    setNote(state, action: PayloadAction<{ id: string; note: string }>) {
      const { id, note } = action.payload; // Get the item id and the new note.
      if (state.items[id]) state.items[id].note = note; // Only change the note if the item exists.
    },

    // Data arrived from the database.
    setCollection(
      state,
      action: PayloadAction<Record<string, CollectionItem> | null>,
    ) {
      state.items = action.payload || {}; // Use the items from the database or none for a new user.
      state.loaded = true; // Remember that the data has arrived.
    },

    // Someone signed in or out: forget the previous user's items.
    clearCollection(state) {
      state.items = {}; // Remove all items.
      state.loaded = false; // Remember that nothing is loaded.
    },
  },
});

// Let other files use the action functions.
export const { saveItem, removeItem, setNote, setCollection, clearCollection } =
  collectionSlice.actions; // Take the action functions out of the slice.

export default collectionSlice.reducer; // Let the store use the reducer.
