import { useRef, useState } from "react"
import {
  useFrame,
  type RootState,
  type ThreeEvent,
} from "@react-three/fiber"
import type { Group } from "three"
import { useCursor } from "@react-three/drei"
import type { Planet } from "../data/planets"
import PlanetMesh from "./PlanetMesh"

type PlanetObjectProps = {
  planet: Planet
  selected: boolean
  onSelect: (planetId: string, planetGroup: Group) => void
}

export default function PlanetObject({
  planet,
  selected,
  onSelect,
}: PlanetObjectProps) {
  const orbitRef = useRef<Group | null>(null)
  const planetPositionRef = useRef<Group | null>(null)
  const [hovered, setHovered] = useState(false)

  function orbitPlanet(_state: RootState, delta: number): void {
    if (orbitRef.current === null) return
    orbitRef.current.rotation.y += planet.orbitSpeed * delta
  }

  function selectPlanet(event: ThreeEvent<MouseEvent>): void {
    event.stopPropagation()
    if (planetPositionRef.current != null) onSelect(planet.id, planetPositionRef.current);
  }

  function startHover(): void {
    setHovered(true)
  }

  function stopHover(): void {
    setHovered(false)
  }

  useFrame(orbitPlanet)
  useCursor(hovered)

  return (
    <group ref={orbitRef} >
      <group ref={planetPositionRef} position={[planet.orbitRadius, 0, 0]}>
        <PlanetMesh
          radius={planet.radius}
          color={planet.color}
          rotationSpeed={planet.rotationSpeed}
          selected={selected}
          hovered={hovered}
          onClick={selectPlanet}
          onPointerOver={startHover}
          onPointerOut={stopHover}
        />
      </group>
    </group>
  )
}