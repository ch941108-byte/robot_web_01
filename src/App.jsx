import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useEffect, useRef, useState } from 'react'
import * as ROSLIB from 'roslib'

import RobotModel from './components/RobotModel'
import './App.css'


// =====================================
// 로봇별 설정 사전
// =====================================
// RobotModel.jsx의 ROBOT_CONFIGS와 짝을 이루는 App.jsx 쪽 설정입니다.
// (RobotModel.jsx 쪽은 "3D 모델을 어떻게 불러올지", 여기는 "UI를 어떻게 보여줄지"를 담당)
//
// home        : HOME POSITION 버튼을 눌렀을 때 적용되는 기본 자세
// displayNames: 화면 슬라이더 위에 표시되는 이름
// limits      : 관절 각도 제한 (degree)
// rosJointMap : ROS에서 오는 실제 joint 이름 → 화면의 j1~j6 매핑
const ROBOT_CONFIGS = {

  ur5e: {

    home: {
      j1: 0,
      j2: -90,
      j3: 90,
      j4: -90,
      j5: -90,
      j6: 0
    },

    displayNames: {
      j1: 'J1 Shoulder Pan',
      j2: 'J2 Shoulder Lift',
      j3: 'J3 Elbow',
      j4: 'J4 Wrist 1',
      j5: 'J5 Wrist 2',
      j6: 'J6 Wrist 3'
    },

    limits: {
      j1: { min: -360, max: 360 },
      j2: { min: -360, max: 360 },
      j3: { min: -360, max: 360 },
      j4: { min: -360, max: 360 },
      j5: { min: -360, max: 360 },
      j6: { min: -360, max: 360 }
    },

    rosJointMap: {
      shoulder_pan_joint: 'j1',
      shoulder_lift_joint: 'j2',
      elbow_joint: 'j3',
      wrist_1_joint: 'j4',
      wrist_2_joint: 'j5',
      wrist_3_joint: 'j6'
    }

  },

  indy7: {

    // TODO: 아직 미조정 상태. 화면에서 보면서 보기 좋은 자세로 바꿔도 됩니다.
    home: {
      j1: 0,
      j2: 0,
      j3: 0,
      j4: 0,
      j5: 0,
      j6: 0
    },

    displayNames: {
      j1: 'J1 (joint0)',
      j2: 'J2 (joint1)',
      j3: 'J3 (joint2)',
      j4: 'J4 (joint3)',
      j5: 'J5 (joint4)',
      j6: 'J6 (joint5)'
    },

    // Neuromeka 공식 urdf 실물 스펙 기준
    limits: {
      j1: { min: -175, max: 175 },
      j2: { min: -175, max: 175 },
      j3: { min: -175, max: 175 },
      j4: { min: -175, max: 175 },
      j5: { min: -175, max: 175 },
      j6: { min: -215, max: 215 }
    },

    rosJointMap: {
      joint0: 'j1',
      joint1: 'j2',
      joint2: 'j3',
      joint3: 'j4',
      joint4: 'j5',
      joint5: 'j6'
    }

  }

}


function App() {


  // =====================================
  // 로봇 선택 상태
  // =====================================

  const [robotType, setRobotType] =
    useState('ur5e')

  const robotTypeRef =
    useRef('ur5e')
  // ★ ROS 구독 콜백(useEffect [] 안)에서도 항상 "지금 선택된 로봇"을
  //   알 수 있도록, state와 별도로 ref에도 같이 저장해둡니다.


  // 현재 선택된 로봇의 설정 세트
  const config = ROBOT_CONFIGS[robotType]



  // =====================================
  // Joint 상태
  // =====================================

  const [joints, setJoints] =
    useState(ROBOT_CONFIGS.ur5e.home)



  // =====================================
  // ROS 상태
  // =====================================

  const [rosConnected, setRosConnected] =
    useState(false)

  const [
    jointStateConnected,
    setJointStateConnected
  ] = useState(false)

  const [
    updateRate,
    setUpdateRate
  ] = useState(0)

  // 실제 수신된 Joint 이름
  const [
    detectedJoints,
    setDetectedJoints
  ] = useState([])



  // =====================================
  // Manual / ROS Mode
  // =====================================

  const [
    controlMode,
    setControlMode
  ] = useState('manual')

  const controlModeRef =
    useRef('manual')

  const latestRosJointsRef =
    useRef(null)

  // Update Rate 계산용
  const messageCountRef =
    useRef(0)

  const lastTimeRef =
    useRef(Date.now())



  // =====================================
  // Radian → Degree
  // =====================================

  const radToDeg = (value) => {

    return value * 180 / Math.PI

  }

  const clamp = (value, min, max) => {

    return Math.min(
      Math.max(value, min),
      max
    )

  }



  // =====================================
  // ROS Bridge + JointState
  // =====================================
  // 이 useEffect는 컴포넌트가 처음 열릴 때 딱 한 번만 실행됩니다.
  // 로봇을 바꿔도 이 연결 자체는 그대로 유지되고,
  // 콜백 안에서는 robotTypeRef.current로 "현재" 로봇 설정을 꺼내 씁니다.

  useEffect(() => {


    const ros =
      new ROSLIB.Ros({
        url: 'ws://localhost:9090'
      })


    ros.on('connection', () => {

      console.log('Connected ROS Bridge')
      setRosConnected(true)

    })


    ros.on('error', (error) => {

      console.error(error)
      setRosConnected(false)

    })


    ros.on('close', () => {

      setRosConnected(false)
      setJointStateConnected(false)

    })


    const jointStateTopic =
      new ROSLIB.Topic({

        ros: ros,
        name: '/joint_states',
        messageType: 'sensor_msgs/msg/JointState'

      })


    jointStateTopic.subscribe((message) => {


      console.log('JointState:', message)

      setJointStateConnected(true)

      setDetectedJoints(message.name)


      // Update Rate 계산
      messageCountRef.current += 1

      const now = Date.now()
      const elapsed = now - lastTimeRef.current

      if (elapsed >= 1000) {

        setUpdateRate(messageCountRef.current)
        messageCountRef.current = 0
        lastTimeRef.current = now

      }


      // ★ 지금 선택된 로봇의 설정을 ref를 통해 최신 값으로 가져옴
      const currentConfig =
        ROBOT_CONFIGS[robotTypeRef.current]


      const nextJoints = {
        j1: 0,
        j2: 0,
        j3: 0,
        j4: 0,
        j5: 0,
        j6: 0
      }


      message.name.forEach((jointName, index) => {

        const target =
          currentConfig.rosJointMap[jointName]

        if (!target) return
        // ↑ 예: UR5e를 보고 있는데 Indy7 joint 이름이 들어오면
        //   매핑에 없으니 무시하고 넘어감 (안전장치)


        const degree =
          Number(
            radToDeg(message.position[index]).toFixed(1)
          )

        nextJoints[target] =
          clamp(
            degree,
            currentConfig.limits[target].min,
            currentConfig.limits[target].max
          )

      })


      latestRosJointsRef.current = nextJoints


      if (controlModeRef.current === 'ros') {

        setJoints(nextJoints)

      }


    })


    return () => {

      jointStateTopic.unsubscribe()
      ros.close()

    }


  }, [])



  // =====================================
  // 로봇 선택 변경
  // =====================================

  const changeRobot = (type) => {


    robotTypeRef.current = type
    setRobotType(type)


    // 로봇이 바뀌면 이전 로봇의 자세/joint 정보는 의미가 없으므로
    // 안전하게 MANUAL 모드 + 새 로봇의 HOME POSITION으로 초기화
    controlModeRef.current = 'manual'
    setControlMode('manual')

    setJoints(ROBOT_CONFIGS[type].home)

    setDetectedJoints([])
    latestRosJointsRef.current = null


  }



  // =====================================
  // Mode 변경
  // =====================================

  const changeMode = (mode) => {

    controlModeRef.current = mode
    setControlMode(mode)

    if (mode === 'ros' && latestRosJointsRef.current) {

      setJoints(latestRosJointsRef.current)

    }

  }



  // =====================================
  // Manual Control
  // =====================================

  const updateJoint = (joint, value) => {

    if (controlMode !== 'manual') return

    setJoints(prev => ({
      ...prev,
      [joint]: Number(value)
    }))

  }


  const moveHome = () => {

    if (controlMode !== 'manual') return

    setJoints(config.home)

  }


  const jointZero = () => {

    if (controlMode !== 'manual') return

    setJoints({
      j1: 0,
      j2: 0,
      j3: 0,
      j4: 0,
      j5: 0,
      j6: 0
    })

  }




  return (

    <div className="app">


      <div className="canvas-container">

        <Canvas

          camera={{
            position: [5, 3, 6],
            fov: 45
          }}

        >

          <ambientLight intensity={1.5} />

          <directionalLight
            position={[5, 8, 5]}
            intensity={2}
          />

          <RobotModel

            robotType={robotType}

            j1={joints.j1}
            j2={joints.j2}
            j3={joints.j3}
            j4={joints.j4}
            j5={joints.j5}
            j6={joints.j6}

          />

          <gridHelper args={[10, 10]} />

          <OrbitControls />

        </Canvas>

      </div>



      <div className="control-panel">

        <h3>
          ROS Bridge :
          <span
            style={{
              color: rosConnected ? '#4ade80' : '#f87171'
            }}
          >
            {rosConnected ? ' CONNECTED' : ' DISCONNECTED'}
          </span>
        </h3>


        <div>
          Joint States :
          <span
            style={{
              color: jointStateConnected ? '#4ade80' : '#f87171'
            }}
          >
            {jointStateConnected ? ' RECEIVING' : ' WAITING'}
          </span>
        </div>


        <div style={{ marginTop: '8px', fontSize: '14px' }}>
          Update Rate :
          <span style={{ color: '#4ade80', fontWeight: 'bold' }}>
            {updateRate} Hz
          </span>
        </div>


        {/* ===================================== */}
        {/* 로봇 선택 */}
        {/* ===================================== */}

        <h2>
          {robotType.toUpperCase()} Joint Control
        </h2>

        <div style={{ marginBottom: '10px' }}>

          <button
            className={robotType === 'ur5e' ? 'home-button' : ''}
            onClick={() => changeRobot('ur5e')}
          >
            UR5e
          </button>

          <button
            className={robotType === 'indy7' ? 'home-button' : ''}
            onClick={() => changeRobot('indy7')}
          >
            Indy7
          </button>

        </div>


        <div>

          <button
            className={controlMode === 'manual' ? 'home-button' : ''}
            onClick={() => changeMode('manual')}
          >
            MANUAL
          </button>

          <button
            className={controlMode === 'ros' ? 'home-button' : ''}
            onClick={() => changeMode('ros')}
          >
            ROS LIVE
          </button>

        </div>


        {/* Detected Joints */}
        <div style={{ marginTop: '15px', fontSize: '13px' }}>

          <b>Detected Joints</b>

          {detectedJoints.map((joint, index) => (
            <div key={index}>✓ {joint}</div>
          ))}

        </div>


        {Object.entries(joints).map(([key, value]) => (

          <div key={key}>

            <label>
              {config.displayNames[key]}
              <br />
              {value}°
            </label>

            <input
              type="range"
              min={config.limits[key].min}
              max={config.limits[key].max}
              value={value}
              disabled={controlMode === 'ros'}
              onChange={(e) => updateJoint(key, e.target.value)}
            />

          </div>

        ))}


        <button className="home-button" onClick={moveHome}>
          HOME POSITION
        </button>

        <button className="reset-button" onClick={jointZero}>
          JOINT ZERO
        </button>

      </div>

    </div>

  )

}


export default App
