/*
  Authored by Muhammad Shahwaiz Abbasi · 2026
  discoverySlice —> everything that comes from NASA.
 
  Every request has a status the screen can react to:
       idle → loading → success or error
  This file only STORES results. The functions that ask NASA (loadApod, searchImages,
  loadPlanetImages) are in model/thunks.ts and the HTTP calls are in sources/.
 
  Out-of-order answers. Each search gets a requestId. An answer is thrown away unless its
  id matches the latest search, so a slow old search can never replace a newer one.
 */

// Load the function that creates a slice and the function that makes unique ids.
import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";
// Load the types of our own data.
import type {
  ApodData,
  ApodState,
  ImageSearchState,
  NasaImage,
  PlanetImagesState,
} from "./types";

// The shape of this part of the state.
interface DiscoveryState {
  apod: ApodState; // The picture of the day.
  imageSearch: ImageSearchState; // The NASA image search.
  planetImages: Record<string, PlanetImagesState>; // The NASA images of each planet, found by planet id.
}

// The most NASA images we keep for one planet.
const PLANET_IMAGE_LIMIT = 12;

// Create the slice for NASA data.
const discoverySlice = createSlice({
  name: "discovery", // The name of this part of the state.
  // The start values.
  initialState: {
    apod: { data: null, status: "idle", error: null }, // The picture of the day.

    // The NASA image search.
    imageSearch: {
      query: "", // The words that were searched.
      filter: "all", // The chosen filter: 'all', 'planets', 'galaxies' or 'nebulae'.
      page: 1, // The last page that was loaded.
      results: [], // The images found so far.
      total: 0, // How many images exist in total for this search.
      status: "idle", // The state of the request: idle, loading, success or error.
      error: null, // The error message, if there is one.
      requestId: null, // The id of the latest search, used to ignore old answers.
    },

    planetImages: {}, // The NASA images for each planet, like { saturn: { items, status, error } }.

    // Tell TypeScript this object has the shape described above.
  } as DiscoveryState,

  // The only functions allowed to change this part of the state.
  reducers: {
    // ----- picture of the day -----

    // We started asking for the picture of the day.
    apodRequested(state) {
      state.apod.status = "loading"; // Show that we are loading.
      state.apod.error = null; // Remove the old error.
    },

    // The picture of the day arrived.
    apodReceived(state, action: PayloadAction<ApodData>) {
      state.apod = { data: action.payload, status: "success", error: null }; // Save the picture and mark success.
    },

    // Asking for the picture of the day failed.
    apodFailed(
      state,
      action: PayloadAction<{ message: string; fallback?: ApodData }>,
    ) {
      const { message, fallback } = action.payload; // Get the message and the optional built-in picture.
      state.apod = { data: fallback || null, status: "error", error: message }; // Save the fallback picture (if any) so the page is not empty, and the error.
    },

    // ----- image search -----

    // We started a search.
    searchRequested: {
      // `prepare` adds a unique id to this search.
      prepare: ({
        query,
        filter,
        page,
      }: {
        query: string;
        filter: string;
        page: number;
      }) => ({
        // Build the data that goes into the reducer.
        payload: { query, filter, page, requestId: nanoid() },
      }),
      // Record the start of the search.
      reducer(
        state,
        action: PayloadAction<{
          query: string;
          filter: string;
          page: number;
          requestId: string;
        }>,
      ) {
        const { query, filter, page, requestId } = action.payload; // Get all the values of the search.
        const search = state.imageSearch; // Short name for the search part of the state.
        search.query = query; // Save the words.
        search.filter = filter; // Save the filter.
        search.requestId = requestId; // Save the id of this search.
        search.status = "loading"; // Show that we are loading.

        search.error = null; // Remove the old error.

        // A new search (page 1) starts from nothing.
        if (page === 1) {
          search.results = []; // Clear the old results ("Load more" keeps them).
          search.total = 0; // Reset the total.
          search.page = 1; // Go back to page 1.
        }
      },
    },

    // Search results arrived.
    searchReceived(
      state,
      action: PayloadAction<{
        requestId: string;
        items: NasaImage[];
        total: number;
        page: number;
      }>,
    ) {
      const { requestId, items, total, page } = action.payload; // Get the values of the answer.
      const search = state.imageSearch; // Short name for the search part of the state.
      if (requestId !== search.requestId) return; // Ignore the answer if a newer search was started.
      search.results = page === 1 ? items : [...search.results, ...items]; // Page 1 replaces the list. later pages are added to it.
      search.total = total; // Save the total number of results.
      search.page = page; // Save the page we are on.
      search.status = "success"; // Mark success.
    },

    // The search failed.
    searchFailed(
      state,
      action: PayloadAction<{ requestId: string; message: string }>,
    ) {
      const { requestId, message } = action.payload; // Get the id of the search and the error message.
      if (requestId !== state.imageSearch.requestId) return; // Ignore the error if a newer search was started.
      state.imageSearch.status = "error"; // Mark the error.
      state.imageSearch.error = message; // Save the message.
    },

    // ----- images for one planet -----

    // We started asking for the images of a planet.
    planetImagesRequested(state, action: PayloadAction<string>) {
      // Show that this planet is loading, with no images yet.
      state.planetImages[action.payload] = {
        items: [],
        status: "loading",
        error: null,
      };
    },

    // The images of a planet arrived.
    planetImagesReceived(
      state,
      action: PayloadAction<{ planetId: string; items: NasaImage[] }>,
    ) {
      const { planetId, items } = action.payload; // Get the planet id and its images.
      // Save the first images only, and mark success.
      state.planetImages[planetId] = {
        items: items.slice(0, PLANET_IMAGE_LIMIT), // Keep at most the allowed number of images.
        status: "success", // Mark success.
        error: null, // No error.
      };
    },

    // Asking for the images of a planet failed.
    planetImagesFailed(
      state,
      action: PayloadAction<{ planetId: string; message: string }>,
    ) {
      const { planetId, message } = action.payload; // Get the planet id and the error message.
      // Save the error for this planet, with no images.
      state.planetImages[planetId] = {
        items: [],
        status: "error",
        error: message,
      };
    },
  },
});

// Let other files use the action functions.
export const {
  apodRequested,
  apodReceived,
  apodFailed,
  searchRequested,
  searchReceived,
  searchFailed,
  planetImagesRequested,
  planetImagesReceived,
  planetImagesFailed,
} = discoverySlice.actions; // Take these action functions out of the slice.

export default discoverySlice.reducer; // Let the store use the reducer.
