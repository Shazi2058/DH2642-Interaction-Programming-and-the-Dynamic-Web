/*
  Authored by Muhammad Shahwaiz Abbasi · 2026
  types.ts —> the shared TypeScript types of the model. Every other file imports its types
  from here, so the shape of the data is written down in exactly one place.
  Types only. This file contains no code that runs.
*/

// The three things a request can be doing. not started, running, finished well or failed.
export type RequestStatus = "idle" | "loading" | "success" | "error";

// A planet from the catalogue (Person 2's data/planets file).
export interface Planet {
  id: string; // The unique name of the planet, for example "earth".
  name: string; // The name shown to the user, for example "Earth".
  type: string; // The kind of planet, for example "Terrestrial planet".
  description: string; // A short description.
  facts: string[]; // A list of short facts.
  imageUrl?: string; // A picture of the planet (optional).
  searchTerm?: string; // The words used to search NASA for this planet (optional, the name is used if missing).
  [extra: string]: unknown; // Any other fields (diameter, distance, ...) are allowed and ignored by the model.
}

// One stop of the Grand Tour (data/tour file).
export interface TourStop {
  planetId: string | null; // The planet to show at this stop or null to show the whole solar system.
  [extra: string]: unknown; // Any other fields (title, text etc) are allowed and ignored by the model.
}

// One NASA image from a search (Samat's sources/nasaImageSource file).
export interface NasaImage {
  id: string; // The unique id of the image.
  title: string; // The title of the image.
  imageUrl?: string; // The normal-size picture address.
  url?: string; // Another name for the picture address that is also accepted.
  hdUrl?: string; // The large picture address.
  description?: string; // The description of the image.
  explanation?: string; // Another name for the description that is also accepted.
  credit?: string; // Who made the image.
  date?: string; // The date of the image.
  source?: string; // Where the image comes from.
}

// The picture of the day (Samat's sources/apodSource file).
export interface ApodData {
  title: string; // The title of the picture.
  date?: string; // The date of the picture.
  explanation?: string; // The explanation text.
  imageUrl?: string; // The normal-size picture address.
  hdUrl?: string; // The large picture address.
  credit?: string; // Who made the picture.
}

// An error that may carry a built-in picture to show instead.
export interface ApodError extends Error {
  fallback?: ApodData; // The built-in picture (optional).
}

// The answer of one NASA image search.
export interface ImageSearchResult {
  items: NasaImage[]; // The images of this page.
  total: number; // How many images exist in total for this search.
}

// The two kinds of things that can be saved.
export type ObjectType = "planet" | "image";

// One saved item in "My Universe".
export interface CollectionItem {
  id: string; // The id of the item, for example "planet-saturn" or "img-123".
  objectType: ObjectType; // Is it a planet or an image?
  objectId: string; // The id of the planet or image itself.
  title: string; // The title shown to the user.
  subtitle: string; // The small text under the title.
  imageUrl: string | null; // The picture address, or null if there is none.
  hdUrl?: string | null; // The large picture address (images only).
  description?: string; // The description (images only).
  credit?: string; // Who made the image (images only).
  date?: string; // The date of the image (images only).
  note: string; // The user's note.
  savedAt: number; // The time when it was saved  (ms).
}

// The signed-in user, as the app sees them.
export interface AppUser {
  uid: string; // The unique id of the user.
  email: string | null; // The email address (null for a guest).
  displayName: string; // The name shown to the user.
  isLocal: boolean; // True for the offline guest user.
}

// The mode the app runs in.
export type AuthMode = "firebase" | "local";

// The settings the user can change.
export interface Preferences {
  motion: "system" | "full" | "reduce"; // How much the app moves: follow the device, always move, or calm down.
  temperatureUnit: "C" | "F"; // Show temperatures in Celsius or Fahrenheit.
  showLabels: boolean; // Show planet names in the 3D scene.
}

// One entry of the "recently visited" list.
export interface HistoryEntry {
  id: string; // The id of the visited object.
  type: string; // The kind of object, for example "planet".
  title: string; // The name shown to the user.
  at: number; // The time of the visit, in milliseconds.
}

// Everything that is saved about the user's progress.
export interface ProgressData {
  points: number; // The points the user has.
  history: HistoryEntry[]; // Recently visited objects, newest first.
  explored: string[]; // The ids of the planets the user has visited.
  comparisons: string[]; // The pairs already compared, for example "jupiter-saturn".
  achievements: Record<string, number>; // The unlocked achievements: id → time of unlocking.
  searches: string[]; // The recent search words, newest first.
  awarded: string[]; // The keys of one-time point awards.
}

// One achievement rule.
export interface Achievement {
  id: string; // The unique name of the achievement.
  title: string; // The title shown to the user.
  blurb: string; // A short sentence that explains how to earn it.
  icon: string; // The symbol shown next to it.
  check: (facts: AchievementFacts) => boolean; // Answers true once the achievement is earned.
}

// The facts an achievement rule looks at.
export interface AchievementFacts {
  items: CollectionItem[]; // All saved items.
  progress: ProgressData; // The user's progress.
}

// One level of the points system.
export interface Level {
  min: number; // The points needed to reach it.
  name: string; // The name of the level.
}

// The progress as the screen shows it.
export interface ProgressView {
  points: number; // The total points.
  history: HistoryEntry[]; // The recent history.
  explored: string[]; // The explored planets.
  level: string; // The name of the current level.
  nextLevel: Level | null; // The next level, or null at the top.
  levelPercent: number; // The percent towards the next level.
  savedCount: number; // How many items are saved.
  // The achievements, each with the time it was unlocked (or null).
  achievements: Array<
    Pick<Achievement, "id" | "title" | "blurb" | "icon"> & {
      unlockedAt: number | null;
    }
  >;
}

// The kinds of pop-up message.
export type ToastKind = "info" | "success" | "error" | "achievement";

// One pop-up message.
export interface Toast {
  id: string; // The unique id of the toast.
  kind: ToastKind; // The style of the toast.
  title?: string; // The title (optional).
  body?: string; // The text under the title (optional).
  icon?: string; // A symbol (optional).
  duration: number; // How long it stays, in milliseconds (0 = until closed).
}

// What you give to pushToast. Everything except the id and all of it optional.
export type ToastInput = Partial<Omit<Toast, "id">>;

// The functions the persistence layer calls when data arrives from the database.
export interface UserDataHandlers {
  onCollection: (items: Record<string, CollectionItem>) => void; // The saved items arrived or changed.
  onExploration: (data: Partial<ProgressData> | null) => void; // The progress arrived or changed (null = new user).
  onPreferences: (preferences: Partial<Preferences> | null) => void; // The preferences arrived or changed (null = nothing saved yet).
  onError: (error: Error) => void; // Something went wrong while listening.
}

// The data parts that make up one search state.
export interface ImageSearchState {
  query: string; // The words that were searched.
  filter: string; // The chosen filter: 'all', 'planets', 'galaxies' or 'nebulae'.
  page: number; // The last page that was loaded.
  results: NasaImage[]; // The images found so far.
  total: number; // How many images exist in total for this search.
  status: RequestStatus; // The state of the request.
  error: string | null; // The error message, if there is one.
  requestId: string | null; // The id of the latest search, used to ignore old answers.
}

// The state of the picture of the day.
export interface ApodState {
  data: ApodData | null; // The picture, or null.
  status: RequestStatus; // The state of the request.
  error: string | null; // The error message, if there is one.
}

// The state of the NASA images of one planet.
export interface PlanetImagesState {
  items: NasaImage[]; // The images.
  status: RequestStatus; // The state of the request.
  error: string | null; // The error message, if there is one.
}
