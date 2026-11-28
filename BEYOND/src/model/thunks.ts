/*
  Authored by Muhammad Shahwaiz Abbasi · 2026
  thunks.ts —> every user ACTION in the app, written as one readable function.
 
  A thunk is a function that can do several steps in order. Presenters call exactly ONE of
  these per user event e.g.  dispatch(savePlanet(planet)). Each one:
    1. changes the state       (dispatch slice actions)
    2. gives feedback          (points, achievements, toasts)
  Saving to the database is NOT done here. model/sideEffects.ts reacts to the state changes.
  Talking to NASA is done through sources folder
 */

// Load the achievement rules and the point values.
import { ACHIEVEMENTS, POINTS } from "./achievements";

// Load the actions about saved items.
import { saveItem, removeItem, setNote } from "./collectionSlice";

// Load the action that sets the compared planets.
import { setComparison } from "./comparisonSlice";

// Load the actions about NASA data.
import {
  apodRequested, // Asking for the picture of the day started.
  apodReceived, // The picture of the day arrived.
  apodFailed, // The picture of the day failed.
  searchRequested, // A search started.
  searchReceived, // Search results arrived.
  searchFailed, // The search failed.
  planetImagesRequested, // Asking for planet images started.
  planetImagesReceived, // Planet images arrived.
  planetImagesFailed, // Planet images failed.
} from "./discoverySlice";

// Load the functions that build items and item ids.
import {
  makePlanetItem,
  makeImageItem,
  planetItemId,
  imageItemId,
} from "./items";

// Load the actions about planets and the Grand Tour.
import {
  selectPlanet, // Select a planet.
  clearSelection, // Remove the selection.
  resetView, // Remove the selection and move the camera back.
  startTour, // Start the Grand Tour.
  setTourStep, // Go to a step of the Grand Tour.
  endTour, // Stop the Grand Tour.
} from "./planetsSlice";

// Load the actions about progress.
import {
  visited, // A planet was visited.
  compared, // Two planets were compared.
  searched, // A search was made.
  clearSearches, // The searches were cleared.
  pointsAwarded, // Points were given.
  achievementUnlocked, // An achievement was unlocked.
} from "./progressSlice";

// Load the selector that tells if more search results can be loaded.
import { selectCanLoadMore } from "./selectors";

// Load the action that shows a toast.
import { pushToast } from "./uiSlice";

// Load the actions about signing in.
import { setUser, authStarted, authFinished, authFailed } from "./userSlice";

// Load all sign-in functions under the name "auth".
import * as auth from "../persistence/authSource";

// Load the function that gets the picture of the day (Person 2).
import { fetchApod as rawFetchApod } from "../sources/apodSource";

// Load the function that searches NASA images, under another name to avoid a clash (Person 2).
import { searchImages as rawFetchImages } from "../sources/nasaImageSource";

// Load the list of Grand Tour stops (Person 1/4's data), under another name so we can give it a type.
import { TOUR_STOPS as RAW_TOUR_STOPS } from "../data/tour";

// Load the types of the store and of our own data.
import type { AppThunk, RootState } from "./store";
import type {
  ApodData,
  ApodError,
  CollectionItem,
  ImageSearchResult,
  NasaImage,
  Planet,
  TourStop,
} from "./types";

const TOUR_STOPS = RAW_TOUR_STOPS as TourStop[]; // The Grand Tour stops, typed.
const fetchApod = rawFetchApod as () => Promise<ApodData>; // The picture-of-the-day function, typed: no input, gives back the picture.

// The image-search function, typed: takes the search values, gives back one page of results.
const fetchImages = rawFetchImages as (params: {
  query: string; // The words to search for.
  filter: string; // The filter.
  page: number; // The page number, starting at 1.
}) => Promise<ImageSearchResult>;

// Shared steps -----------

/*
  Points and achievements are only counted when they can be kept: for a visitor (not signed
  in) always, for a signed-in user only after their saved progress has arrived — otherwise
  the saved numbers would be overwritten by an empty start.
 */

// True if nobody is signed in or the signed-in user's progress has loaded.
const canTrackProgress = (state: RootState): boolean =>
  !state.user.user || state.progress.loaded;

// Unlock every achievement the user has now earned (and say so).

// Check all achievements and unlock the new ones.
const unlockEarnedAchievements = (): AppThunk => (dispatch, getState) => {
  const state = getState(); // Read the current state.
  if (!canTrackProgress(state)) return; // Stop if progress cannot be kept yet.
  // Collect the facts that the achievement rules need.
  const facts = {
    items: Object.values(state.collection.items),
    progress: state.progress,
  };

  // Go through every achievement.
  for (const achievement of ACHIEVEMENTS) {
    // Skip it if it is already unlocked or not earned yet.
    if (
      state.progress.achievements[achievement.id] ||
      !achievement.check(facts)
    )
      continue;
    dispatch(achievementUnlocked(achievement.id)); // Mark the achievement as unlocked.
    // Give the bonus points once.
    dispatch(
      pointsAwarded({
        key: `achievement-${achievement.id}`,
        points: POINTS.achievement,
      }),
    );

    // Tell the user with a toast.
    dispatch(
      // Build the toast.
      pushToast({
        kind: "achievement", // Use the achievement style.
        icon: achievement.icon, // Show the achievement symbol.
        title: `Achievement unlocked: ${achievement.title}`, // Show the title.
        body: achievement.blurb, // Show how it was earned.
      }),
    );
  }
};

// Give points once for key, then check achievements.

// Give points one time and then look for new achievements.
const award =
  (key: string, points: number): AppThunk =>
  (dispatch, getState) => {
    if (!canTrackProgress(getState())) return; // Stop if progress cannot be kept yet.
    dispatch(pointsAwarded({ key, points })); // Give the points (only the first time for this key).
    dispatch(unlockEarnedAchievements()); // Check if an achievement was earned.
  };

// Accepts either an object with an id, or the id itself.

// Return the id, whether we got an id or an object.
const idOf = (objectOrId: string | { id: string }): string =>
  typeof objectOrId === "string" ? objectOrId : objectOrId.id; // Use it as it is if it is text, otherwise take its id.

// My Universe: saving and removing  -----------------------------------

// Add an item, show a message, award points. (Database write: sideEffects.ts)

// Save an item to My Universe.
const saveToCollection =
  (item: CollectionItem): AppThunk =>
  (dispatch, getState) => {
    if (getState().collection.items[item.id]) return; // Stop if it is already saved, so its note and date stay.
    dispatch(saveItem(item)); // Add the item to the collection.
    // Show a confirmation message.
    dispatch(
      // Build the toast.
      pushToast({
        kind: "success", // Use the success style.
        title: "Added to My Universe", // The title of the message.
        // Signed-in users see the item name; visitors also see a hint to sign in.
        body: getState().user.user
          ? item.title
          : `${item.title} — sign in to keep it`,
      }),
    );
    dispatch(award(`save-${item.id}`, POINTS.save)); // Give points the first time this item is saved.
  };

// Remove an item from My Universe by its item id.
export const removeSavedItem =
  (itemId: string): AppThunk =>
  (dispatch, getState) => {
    const item = getState().collection.items[itemId]; // Find the item so we can show its name.
    if (!item) return; // Stop if it is not saved.
    dispatch(removeItem(itemId)); // Remove the item from the collection.
    // Show a message that it was removed.
    dispatch(
      pushToast({
        kind: "info",
        title: "Removed from My Universe",
        body: item.title,
      }),
    );
  };

// Save a planet.
export const savePlanet = (planet: Planet): AppThunk =>
  saveToCollection(makePlanetItem(planet));

// Save a NASA image.
export const saveImage = (image: NasaImage): AppThunk =>
  saveToCollection(makeImageItem(image));

// Remove a planet (give the planet or its id).
export const removePlanet = (planetOrId: string | { id: string }): AppThunk =>
  removeSavedItem(planetItemId(idOf(planetOrId)));

// Remove a NASA image (give the image or its id).
export const removeImage = (imageOrId: string | { id: string }): AppThunk =>
  removeSavedItem(imageItemId(idOf(imageOrId)));

// For the Save buttons: save when not saved yet, otherwise remove.

// Save the planet if it is not saved, otherwise remove it.
export const togglePlanet =
  (planet: Planet): AppThunk =>
  (dispatch, getState) =>
    // Dispatch either the remove or the save operation.
    dispatch(
      // Choose by checking if the planet is already saved.
      getState().collection.items[planetItemId(planet.id)]
        ? removePlanet(planet)
        : savePlanet(planet),
    );

// Save the image if it is not saved, otherwise remove it.
export const toggleImage =
  (image: NasaImage): AppThunk =>
  (dispatch, getState) =>
    // Dispatch either the remove or the save operation.
    dispatch(
      // Choose by checking if the image is already saved.
      getState().collection.items[imageItemId(image.id)]
        ? removeImage(image)
        : saveImage(image),
    );

// Write a personal note on a saved item.

// Save a note on an item.
export const saveNote =
  (itemId: string, note: string): AppThunk =>
  (dispatch) => {
    dispatch(setNote({ id: itemId, note })); // Store the note on the item.
    if (note.trim()) dispatch(award(`note-${itemId}`, POINTS.note)); // Give points the first time a real note is written on this item.
  };

// Exploring ------------------

// A planet was chosen (in the 3D scene, a list, a link…). Pass null to close the selection.

// Select a planet and record the visit.
export const visitPlanet =
  (planetId: string | null): AppThunk =>
  (dispatch, getState) => {
    const state = getState(); // Read the current state.
    const planet = state.planets.catalogue.find((p) => p.id === planetId); // Find the planet in the catalogue.
    // If there is no such planet (or null was given)close the selection.
    if (!planet) {
      dispatch(clearSelection());
      return; // Nothing more to do.
    }

    // Select the planet.
    dispatch(selectPlanet(planet.id));

    // Only record progress when it can be kept.
    if (canTrackProgress(state)) {
      dispatch(visited({ id: planet.id, type: "planet", title: planet.name })); // Add the planet to the history and the explored list.
      dispatch(award(`visit-${planet.id}`, POINTS.visit)); // Give points for the first visit.
    }
  };

// Show two planets side by side on the Compare page.

// Choose two planets to compare.
export const comparePlanets =
  (firstId: string, secondId: string): AppThunk =>
  (dispatch, getState) => {
    dispatch(setComparison([firstId, secondId])); // Show the two planets on the Compare page.
    if (firstId === secondId || !canTrackProgress(getState())) return; // Stop if it is the same planet twice or progress cannot be kept.
    dispatch(compared([firstId, secondId])); // Record that this pair was compared.
    dispatch(
      award(`compare-${[firstId, secondId].sort().join("-")}`, POINTS.compare),
    ); // Give points once for this pair, in any order.
  };

// Grand Tour ----------

// Make the scene show whatever the current tour stop is about.

// Show the current stop of the Grand Tour.
const showTourStop = (): AppThunk => (dispatch, getState) => {
  const { step } = getState().planets.tour; // Find the current step number.
  const stop = TOUR_STOPS[step]; // Find the stop that belongs to this step.
  // A stop with a planet selects it.
  if (stop.planetId)
    dispatch(visitPlanet(stop.planetId)); // A stop with a planet selects it.
  else dispatch(resetView()); // A stop without a planet shows the whole solar system.
  if (step === TOUR_STOPS.length - 1)
    dispatch(award("tour-complete", POINTS.tour)); // At the last stop, give points once for finishing the tour.
};

// Start the Grand Tour.
export const startGrandTour = (): AppThunk => (dispatch) => {
  dispatch(startTour()); // Turn the tour on at step 0.
  dispatch(showTourStop()); // Show the first stop.
};

// Go to the next stop.
export const nextTourStop = (): AppThunk => (dispatch, getState) => {
  // Move one step forward, but not past the last stop.
  dispatch(
    setTourStep(
      Math.min(getState().planets.tour.step + 1, TOUR_STOPS.length - 1),
    ),
  );
  dispatch(showTourStop()); // Show that stop.
};

// Go to the previous stop.
export const previousTourStop = (): AppThunk => (dispatch, getState) => {
  dispatch(setTourStep(Math.max(getState().planets.tour.step - 1, 0))); // Move one step back, but not before the first stop.
  dispatch(showTourStop()); // Show that stop.
};

// Leave the Grand Tour.
export const leaveGrandTour = (): AppThunk => (dispatch) => {
  dispatch(endTour()); // Stop the tour.
};

// NASA data ---------

// Picture of the day. Does nothing while loading or once loaded; retries after an error.

// Load the picture of the day.
export const loadApod =
  (): AppThunk<Promise<void>> => async (dispatch, getState) => {
    const { status } = getState().discovery.apod; // Read the current status of the picture.
    if (status === "loading" || status === "success") return; // Stop if it is loading or already loaded.
    dispatch(apodRequested()); // Say that loading has started.
    // Try to get the picture.
    try {
      dispatch(apodReceived(await fetchApod())); // Wait for the picture and store it.
      // If it failed, store the error and the built-in picture (if any).
    } catch (error) {
      dispatch(
        apodFailed({
          message: (error as ApodError).message,
          fallback: (error as ApodError).fallback,
        }),
      );
    }
  };

// Fetch one page of search results. page 1 = new search, page 2+ = "Load more".

// Ask NASA for one page of search results.
const fetchSearchPage =
  (query: string, filter: string, page: number): AppThunk<Promise<void>> =>
  async (dispatch) => {
    const request = searchRequested({ query, filter, page }); // Create the "search started" action.
    dispatch(request); // Send it, so the screen shows loading.
    const { requestId } = request.payload; // Take the id of this search; the slice ignores answers from older searches.
    // Try to get the results.
    try {
      const { items, total } = await fetchImages({ query, filter, page }); // Ask NASA and wait for the items and the total.
      dispatch(searchReceived({ requestId, items, total, page })); // Store the results.
      // If it failed store the error.
    } catch (error) {
      dispatch(searchFailed({ requestId, message: (error as Error).message }));
    }
  };

// Search NASA's image library and remember the search word.

// Start a new search.
export const searchImages =
  // The words to search for and an optional filter.
  (query: string, filter: string = "all"): AppThunk<Promise<void>> =>
    // The thunk itself.
    (dispatch) => {
      const text = query.trim(); // Remove spaces around the words.
      if (text) dispatch(searched(text)); // Remember the search word if it is not empty.
      return dispatch(fetchSearchPage(text, filter, 1)); // Load the first page of results.
    };

// "Load more": the next page of the current search.

// Load the next page of the current search.
export const loadMoreImages =
  (): AppThunk<Promise<void> | undefined> => (dispatch, getState) => {
    const state = getState(); // Read the current state.
    if (!selectCanLoadMore(state)) return; // Stop if there is nothing more to load.
    const { query, filter, page } = state.discovery.imageSearch; // Take the current search values.
    return dispatch(fetchSearchPage(query, filter, page + 1)); // Load the next page.
  };

// Delete the list of recent searches.
export const forgetRecentSearches = (): AppThunk => (dispatch) => {
  dispatch(clearSearches()); // Remove all recent searches.
};

// NASA pictures for one planet's detail page.

// Load NASA images for one planet.
export const loadPlanetImages =
  (planetId: string): AppThunk<Promise<void>> =>
  async (dispatch, getState) => {
    const state = getState(); // Read the current state.
    const existing = state.discovery.planetImages[planetId]; // Look if we already asked for this planet.
    if (existing && existing.status !== "error") return; // Stop if it is already loading or loaded.

    const planet = state.planets.catalogue.find((p) => p.id === planetId); // Find the planet in the catalogue.

    if (!planet) return; // Stop if the planet does not exist.
    dispatch(planetImagesRequested(planetId)); // Say that loading has started.
    // Try to get the images.
    try {
      // Search NASA using the planet's search word or its name.
      const { items } = await fetchImages({
        query: planet.searchTerm || planet.name, // The words to search for.
        filter: "all", // No filter.
        page: 1, // The first page.
      });
      dispatch(planetImagesReceived({ planetId, items })); // Store the images.
      // If it failed store the error.
    } catch (error) {
      dispatch(
        planetImagesFailed({ planetId, message: (error as Error).message }),
      );
    }
  };

// Signing in and out ---------

/*
  Run a sign-in action: show "busy", then finish or show the error. When it succeeds
  Firebase tells model/startup.ts, which loads the user's data — so nothing else is needed.
 */

// Run one sign-in action and handle busy and error states.
const runAuth =
  <T>(authAction: () => Promise<T>): AppThunk<Promise<T | undefined>> =>
  async (dispatch) => {
    dispatch(authStarted()); // Show that we are busy.
    // Try the action.
    try {
      const user = await authAction(); // Run it and wait for the user.
      dispatch(authFinished()); // We are not busy any more.
      return user; // Give the user back to the caller.
      // If it failed show a friendly error message.
    } catch (error) {
      dispatch(authFailed(auth.friendlyAuthError(error)));
    }
  };

// Sign in with email and password.
export const signIn = (email: string, password: string) =>
  runAuth(() => auth.signInEmail(email, password));

export const signInWithGoogle = () => runAuth(() => auth.signInGoogle()); // Sign in with Google.

export const signOut = () => runAuth(() => auth.signOutUser()); // Sign out.

// Register. Afterwards set the user again: Firebase announced them before their name was saved.

// Create a new account.
export const signUp =
  (email: string, password: string, name?: string): AppThunk<Promise<void>> =>
  async (dispatch) => {
    // Create the account and wait for the new user.
    const user = await dispatch(
      runAuth(() => auth.signUpEmail(email, password, name)),
    );
    if (user) dispatch(setUser(user)); // If it worked, store the user again so the name is correct.
  };
