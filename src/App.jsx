import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useEffect, useState } from 'react'
import * as ROSLIB from 'roslib'
import './App.css'

function RobotJoint({ angle }) {
  const angleRad = (angle * Math.PI) / 180

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

function App() {
  const [angle, setAngle] = useState(0)
  const [rosAngle, setRosAngle] = useState(0)
  const [mode, setMode] = useState('manual')
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const ros = new ROSLIB.Ros({
      url: 'ws://localhost:9090',
    })

    ros.on('connection', () => {
      console.log('Connected to ROS bridge')
      setConnected(true)
    })

    ros.on('error', (error) => {
      console.error('ROS bridge error:', error)
      setConnected(false)
    })

    ros.on('close', () => {
      console.log('ROS bridge connection closed')
      setConnected(false)
    })

    const jointTopic = new ROSLIB.Topic({
      ros,
      name: '/joint_angle',
      messageType: 'std_msgs/msg/Float64',
    })

    jointTopic.subscribe((message) => {
      setRosAngle(message.data)
    })

    return () => {
      jointTopic.unsubscribe()
      ros.close()
    }
  }, [])

  useEffect(() => {
    if (mode === 'ros') {
      setAngle(rosAngle)
    }
  }, [rosAngle, mode])

  return (
    <div className="app">
      <div className="canvas-container">
        <Canvas camera={{ position: [5, 3, 6], fov: 45 }}>
          <ambientLight intensity={1.5} />
          <directionalLight position={[5, 8, 5]} intensity={2} />

          <RobotJoint angle={angle} />

          <gridHelper args={[10, 10]} />
          <OrbitControls />
        </Canvas>
      </div>

      <div className="control-panel">
        <div className="connection-status">
          ROS Bridge:
          <strong className={connected ? 'connected' : 'disconnected'}>
            {connected ? ' CONNECTED' : ' DISCONNECTED'}
          </strong>
        </div>

        <div className="angle-display">
          Joint Angle: <strong>{angle.toFixed(1)}°</strong>
        </div>

        <div className="angle-display">
          ROS Angle: <strong>{rosAngle.toFixed(1)}°</strong>
        </div>

        <div className="mode-group">
          <button
            className={mode === 'manual' ? 'active' : ''}
            onClick={() => setMode('manual')}
          >
            Manual
          </button>

          <button
            className={mode === 'ros' ? 'active' : ''}
            onClick={() => setMode('ros')}
          >
            ROS
          </button>
        </div>

        {mode === 'manual' && (
          <div className="button-group">
            <button onClick={() => setAngle(0)}>0°</button>
            <button onClick={() => setAngle(30)}>30°</button>
            <button onClick={() => setAngle(60)}>60°</button>
            <button onClick={() => setAngle(90)}>90°</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default App