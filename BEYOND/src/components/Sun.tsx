export default function Sun() {
  return (
    <>
      <pointLight color="#ffd27f" intensity={40} />
      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color="#ffb54a"
          emissive="#ff8500"
          emissiveIntensity={2}
        />
      </mesh>
    </>
  )
}