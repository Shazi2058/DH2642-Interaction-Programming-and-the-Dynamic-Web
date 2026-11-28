/*
  Authored by Muhammad Shahwaiz Abbasi · 2026
  items.ts —> turns a planet or a NASA image into the plain object that is stored in the
  user's collection (My Universe). Only data shaping, no Redux, no database.
 
  Every collection item has id, objectType ('planet' | 'image'), objectId, title,
  subtitle, imageUrl, note, savedAt plus a few extra fields for images.
 */

// Load the types of our own data.
import type { CollectionItem, NasaImage, Planet } from "./types";

export const planetItemId = (planetId: string): string => `planet-${planetId}`; // Make the item id for a planet, for example "planet-saturn".

export const imageItemId = (imageId: string): string => `img-${imageId}`; // Make the item id for an image, for example "img-123".

// Check if an item id belongs to an image.
export const isImageItemId = (itemId: string): boolean =>
  itemId.startsWith("img-");

// Build the collection item for a planet.
export function makePlanetItem(planet: Planet): CollectionItem {
  // Return the new item.
  return {
    id: planetItemId(planet.id), // The id used to store the item.
    objectType: "planet", // Tell that this item is a planet.
    objectId: planet.id, // The id of the planet itself.
    title: planet.name, // The name shown to the user.
    subtitle: planet.type, // The planet type shown under the name.
    imageUrl: planet.imageUrl || null, // The picture of the planet, or null if there is none.
    note: "", // The user's note, empty at the start.
    savedAt: Date.now(), // The time when it was saved, in milliseconds.
  };
}

// Build the collection item for a NASA image.
export function makeImageItem(image: NasaImage): CollectionItem {
  const imageUrl = image.imageUrl || image.url || null; // Take the picture address from either field name.
  // Return the new item.
  return {
    id: imageItemId(image.id), // The id used to store the item.
    objectType: "image", // Tell that this item is an image.
    objectId: image.id, // The id of the image itself.
    title: image.title, // The title shown to the user.
    subtitle: image.source || "NASA", // Where the image comes from, "NASA" if unknown.
    imageUrl, // The normal-size picture address.
    hdUrl: image.hdUrl || imageUrl, // The large picture address, or the normal one if there is no large one.
    description: (image.description || image.explanation || "").slice(0, 1200), // The description, cut to 1200 letters so it stays small.
    credit: image.credit || "", // Who made the image (the credit).
    date: image.date || "", // The date of the image.
    note: "", // The user's note, empty at the start.
    savedAt: Date.now(), // The time when it was saved, in milliseconds.
  };
}
