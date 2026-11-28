/*
  Authored by Muhammad Shahwaiz Abbasi · 2026
  selectors.ts —> the ONLY way presenters read the store. One small function per question
  ("is Saturn saved?", "what do I show on My Universe?"), so presenters stay one-liners and
  the shape of the state can change without touching them.
 
  Selectors that build a new array/object are memoised with createSelector; without that,
  react-redux would think the data changed on every render.
 */
// Load the function that makes selectors remember their last answer.
import { createSelector } from "@reduxjs/toolkit";

// Load the helper functions that prepare data for the screen.
import { itemsAsList, savedImageIds, buildProgressView } from "./helpers";

// Load the functions that make item ids.
import { planetItemId, imageItemId } from "./items";

// Load the types of the store and of our own data.
import type { RootState } from "./store";
import type {
  ApodState,
  CollectionItem,
  ImageSearchState,
  Planet,
  PlanetImagesState,
} from "./types";

// --- user / auth ---

// The signed-in user, or null.
export const selectUser = (state: RootState) => state.user.user;

// Do we know yet if someone is signed in: 'loading' or 'ready'.
export const selectAuthStatus = (state: RootState) => state.user.status;

// The mode: 'firebase' or 'local'.
export const selectAuthMode = (state: RootState) => state.user.mode;

// True while a sign-in request runs.
export const selectAuthBusy = (state: RootState) => state.user.busy;

// The message for the sign-in form.
export const selectAuthError = (state: RootState) => state.user.error;

// The user's settings.
export const selectPreferences = (state: RootState) => state.user.preferences;

// --- planets / 3D scene ---

// The list of all planets.
export const selectCatalogue = (state: RootState) => state.planets.catalogue;

// The id of the selected planet.
export const selectSelectedId = (state: RootState) => state.planets.selectedId;

// The counter that tells the camera to return to the overview.
export const selectCameraNonce = (state: RootState) =>
  state.planets.cameraNonce;

// The 3D view mode.
export const selectViewMode = (state: RootState) => state.planets.viewMode;

// The Grand Tour state.
export const selectTour = (state: RootState) => state.planets.tour;

// The selected planet object, or null.
export const selectSelectedPlanet = (state: RootState): Planet | null =>
  // Look for the planet whose id is selected.
  state.planets.catalogue.find((p) => p.id === state.planets.selectedId) ||
  null;

// One planet by its id, or null.
export const selectPlanetById = (
  state: RootState,
  planetId: string,
): Planet | null =>
  // Look for the planet with this id.
  state.planets.catalogue.find((p) => p.id === planetId) || null;

// --- comparison ---
// The two planet ids being compared.
export const selectComparisonIds = (state: RootState) => state.comparison.ids;

// The two planet objects being compared.
export const selectComparedPlanets = createSelector(
  // The inputs: the catalogue and the two ids.
  [selectCatalogue, selectComparisonIds],
  // Turn each id into its planet object.
  (catalogue: Planet[], ids: string[]) =>
    ids.map((id) => catalogue.find((p) => p.id === id) || null),
);

// --- collection (My Universe) ---

// The items object (used by other selectors).
const selectItemsById = (state: RootState): Record<string, CollectionItem> =>
  state.collection.items;

// True once the saved items have arrived from the database.
export const selectCollectionLoaded = (state: RootState) =>
  state.collection.loaded;

// The saved items as a list, newest first.
export const selectCollectionList = createSelector(
  [selectItemsById],
  itemsAsList,
);

// An object that tells which NASA images are saved.
export const selectSavedImageIds = createSelector(
  [selectItemsById],
  savedImageIds,
);

// Is this planet saved?
export const selectIsPlanetSaved = (
  state: RootState,
  planetId: string,
): boolean =>
  // True if an item exists for this planet.
  Boolean(state.collection.items[planetItemId(planetId)]);

// Is this image saved?
export const selectIsImageSaved = (
  state: RootState,
  imageId: string,
): boolean =>
  // True if an item exists for this image.
  Boolean(state.collection.items[imageItemId(imageId)]);

// --- progress ---

// The progress prepared for the screen.
export const selectProgressView = createSelector(
  // The inputs: the progress and the saved items list.
  [(state: RootState) => state.progress, selectCollectionList],
  // Build the view using the number of saved items.
  (progress: RootState["progress"], items: CollectionItem[]) =>
    buildProgressView(progress, items.length),
);

// The recent search words.
export const selectRecentSearches = (state: RootState) =>
  state.progress.searches;

// The recent history of visited objects.
export const selectHistory = (state: RootState) => state.progress.history;

//--- NASA data ---

// The picture of the day.
export const selectApod = (state: RootState): ApodState => state.discovery.apod;

// The NASA image search.
export const selectImageSearch = (state: RootState): ImageSearchState =>
  state.discovery.imageSearch;

// The images of one planet (or an empty "idle" answer).
export const selectPlanetImages = (
  state: RootState,
  planetId: string,
): PlanetImagesState =>
  // Use the saved answer, or an empty one if we have not asked yet.
  state.discovery.planetImages[planetId] || {
    items: [],
    status: "idle",
    error: null,
  };

// True when the last search has more results than are shown ("Load more" button).

// Should the "Load more" button be shown?
export const selectCanLoadMore = (state: RootState): boolean => {
  // Take the values we need from the search.
  const { results, total, status } = state.discovery.imageSearch;
  // More can be loaded when we are not loading and some results are still missing.
  return status !== "loading" && results.length < total;
};

// --- interface ---

// The list of toasts.
export const selectToasts = (state: RootState) => state.ui.toasts;

// The image shown in the viewer, or null.
export const selectViewer = (state: RootState) => state.ui.viewer;

// Has the intro been seen?
export const selectIntroSeen = (state: RootState) => state.ui.introSeen;
