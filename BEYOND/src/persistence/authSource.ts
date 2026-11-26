/*
  Authored by Muhammad Shahwaiz Abbasi · 2026
  authSource.js —> everything about WHO the user is: register, sign in, sign out and a
  listener that tells the app when the signed-in user changes.
 
  Firebase Authentication when Firebase is configured; otherwise, we use a built-in GUEST user so the app still works offline.
 */

// Load the Firebase sign-in tools we need.
import {
  onAuthStateChanged, // Tells us when someone signs in or out.
  createUserWithEmailAndPassword, // Creates a new account with email and password.
  signInWithEmailAndPassword, // Signs in with email and password.
  signInWithPopup, // Signs in with a pop-up window (used for Google).
  GoogleAuthProvider, // The Google sign-in method.
  signOut, // Signs the user out.
  updateProfile, // Changes the name saved on the account.
  type User as FirebaseUser, // The type of Firebase's own user object.
  type Auth, // The type of the sign-in service.
} from "firebase/auth";

import { auth, isFirebaseConfigured } from "./firebase"; // Load the sign-in service and the "is Firebase on?" flag.
import type { AppUser, AuthMode } from "../model/types"; // Load the types of our own data.

// The sign-in service as a value that is surely there (we only use it when Firebase is on).
const firebaseAuth = auth as Auth;

// Say which mode we run in: "firebase" or "local".
export const authMode: AuthMode = isFirebaseConfigured ? "firebase" : "local";

// The fake user used when Firebase is off.
const GUEST: AppUser = {
  uid: "local", // A fixed id for the guest.
  displayName: "Local explorer", // The name we show for the guest.
  email: null, // A guest has no email.
  isLocal: true, // Mark this user as a guest.
};

// Turn Firebase's big user object into the small user object our app uses.
function toAppUser(firebaseUser: FirebaseUser | null): AppUser | null {
  if (!firebaseUser) return null; // No Firebase user means nobody is signed in.
  const { uid, email, displayName } = firebaseUser; // Take out only the three fields we need.

  // Build the small user object.
  return {
    uid, // The user's unique id.
    email, // The user's email address.
    displayName: displayName || (email ? email.split("@")[0] : "Explorer"), // Use the name, or the start of the email, or "Explorer" if both are missing.
    isLocal: false, // This is a real user, not a guest.
  };
}

// A list of pairs: [a word inside the Firebase error code, the message the user sees].
const ERROR_TEXT: Array<[string, string]> = [
  ["invalid-credential", "Email or password is incorrect."], // Wrong login details.
  ["wrong-password", "Email or password is incorrect."], // Wrong password.
  ["user-not-found", "Email or password is incorrect."], // No account with this email.
  ["email-already-in-use", "An account with this email already exists."], // The email is already registered.
  ["weak-password", "Password should be at least 6 characters."], // The password is too short.
  ["invalid-email", "That email address looks invalid."], // The email is written wrongly.
  // Too many tries in a short time.
  [
    "too-many-requests",
    "Too many attempts. Please wait a moment and try again.",
  ],
  // The internet is not working.
  [
    "network-request-failed",
    "No connection. Check your internet and try again.",
  ],
  ["popup-closed", "The sign-in window was closed."], // The user closed the sign-in window.
  ["popup-blocked", "Your browser blocked the sign-in window."], // The browser blocked the sign-in window.
];

// Turn a Firebase error into a message a normal person can read.
export function friendlyAuthError(error: unknown): string {
  const details = error as { code?: string; message?: string } | null; // Treat the error as an object that may have a code and a message.
  const code = details?.code ?? ""; // Get the error code, or an empty text if there is none.
  const match = ERROR_TEXT.find(([part]) => code.includes(part)); // Find the first pair whose word appears in the code.
  // Use our message if we found one, otherwise the original message, otherwise a general one.
  return match
    ? match[1]
    : details?.message || "Something went wrong. Please try again.";
}

// Calls callback(user | null) now and every time the user signs in or out. Returns "stop listening".
export function onAuthChange(
  callback: (user: AppUser | null) => void,
): () => void {
  // Without Firebase, sign in the guest straight away.
  if (!isFirebaseConfigured) {
    callback(GUEST); // Tell the app the guest is the current user.
    return () => {}; // Return a "stop listening" function that does nothing.
  }
  // With Firebase, call our callback whenever the user changes, using our small user object.
  return onAuthStateChanged(firebaseAuth, (firebaseUser) =>
    callback(toAppUser(firebaseUser)),
  );
}

// Sign in with email and password.
export async function signInEmail(
  email: string,
  password: string,
): Promise<AppUser | null> {
  if (!isFirebaseConfigured) return GUEST; // Without Firebase, just return the guest.
  // Ask Firebase to sign in and wait for the answer.
  const credential = await signInWithEmailAndPassword(
    firebaseAuth,
    email,
    password,
  );
  return toAppUser(credential.user); // Return the signed-in user in our small format.
}

// Create a new account.
export async function signUpEmail(
  email: string,
  password: string,
  name?: string,
): Promise<AppUser | null> {
  if (!isFirebaseConfigured) return GUEST; // Without Firebase, just return the guest.
  // Ask Firebase to create the account and wait for the answer.
  const credential = await createUserWithEmailAndPassword(
    firebaseAuth,
    email,
    password,
  );
  if (name) await updateProfile(credential.user, { displayName: name }); // If the user typed a name, save it on the account.
  return toAppUser(credential.user); // Return the new user, which now includes the name we just saved.
}

// Sign in with a Google account.
export async function signInGoogle(): Promise<AppUser | null> {
  if (!isFirebaseConfigured) return GUEST; // Without Firebase, just return the guest.
  // Open the Google pop-up and wait until the user finishes.
  const credential = await signInWithPopup(
    firebaseAuth,
    new GoogleAuthProvider(),
  );
  return toAppUser(credential.user); // Return the signed-in user in our small format.
}

// Sign the current user out.
export async function signOutUser(): Promise<void> {
  if (isFirebaseConfigured) await signOut(firebaseAuth); // Only Firebase has a real sign-out; the guest stays as it is.
}
