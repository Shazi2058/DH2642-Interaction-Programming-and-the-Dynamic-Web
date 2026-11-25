import { Canvas } from "@react-three/fiber"
import { planets, type Planet } from "../data/planets"
import PlanetObject from "./PlanetObject"
import Sun from "./Sun"
import StarField from "./Starfield"


export default function SpaceScene() {
    function renderPlanet(planet: Planet) {
        return (
            <PlanetObject
            key={planet.id}
            radius={planet.radius}
            color={planet.color}
            orbitRadius={planet.orbitRadius}
            orbitSpeed={planet.orbitSpeed}
            />
        )
    }
  return (
    <Canvas camera={{ position: [0, 5, 8] }}>
      <StarField />
      <Sun />
      <ambientLight intensity={0.4} />
      {planets.map(renderPlanet)}
    </Canvas> 
  )
}