/*
  Authored by Muhammad Shahwaiz Abbasi · 2026
  userPersistence.ts — saves and loads ONE user's data. Nothing else in the app knows how.
 
  Firestore layout (every document lives under the user's own id, see firestore.rules):
    users/{uid}/profile/account          name + email
    users/{uid}/profile/preferences      motion, units, labels
    users/{uid}/savedDiscoveries/{id}    one document per saved planet or image
    users/{uid}/exploration/state        points, history, achievements, searches
 
  Two implementations with the same function names:
    - Firestore  (live updates through onSnapshot)
    - localStorage (offline guest mode, live between browser tabs)
  The model decides WHEN to call these (model/sideEffects.ts). This file only knows HOW.
 */

// Load the Firestore tools we need.
import {
  collection, // Points to a group of documents.
  doc, // Points to one document.
  setDoc, // Writes a document.
  deleteDoc, // Deletes a document.
  onSnapshot, // Calls us every time the data changes.
  type CollectionReference, // The type of a group of documents.
  type DocumentReference, // The type of one document place.
  type QuerySnapshot, // The type of the answer for a group of documents.
  type DocumentSnapshot, // The type of the answer for one document.
  type Firestore, // The type of the database.
  type DocumentData, // The type of a piece of data stored in Firestore.
} from "firebase/firestore";

import { db, isFirebaseConfigured } from "./firebase"; // Load the database handle and the "is Firebase on?" flag.

// Load the types of our own data.
import type {
  CollectionItem,
  Preferences,
  ProgressData,
  UserDataHandlers,
} from "../model/types";

// The database as a value that is surely there (we only use it when Firebase is on).
const database = (): Firestore => db as Firestore;

// Firestore refuses undefined values so a JSON round trip removes them.
const plain = <T>(value: T): DocumentData =>
  JSON.parse(JSON.stringify(value)) as DocumentData;

// The list of functions every persistence version must have.
interface PersistenceStore {
  subscribe: (uid: string, handlers: UserDataHandlers) => () => void; // Start following all of one user's data; returns a "stop following" function.
  saveDiscovery: (uid: string, item: CollectionItem) => Promise<void>; // Save one item.
  removeDiscovery: (uid: string, itemId: string) => Promise<void>; // Delete one item.
  saveExploration: (uid: string, data: ProgressData) => Promise<void>; // Save the progress.
  savePreferences: (uid: string, preferences: Preferences) => Promise<void>; // Save the preferences.
  // Save the name and email of the account.
  saveProfile: (
    uid: string,
    profile: { displayName: string; email: string | null },
  ) => Promise<void>;
}

/* Firestore                                                          
---------------------------------------------------------
*/

/**
 * Listen to one Firestore reference. `read(snapshot)` turns the snapshot into plain data.
 * Snapshots that only echo OUR OWN unsent writes are skipped (after the first one),
 * otherwise a slow echo could overwrite a newer change the user just made.
 */

function listen<S extends QuerySnapshot | DocumentSnapshot, T>(
  // The place in the database we are watching.
  reference: S extends QuerySnapshot ? CollectionReference : DocumentReference,
  read: (snapshot: S) => T, // The function that turns a snapshot into plain data.
  onData: (data: T) => void, // The function that receives the plain data.
  onError: (error: Error) => void, // The function that receives errors.
): () => void {
  let firstDone = false; // Remember if we already delivered the first snapshot.
  // Start listening and return the "stop listening" function.
  return onSnapshot(
    // The place in the database we are watching (typed loosely here, checked by the callers).
    reference as DocumentReference,
    // This runs every time the data changes.
    (snapshot) => {
      if (firstDone && snapshot.metadata.hasPendingWrites) return; // Ignore echoes of our own unsent writes, but never the very first snapshot.
      firstDone = true; // From now on the first snapshot is done.
      onData(read(snapshot as unknown as S)); // Give the plain data to the app.
    },
    onError, // This runs if listening fails (for example no permission).
  );
}

// Read one document: its data, or null if it does not exist yet.
const readDocument = <T>(snapshot: DocumentSnapshot): T | null =>
  snapshot.exists() ? (snapshot.data() as T) : null; // Return the data if the document exists, otherwise null.
// Read a group of documents into an object keyed by document id.
const readCollection = (
  snapshot: QuerySnapshot,
): Record<string, CollectionItem> => {
  const byId: Record<string, CollectionItem> = {}; // Start with an empty object.
  // Go through every document in the group.
  snapshot.forEach((d) => {
    byId[d.id] = d.data() as CollectionItem; // Store its data under its id.
  });
  return byId; // Return the finished object.
};

// The Firestore version of the persistence functions.
const firestoreStore: PersistenceStore = {
  // Start following all of one user's data.
  subscribe(uid, handlers) {
    // Keep the three "stop listening" functions in a list.
    const stops = [
      // Follow the saved items (a group of documents).
      listen<QuerySnapshot, Record<string, CollectionItem>>(
        collection(database(), "users", uid, "savedDiscoveries"), // The group of saved items of this user.
        readCollection, // How to read it.
        handlers.onCollection, // Where to send the data.
        handlers.onError, // Where to send errors.
      ),
      // Follow the progress document.
      listen<DocumentSnapshot, Partial<ProgressData> | null>(
        doc(database(), "users", uid, "exploration", "state"), // The progress document of this user.
        (snapshot) => readDocument<Partial<ProgressData>>(snapshot), // How to read it.
        handlers.onExploration, // Where to send the data.
        handlers.onError, // Where to send errors.
      ),
      // Follow the preferences document.
      listen<DocumentSnapshot, Partial<Preferences> | null>(
        doc(database(), "users", uid, "profile", "preferences"), // The preferences document of this user.
        (snapshot) => readDocument<Partial<Preferences>>(snapshot), // How to read it.
        handlers.onPreferences, // Where to send the data.
        handlers.onError, // Where to send errors.
      ),
    ];
    return () => stops.forEach((stop) => stop()); // Return one function that stops all three listeners.
  },
  // Save one item in the user's saved items.
  saveDiscovery: (uid, item) =>
    // Write the item under its own id.
    setDoc(
      doc(database(), "users", uid, "savedDiscoveries", item.id),
      plain(item),
    ),

  // Delete one saved item.
  removeDiscovery: (uid, itemId) =>
    // Delete the document with that id.
    deleteDoc(doc(database(), "users", uid, "savedDiscoveries", itemId)),

  // Save the progress (points, history etc).
  saveExploration: (uid, data) =>
    // Write the progress document.
    setDoc(doc(database(), "users", uid, "exploration", "state"), plain(data)),

  // Save the preferences.
  savePreferences: (uid, preferences) =>
    // Write the preferences document.
    setDoc(
      doc(database(), "users", uid, "profile", "preferences"),
      plain(preferences),
    ),

  // Save the name and email of the account.
  saveProfile: (uid, profile) =>
    // Write the account document and keep fields we did not send (merge).
    setDoc(
      doc(database(), "users", uid, "profile", "account"),
      plain(profile),
      { merge: true },
    ),
};

/* localStorage (offline mode)                                         
---------------------------------------------------------
*/

// Everything we keep in the browser for one user.
interface LocalData {
  items?: Record<string, CollectionItem>; // The saved items.
  exploration?: ProgressData | null; // The progress.
  preferences?: Preferences | null; // The preferences.
  profile?: { displayName: string; email: string | null }; // The name and email.
}

// The name under which one user's data is kept in the browser.
const storageKey = (uid: string): string => `beyond:${uid}`;

// Read everything saved for one user.
function readLocal(uid: string): LocalData {
  // Reading can fail, so we try it first.
  try {
    // Turn the saved text back into an object or use an empty object.
    return (
      (JSON.parse(
        localStorage.getItem(storageKey(uid)) as string,
      ) as LocalData | null) || {}
    );
    // If anything goes wrong (for example broken text)
  } catch {
    return {}; // ...act as if nothing was saved.
  }
}

// Change part of one user's saved data.
function updateLocal(
  uid: string,
  change: (saved: LocalData) => LocalData,
): void {
  const next = { ...readLocal(uid), ...change(readLocal(uid)) }; // Mix the old data with the changes returned by `change`.
  // Writing can fail, so we try it first.
  try {
    localStorage.setItem(storageKey(uid), JSON.stringify(next)); // Save the new data as text.
    // If the browser refuses (storage full or private window)
  } catch {
    // do nothing, the app still works but won't remember.
  }
}

// The browser-storage version of the persistence functions.
const localStore: PersistenceStore = {
  // Start following one user's data.
  subscribe(uid, handlers) {
    // Send everything saved so far to the app.
    const send = (): void => {
      const saved = readLocal(uid); // Read the saved data.
      handlers.onCollection(saved.items || {}); // Send the saved items.
      handlers.onExploration(saved.exploration || null); // Send the progress.
      handlers.onPreferences(saved.preferences || null); // Send the preferences.
    };
    // Runs when ANOTHER browser tab changes the storage.
    const onOtherTab = (event: StorageEvent): void => {
      if (event.key === storageKey(uid)) send(); // Only react to this user's data.
    };
    window.addEventListener("storage", onOtherTab); // Start listening for changes made in other tabs.
    send(); // Send the current data right now.
    return () => window.removeEventListener("storage", onOtherTab); // Return a function that stops listening.
  },

  // Save one item.
  async saveDiscovery(uid, item) {
    // Add the item to the saved items.
    updateLocal(uid, (saved) => ({
      items: { ...saved.items, [item.id]: item },
    }));
  },

  // Delete one item.
  async removeDiscovery(uid, itemId) {
    // Change the saved data.
    updateLocal(uid, (saved) => {
      const items = { ...saved.items }; // Copy the saved items.
      delete items[itemId]; // Remove the item from the copy.
      return { items }; // Give back the changed items.
    });
  },

  // Save the progress.
  async saveExploration(uid, data) {
    updateLocal(uid, () => ({ exploration: data })); // Replace the saved progress.
  },

  // Save the preferences.
  async savePreferences(uid, preferences) {
    updateLocal(uid, () => ({ preferences })); // Replace the saved preferences.
  },

  // Save the name and email.
  async saveProfile(uid, profile) {
    // Mix the new profile data into the old one.
    updateLocal(uid, (saved) => ({
      profile: { ...saved.profile, ...profile },
    }));
  },
};

// Choose Firestore when Firebase is on, otherwise browser storage.
const store: PersistenceStore = isFirebaseConfigured
  ? firestoreStore
  : localStore;

export const subscribeUserData = store.subscribe; // Start following a user's data.
export const saveDiscovery = store.saveDiscovery; // Save one item.
export const removeDiscovery = store.removeDiscovery; // Delete one item.
export const saveExploration = store.saveExploration; // Save the progress.
export const savePreferences = store.savePreferences; // Save the preferences.
export const saveProfile = store.saveProfile; // Save the account name and email.
