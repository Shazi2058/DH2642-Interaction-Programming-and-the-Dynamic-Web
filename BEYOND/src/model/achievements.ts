/*
  Authored by Muhammad Shahwaiz Abbasi · 2026
  achievements.ts —> the rules of the progress system: achievements, point values, levels.
  Plain data and plain functions. Nothing here changes state; model/thunks.ts asks these
  questions and then dispatches the answers.
*/

// Load the types of our own data.
import type { Achievement, Level } from "./types";

// How many points each kind of action is worth.
export const POINTS = {
  visit: 5, // Points for the first visit to a planet.
  save: 10, // Points for the first time an item is saved.
  compare: 5, // Points for the first time a pair of planets is compared.
  note: 5, // Points for the first note written on an item.
  tour: 15, // Points for finishing the Grand Tour.
  achievement: 20, // Bonus points for every unlocked achievement.
} as const; // Tell that values never change.

/* check gets { items: [saved items], progress } and answers true once it is earned. */

// The list of all achievements.
export const ACHIEVEMENTS: Achievement[] = [
  // Start a new achievement.
  {
    id: "first-discovery", // The unique name of this achievement.
    title: "First Discovery", // The title shown to the user.
    blurb: "Save your first object to My Universe.", // A short sentence that explains how to earn it.
    icon: "✦", // The symbol shown next to it.

    check: ({ items }) => items.length >= 1, // Earned when at least one item is saved.
  },

  // Start a new achievement.
  {
    id: "planet-collector", // The unique name of this achievement.
    title: "Planet Collector", // The title shown to the user.
    blurb: "Save 3 planets.", // A short sentence that explains how to earn it.
    icon: "🪐", // The symbol shown next to it.
    // Earned when at least three saved items are planets.
    check: ({ items }) =>
      items.filter((i) => i.objectType === "planet").length >= 3,
  },

  // Start a new achievement.
  {
    id: "image-collector", // The unique name of this achievement.
    title: "Deep Field", // The title shown to the user.
    blurb: "Save 3 NASA images.", // A short sentence that explains how to earn it.
    icon: "🌌", // The symbol shown next to it.
    // Earned when at least three saved items are images.
    check: ({ items }) =>
      items.filter((i) => i.objectType === "image").length >= 3,
  },

  // Start a new achievement.
  {
    id: "side-by-side", // The unique name of this achievement.
    title: "Side by Side", // The title shown to the user.
    blurb: "Compare two planets.", // A short sentence that explains how to earn it.
    icon: "⚖", // The symbol shown next to it.
    check: ({ progress }) => progress.comparisons.length >= 1, // Earned when at least one pair of planets has been compared.
  },

  // Start a new achievement.
  {
    id: "field-notes", // The unique name of this achievement.
    title: "Field Notes", // The title shown to the user.
    blurb: "Write a note on a saved discovery.", // A short sentence that explains how to earn it.
    icon: "✎", // The symbol shown next to it.
    check: ({ items }) => items.some((i) => i.note && i.note.trim()), // Earned when any saved item has a note that is not empty.
  },

  // Start a new achievement.
  {
    id: "curious-mind", // The unique name of this achievement.
    title: "Curious Mind", // The title shown to the user.
    blurb: "Search NASA's library 5 times.", // A short sentence that explains how to earn it.
    icon: "🔭", // The symbol shown next to it.
    check: ({ progress }) => progress.searches.length >= 5, // Earned when at least five different searches are remembered.
  },

  // Start a new achievement.
  {
    id: "grand-tour", // The unique name of this achievement.
    title: "Grand Tour", // The title shown to the user.
    blurb: "Visit all eight planets.", // A short sentence that explains how to earn it.
    icon: "🚀", // The symbol shown next to it.
    check: ({ progress }) => progress.explored.length >= 8, // Earned when all eight planets have been visited.
  },
];

// The levels, from the lowest to the highest.
export const LEVELS: Level[] = [
  { min: 0, name: "Cadet" }, // Everyone starts here.
  { min: 40, name: "Navigator" }, // Reached at 40 points.
  { min: 100, name: "Pilot" }, // Reached at 100 points.
  { min: 200, name: "Commander" }, // Reached at 200 points.
];

/* The highest level reached with this many points. */

// Keep the levels the user has reached and take the last (highest) one.
export const levelFor = (points: number): Level =>
  LEVELS.filter((level) => points >= level.min).at(-1) ?? LEVELS[0]; // Keep the levels the user has reached and take the last one (the first level is the fallback).

/* The next level to aim for or undefined at the top. */
export const nextLevel = (points: number): Level | undefined =>
  LEVELS.find((level) => level.min > points); // Find the first level that needs more points than the user has.
