import { useRef } from "react"
import {
    useFrame,
    type RootState,
    type ThreeEvent,
} from "@react-three/fiber"
import type { Mesh } from "three"

type PlanetMeshProps = {
    radius: number
    color: string
    rotationSpeed: number
    selected: boolean
    hovered: boolean
    onClick: (event: ThreeEvent<MouseEvent>) => void
    onPointerOver: () => void
    onPointerOut: () => void
}

export default function PlanetMesh({
    radius,
    color,
    rotationSpeed,
    selected,
    hovered,
    onClick,
    onPointerOver,
    onPointerOut,
}: PlanetMeshProps) {
    function rotatePlanet(_state: RootState, delta: number): void {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * rotationSpeed
        }
    }

    const meshRef = useRef<Mesh | null>(null)
    useFrame(rotatePlanet)
    const glowIntensity = selected ? 0.9 : hovered ? 0.35 : 0
    
    return (
        <mesh
            ref={meshRef}
            onClick={onClick}
            onPointerOver={onPointerOver}
            onPointerOut={onPointerOut}
        >
            <sphereGeometry args={[radius, 32, 32]} />
            <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={glowIntensity}
            />
        </mesh>
    )
}