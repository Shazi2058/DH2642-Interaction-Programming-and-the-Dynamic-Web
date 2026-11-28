/*
  Authored by Muhammad Shahwaiz Abbasi · 2026
  helpers.ts — small plain functions that prepare data for the screen.
  They only READ what they are given: no Redux, no database, easy to test by hand.
 */

// Load the list of planets.
import { PLANETS } from "../data/planets";

// Load the level rules and the list of achievements.
import { levelFor, nextLevel, ACHIEVEMENTS } from "./achievements";

// Load the check that tells if an item id belongs to an image.
import { isImageItemId } from "./items";

// Load the types of our own data.
import type {
  CollectionItem,
  Planet,
  ProgressData,
  ProgressView,
} from "./types";

// Topics offered while typing in the search box (besides planets and saved items).

// A list of search ideas we can suggest.
export const SUGGESTED_TOPICS: string[] = [
  "Hubble deep field", // A famous Hubble picture.
  "Orion nebula", // A nebula in Orion.
  "Andromeda galaxy", // The nearest big galaxy.
  "James Webb", // The James Webb telescope.
  "Mars rover", // Rovers on Mars.
  "Black hole", // Black holes.
  "Solar eclipse", // Eclipses of the Sun.
  "Saturn rings", // The rings of Saturn.
];

// { id: item, ... } → [item, ...] with the newest saved item first.

// Turn the items object into a list, newest first.
export function itemsAsList(
  itemsById: Record<string, CollectionItem>,
): CollectionItem[] {
  return Object.values(itemsById).sort((a, b) => b.savedAt - a.savedAt); // Take the values and sort them by save time, newest first.
}

// { [nasaImageId]: true } for every saved NASA image, lets a gallery mark saved cards fast.

// Make an object that tells which NASA images are saved.
export function savedImageIds(
  itemsById: Record<string, CollectionItem>,
): Record<string, true> {
  const ids: Record<string, true> = {}; // Start with an empty object.
  // Go through every item id.
  for (const itemId of Object.keys(itemsById)) {
    if (isImageItemId(itemId)) ids[itemId.slice("img-".length)] = true; // For image items, store the image id (without the "img-" start).
  }
  return ids; // Return the finished object.
}

// Progress plus what My Universe / Profile show: level, % to next level, achievement list.

// Prepare the progress data for the screen.
export function buildProgressView(
  progress: ProgressData,
  savedCount: number,
): ProgressView {
  const level = levelFor(progress.points); // Find the current level.
  const next = nextLevel(progress.points); // Find the next level (if any).
  // Calculate how far we are to the next level, in percent.
  const levelPercent = next
    ? Math.round(((progress.points - level.min) / (next.min - level.min)) * 100) // Share of the way from this level to the next one.
    : 100; // At the top level the bar is full.

  // Return everything the screen needs.
  return {
    points: progress.points, // The total points.
    history: progress.history, // The recent history.
    explored: progress.explored, // The explored planets.
    level: level.name, // The name of the current level.
    nextLevel: next || null, // The next level, or null at the top.
    levelPercent, // The percent towards the next level.
    savedCount, // How many items are saved.

    // The achievements, each with the time it was unlocked (or null).
    achievements: ACHIEVEMENTS.map(({ id, title, blurb, icon }) => ({
      id, // The achievement id.
      title, // The title.
      blurb, // The explanation.
      icon, // The symbol.
      unlockedAt: progress.achievements[id] || null, // When it was unlocked, or null if still locked.
    })),
  };
}

// Check if a text contains a word, ignoring big and small letters.
const contains = (text: string, word: string): boolean =>
  text.toLowerCase().includes(word);

// Planets and saved items matching the search text (the local half of the search page).

// Search the planets and the saved items.
export function searchLocal(
  text: string,
  savedItems: CollectionItem[],
): { planets: Planet[]; saved: CollectionItem[] } {
  const word = text.trim().toLowerCase(); // Clean the search text.
  if (!word) return { planets: [], saved: [] }; // Nothing typed means nothing found.
  // Return the matches.
  return {
    // Planets whose name, type, description or facts contain the word.
    planets: (PLANETS as Planet[]).filter((planet) =>
      // Join all searchable text of the planet and look for the word.
      contains(
        [
          planet.name,
          planet.type,
          planet.description,
          ...(planet.facts || []),
        ].join(" "),
        word,
      ),
    ),
    // Saved items whose title or note contains the word.
    saved: savedItems.filter(
      (item) => contains(`${item.title} ${item.note || ""}`, word), // Join the title and the note and look for the word.
    ),
  };
}

/*
  Suggestions under the search box. Each has a `kind` so the view can show the right icon:
  'recent' | 'planet' | 'saved' | 'topic' | 'nasa'.
  Empty box → recent searches. Otherwise matching planets, saved items, old searches, topics,
  and always a final "Search NASA for …" entry.
 */

// One suggestion under the search box.
export interface Suggestion {
  kind: "recent" | "planet" | "saved" | "topic" | "nasa"; // The kind of suggestion.
  label: string; // The text to show.
  hint?: string; // A small hint under the text (optional).
  planetId?: string; // The planet to open when chosen (planets only).
  item?: CollectionItem; // The saved item (saved items only).
  query?: string; // The words to search for (NASA search only).
}

// Make the list of suggestions for the search box.
export function makeSuggestions(
  text: string,
  recentSearches: string[],
  savedItems: CollectionItem[],
): Suggestion[] {
  const word = text.trim().toLowerCase(); // Clean the typed text.
  // With an empty box, show only the recent searches.
  if (!word) {
    // Take the first five recent searches.
    return recentSearches
      .slice(0, 5)
      .map((label): Suggestion => ({ kind: "recent", label }));
  }
  const matches = (label: string): boolean => contains(label, word); // A small check: does this label contain the typed word?

  // Collect all possible suggestions in one list.
  const all: Suggestion[] = [
    // Planets whose name matches.
    ...(PLANETS as Planet[])
      .filter((p) => matches(p.name))
      .map((p) => ({
        kind: "planet" as const, // The kind of suggestion.
        label: p.name, // The text to show.
        hint: p.type, // A small hint under the text.
        planetId: p.id, // The planet to open when chosen.
      })),
    // Up to three saved items whose title matches.
    ...savedItems
      // Keep the matching items.
      .filter((item) => matches(item.title))
      // Keep at most three.
      .slice(0, 3)
      // Turn each item into a suggestion.
      .map((item) => ({
        kind: "saved" as const,
        label: item.title,
        hint: "In My Universe",
        item,
      })),

    // Up to two recent searches that match.
    ...recentSearches
      .filter(matches)
      .slice(0, 2)
      .map((label) => ({ kind: "recent" as const, label })),

    // Up to three topics that match.
    ...SUGGESTED_TOPICS.filter(matches)
      .slice(0, 3)
      .map((label) => ({ kind: "topic" as const, label })),
  ];

  const seen = new Set<string>(); // A set that remembers the labels we already have.

  // Remove suggestions with the same label.
  const unique = all.filter(({ label }) => {
    const key = label.toLowerCase(); // Compare labels without big and small letters.
    if (seen.has(key)) return false; // Remove it if we have seen it before.
    seen.add(key); // Remember this label.
    return true; // Keep it.
  });

  // Add the final "Search NASA" suggestion at the end.
  return [
    ...unique,
    {
      kind: "nasa",
      label: `Search NASA for “${text.trim()}”`,
      query: text.trim(),
    },
  ];
}
