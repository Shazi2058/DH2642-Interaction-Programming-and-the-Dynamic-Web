export type Planet = {
    id: string
    name: string
    radius: number
    orbitRadius: number
    orbitSpeed: number
    color: string
}

export const planets: Planet[] = [
  {
    id: "mercury",
    name: "Mercury",
    radius: 0.18,
    orbitRadius: 2,
    orbitSpeed: 0.8,
    color: "#b5b2aa",
  },
  {
    id: "venus",
    name: "Venus",
    radius: 0.3,
    orbitRadius: 2.8,
    orbitSpeed: 0.62,
    color: "#d7b477",
  },
  {
    id: "earth",
    name: "Earth",
    radius: 0.33,
    orbitRadius: 3.6,
    orbitSpeed: 0.5,
    color: "#4c8bd8",
  },
  {
    id: "mars",
    name: "Mars",
    radius: 0.25,
    orbitRadius: 4.5,
    orbitSpeed: 0.4,
    color: "#c76d4b",
  },
  {
    id: "jupiter",
    name: "Jupiter",
    radius: 0.8,
    orbitRadius: 5.8,
    orbitSpeed: 0.22,
    color: "#c9a27c",
  },
  {
    id: "saturn",
    name: "Saturn",
    radius: 0.7,
    orbitRadius: 7,
    orbitSpeed: 0.16,
    color: "#d6c18a",
  },
  {
    id: "uranus",
    name: "Uranus",
    radius: 0.5,
    orbitRadius: 8.2,
    orbitSpeed: 0.12,
    color: "#7dcbd0",
  },
  {
    id: "neptune",
    name: "Neptune",
    radius: 0.48,
    orbitRadius: 9.4,
    orbitSpeed: 0.09,
    color: "#527ad1",
  },
]