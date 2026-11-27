import { useState } from 'react'
import SpaceScene from '../components/SpaceScene'
import { planets } from '../data/planets'

export default function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  function handleSelectPlanet(planetId: string | null): void {
    setSelectedId(planetId)
  }

  const selectedPlanet = planets.find(function findPlanet(planet) {
    return planet.id === selectedId
  })

  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <SpaceScene
        planets={planets}
        selectedId={selectedId}
        onSelect={handleSelectPlanet}
      />
      <p
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          color: 'white',
          margin: 0,
          pointerEvents: 'none',
        }}
      >
        {selectedPlanet ? `Selected: ${selectedPlanet.name}` : 'Click a planet'}
      </p>
    </main>
  )
}