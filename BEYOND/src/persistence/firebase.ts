/*
  Authored by Muhammad Shahwaiz Abbasi · 2026
  firebase.js —> starts Firebase once and exports the auth and database handles.
  Only the files in persistence/ may import this file.
 */

import { initializeApp, type FirebaseApp } from "firebase/app"; // Load the function that starts a Firebase app and its type.
import { getAuth, type Auth } from "firebase/auth"; // Load the function that gives us Firebase sign-in and its type.
import { getFirestore, type Firestore } from "firebase/firestore"; // Load the function that gives us the Firestore database and its type.

// The settings Firebase needs to find our project.
const config = {
  apiKey: "apiKey", // The public key of the project.
  authDomain: "authDomain", // The web address used for sign-in pop-ups.
  projectId: "projectId", // The name of our Firebase project.
  appId: "appId", // The id of this web app inside the project.
};

// True when all three important settings are filled in, so Firebase can be used.
export const isFirebaseConfigured: boolean = Boolean(
  config.apiKey && config.projectId && config.appId,
);

let app: FirebaseApp | null = null; // Will hold the Firebase app (empty until we start it).
let auth: Auth | null = null; // Will hold the sign-in service (empty until we start it).
let db: Firestore | null = null; // Will hold the database service (empty until we start it).

// Only start Firebase when the settings are complete.
if (isFirebaseConfigured) {
  app = initializeApp(config); // Start the Firebase app with our settings.
  auth = getAuth(app); // Get the sign-in service for this app.
  db = getFirestore(app); // Get the database service for this app.
}

// Let other persistence files use these three handles.
export { app, auth, db };
