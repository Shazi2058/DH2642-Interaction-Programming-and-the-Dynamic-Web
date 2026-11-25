import { useRef } from "react"
import { useFrame, type RootState } from "@react-three/fiber"
import type { Mesh } from "three"

type PlanetMeshProps = {
    radius: number
    color: string
}

export default function PlanetMesh({ radius, color }: PlanetMeshProps) {
    function rotatePlanet(_state: RootState, delta: number): void {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * 0.5
        }
    }

    const meshRef = useRef<Mesh | null>(null)
    useFrame(rotatePlanet)
    
    return (
        <mesh
        ref={meshRef}>
            <sphereGeometry args={[radius, 32, 32]} />
            <meshStandardMaterial color={color} />
        </mesh>
    )
}