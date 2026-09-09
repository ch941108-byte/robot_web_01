function RobotJointTest({ angle }) {
  return (
    <>
      <mesh position={[0, -1.3, 0]}>
        <boxGeometry args={[3, 0.3, 3]} />
        <meshStandardMaterial color="#555555" />
      </mesh>

      <mesh position={[0, -0.5, 0]}>
        <boxGeometry args={[0.8, 1.5, 0.8]} />
        <meshStandardMaterial color="#777777" />
      </mesh>

      <group
        position={[0, 0.25, 0]}
        rotation={[0, 0, (angle * Math.PI) / 180]}
      >
        <mesh>
          <cylinderGeometry args={[0.4, 0.4, 0.5, 32]} />
          <meshStandardMaterial color="#ff8c42" />
        </mesh>

        <mesh position={[0, 1.25, 0]}>
          <boxGeometry args={[0.45, 2.5, 0.45]} />
          <meshStandardMaterial color="#dddddd" />
        </mesh>
      </group>
    </>
  )
}

export default RobotJointTest