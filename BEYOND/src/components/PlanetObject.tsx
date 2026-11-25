import { useRef } from "react"
import { useFrame, type RootState } from "@react-three/fiber"
import type { Group } from "three"
import PlanetMesh from "./PlanetMesh"

type PlanetObjectProps = {
  radius: number
  color: string
  orbitRadius: number
  orbitSpeed: number
}
// orbit
export default function PlanetObject({
  radius,
  color,
  orbitRadius,
  orbitSpeed,
}: PlanetObjectProps) {
  const orbitRef = useRef<Group | null>(null)

  function orbitPlanet(_state: RootState, delta: number): void {
    if (orbitRef.current === null) return
    orbitRef.current.rotation.y += orbitSpeed * delta
  }

  useFrame(orbitPlanet)

  return (
    <group ref={orbitRef}>
      <group position={[orbitRadius, 0, 0]}>
        <PlanetMesh radius={radius} color={color} />
      </group>
    </group>
  )
}