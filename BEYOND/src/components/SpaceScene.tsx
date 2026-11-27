import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import type { Planet } from "../data/planets"
import PlanetObject from "./PlanetObject"
import Sun from "./Sun"
import Starfield from "./Starfield"
import { CameraRig } from "./CameraRig"
import { useState } from "react"
import type { Group } from "three"

type SpaceSceneProps = {
    planets: Planet[]
    selectedId: string | null
    onSelect: (planetId: string | null) => void
}

export default function SpaceScene({
    planets,
    selectedId,
    onSelect,
}: SpaceSceneProps) {
    function renderPlanet(planet: Planet) {
        return (
            <PlanetObject
              key={planet.id}
              planet={planet}
              selected={selectedId === planet.id}
              onSelect={handlePlanetSelect}
            />
        )
    }

    function handlePlanetSelect(planetId: string, planetGroup: Group): void {
        onSelect(planetId);
        setFocusObject(planetGroup);
    }

    const [focusObject, setFocusObject] = useState<Group | null>(null)

    function clearSelection(): void {
        onSelect(null)
        setFocusObject(null)
    }

  return (
        <Canvas
            camera={{ position: [0, 12, 18], fov: 50 }}
            onPointerMissed={clearSelection}
        >
            <CameraRig focusObject={focusObject}/>
            <color attach="background" args={["#050816"]} />
            <Starfield />
      <Sun />
      <ambientLight intensity={0.4} />
      {planets.map(renderPlanet)}
            <OrbitControls enableDamping minDistance={4} maxDistance={30} />
        </Canvas>
  )
}