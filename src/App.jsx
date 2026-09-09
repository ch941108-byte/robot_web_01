import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useEffect, useRef, useState } from 'react'
import * as ROSLIB from 'roslib'

import RobotModel from './components/RobotModel'
import './App.css'


function App() {


  // =====================================
  // UR5e Home Position
  // =====================================

  const HOME_POSITION = {

    j1: 0,
    j2: -90,
    j3: 90,
    j4: -90,
    j5: -90,
    j6: 0

  }



  // =====================================
  // Joint 상태
  // =====================================

  const [joints, setJoints] =
    useState(HOME_POSITION)



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


  // B-4 추가
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

// B-5 Update Rate 계산용
  const messageCountRef =
    useRef(0)

  const lastTimeRef =
    useRef(Date.now())

  // =====================================
  // Joint 표시 이름
  // =====================================

  const jointNames = {

    j1: 'J1 Shoulder Pan',
    j2: 'J2 Shoulder Lift',
    j3: 'J3 Elbow',
    j4: 'J4 Wrist 1',
    j5: 'J5 Wrist 2',
    j6: 'J6 Wrist 3'

  }
// =====================================
// UR5e Joint Limit
// =====================================

const jointLimits = {

  j1: {
    min: -360,
    max: 360
  },

  j2: {
    min: -360,
    max: 360
  },

  j3: {
    min: -360,
    max: 360
  },

  j4: {
    min: -360,
    max: 360
  },

  j5: {
    min: -360,
    max: 360
  },

  j6: {
    min: -360,
    max: 360
  }

}


  // =====================================
  // ROS Joint Mapping
  // =====================================

  const rosJointMap = {

    shoulder_pan_joint:
      'j1',

    shoulder_lift_joint:
      'j2',

    elbow_joint:
      'j3',

    wrist_1_joint:
      'j4',

    wrist_2_joint:
      'j5',

    wrist_3_joint:
      'j6'

  }



  // =====================================
  // Radian → Degree
  // =====================================

  const radToDeg = (value) => {

    return value * 180 / Math.PI

  }
  const clamp = (
  value,
  min,
  max
) => {

  return Math.min(
    Math.max(value, min),
    max
  )

}


  // =====================================
  // ROS Bridge + JointState
  // =====================================

  useEffect(() => {


    const ros =
      new ROSLIB.Ros({

        url:
        'ws://localhost:9090'

      })



    ros.on(
      'connection',
      () => {

        console.log(
          'Connected ROS Bridge'
        )

        setRosConnected(true)

      }
    )



    ros.on(
      'error',
      (error)=>{

        console.error(
          error
        )

        setRosConnected(false)

      }
    )



    ros.on(
      'close',
      ()=>{

        setRosConnected(false)

        setJointStateConnected(false)

      }
    )



    const jointStateTopic =
      new ROSLIB.Topic({

        ros: ros,

        name:
        '/joint_states',

        messageType:
        'sensor_msgs/msg/JointState'

      })



    jointStateTopic.subscribe(

      (message)=>{


        console.log(
          'JointState:',
          message
        )



        setJointStateConnected(true)



        // ==========================
        // B-4
        // Joint 이름 표시
        // ==========================

        setDetectedJoints(
          message.name
        )
// ==========================
// B-5 Update Rate 계산
// ==========================

messageCountRef.current += 1


const now = Date.now()


const elapsed =
  now - lastTimeRef.current



if (elapsed >= 1000) {

  setUpdateRate(
    messageCountRef.current
  )
  messageCountRef.current = 0

  lastTimeRef.current = now

}

const nextJoints = {

          j1:0,
          j2:0,
          j3:0,
          j4:0,
          j5:0,
          j6:0

        }



        message.name.forEach(

          (
            jointName,
            index
          )=>{


            const target =
              rosJointMap[jointName]


            if(!target)
              return



            const degree =
  Number(
    radToDeg(
      message.position[index]
    ).toFixed(1)
  )


    nextJoints[target] =
      clamp(
    degree,
    jointLimits[target].min,
    jointLimits[target].max
  )


          }

        )



        latestRosJointsRef.current =
          nextJoints



        if(
          controlModeRef.current
          ===
          'ros'
        ){

          setJoints(
            nextJoints
          )

        }


      }

    )



    return()=>{


      jointStateTopic.unsubscribe()

      ros.close()


    }


  },[])





  // =====================================
  // Mode 변경
  // =====================================

  const changeMode = (mode)=>{


    controlModeRef.current =
      mode


    setControlMode(mode)



    if(
      mode==='ros'
      &&
      latestRosJointsRef.current
    ){

      setJoints(
        latestRosJointsRef.current
      )

    }


  }






  // =====================================
  // Manual Control
  // =====================================

  const updateJoint = (
    joint,
    value
  )=>{


    if(
      controlMode !== 'manual'
    )
      return



    setJoints(
      prev=>({

        ...prev,

        [joint]:
        Number(value)

      })
    )


  }




  const moveHome = ()=>{


    if(
      controlMode !== 'manual'
    )
      return



    setJoints(
      HOME_POSITION
    )

  }





  const jointZero = ()=>{


    if(
      controlMode !== 'manual'
    )
      return



    setJoints({

      j1:0,
      j2:0,
      j3:0,
      j4:0,
      j5:0,
      j6:0

    })

  }





  return (

    <div className="app">


      <div className="canvas-container">


        <Canvas

          camera={{

            position:
            [
              5,
              3,
              6
            ],

            fov:45

          }}

        >


          <ambientLight
            intensity={1.5}
          />


          <directionalLight

            position={[
              5,
              8,
              5
            ]}

            intensity={2}

          />


          <RobotModel

            j1={joints.j1}
            j2={joints.j2}
            j3={joints.j3}
            j4={joints.j4}
            j5={joints.j5}
            j6={joints.j6}

          />


          <gridHelper
            args={[
              10,
              10
            ]}
          />


          <OrbitControls/>


        </Canvas>


      </div>





      <div className="control-panel">


        <h3>

          ROS Bridge :

          <span
          style={{

            color:
            rosConnected
            ?
            '#4ade80'
            :
            '#f87171'

          }}
          >

          {
            rosConnected
            ?
            ' CONNECTED'
            :
            ' DISCONNECTED'
          }

          </span>

        </h3>




        <div>

          Joint States :

          <span
          style={{

            color:
            jointStateConnected
            ?
            '#4ade80'
            :
            '#f87171'

          }}
          >

          {
            jointStateConnected
            ?
            ' RECEIVING'
            :
            ' WAITING'
          }

          </span>

        </div>

<div
  style={{
    marginTop: '8px',
    fontSize: '14px'
  }}
>

  Update Rate :

  <span
    style={{
      color: '#4ade80',
      fontWeight: 'bold'
    }}
  >

    {updateRate} Hz

  </span>

</div>




        <h2>
          UR5e Joint Control
        </h2>





        <div>

        <button
        className={
          controlMode==='manual'
          ?
          'home-button'
          :
          ''
        }

        onClick={()=>
          changeMode('manual')
        }

        >

        MANUAL

        </button>



        <button

        className={
          controlMode==='ros'
          ?
          'home-button'
          :
          ''
        }

        onClick={()=>
          changeMode('ros')
        }

        >

        ROS LIVE

        </button>

        </div>





        {/* B-4 Joint 확인 */}

        <div
        style={{
          marginTop:'15px',
          fontSize:'13px'
        }}
        >

        <b>
        Detected Joints
        </b>


        {
          detectedJoints.map(
            (joint,index)=>(

              <div key={index}>

                ✓ {joint}

              </div>

            )
          )
        }

        </div>





        {
          Object.entries(joints)
          .map(
            ([key,value])=>(

            <div
            key={key}
            >

            <label>

            {jointNames[key]}

            <br/>

            {value}°

            </label>



            <input

            type="range"

            min={jointLimits[key].min}

            max={jointLimits[key].max}

            value={value}

            disabled={
              controlMode==='ros'
            }

            onChange={
              (e)=>

              updateJoint(
                key,
                e.target.value
              )
            }

            />


            </div>

            )
          )
        }





        <button

        className="home-button"

        onClick={moveHome}

        >

        HOME POSITION

        </button>



        <button

        className="reset-button"

        onClick={jointZero}

        >

        JOINT ZERO

        </button>


      </div>


    </div>

  )


}


export default App