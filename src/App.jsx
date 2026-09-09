import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useEffect, useState } from 'react'
import * as ROSLIB from 'roslib'

import RobotModel from './components/RobotModel'
import './App.css'


function App() {


  // =====================================
  // UR5e 6축 Joint 상태
  // =====================================

  const HOME_POSITION = {

    j1: 0,
    j2: -90,
    j3: 90,
    j4: -90,
    j5: -90,
    j6: 0

  }



  const [joints, setJoints] = useState(
    HOME_POSITION
  )



  // =====================================
  // 화면 표시용 Joint 이름
  // =====================================

  const jointNames = {

    j1: 'J1 Shoulder Pan',

    j2: 'J2 Shoulder Lift',

    j3: 'J3 Elbow',

    j4: 'J4 Wrist 1',

    j5: 'J5 Wrist 2',

    j6: 'J6 Wrist 3'

  }



  const [rosConnected, setRosConnected] =
    useState(false)





  // =====================================
  // ROS Bridge 연결
  // =====================================

  useEffect(() => {


    const ros = new ROSLIB.Ros({

      url: 'ws://localhost:9090'

    })


    ros.on(
      'connection',
      () => {

        console.log(
          'Connected to ROS Bridge'
        )

        setRosConnected(true)

      }
    )



    ros.on(
      'error',
      (error) => {

        console.error(error)

        setRosConnected(false)

      }
    )



    ros.on(
      'close',
      () => {

        setRosConnected(false)

      }
    )



    return () => {

      ros.close()

    }


  }, [])






  // =====================================
  // Joint 값 변경
  // =====================================

  const updateJoint = (
    joint,
    value
  ) => {


    setJoints(
      prev => ({

        ...prev,

        [joint]: Number(value)

      })
    )

  }






  // =====================================
  // Home Position
  // =====================================

  const moveHome = () => {


    setJoints({

      ...HOME_POSITION

    })


  }






  // =====================================
  // Reset Position
  // =====================================

  const resetPosition = () => {


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

            position: [
              5,
              3,
              6
            ],

            fov: 45

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


          <OrbitControls />



        </Canvas>


      </div>







      <div className="control-panel">


        <h3>

          ROS Bridge :

          <span

            style={{

              color:

              rosConnected
              ? '#4ade80'
              : '#f87171'

            }}

          >

            {
              rosConnected
              ? ' CONNECTED'
              : ' DISCONNECTED'
            }


          </span>


        </h3>





        <h2>
          UR5e Joint Control
        </h2>





        {
          Object.entries(joints)
          .map(
            ([key,value]) => (

              <div

                key={key}

                style={{

                  marginBottom:'14px'

                }}

              >


                <label>


                  {jointNames[key]}


                  <br />


                  {value}°


                </label>





                <input

                  type="range"

                  min="-180"

                  max="180"

                  value={value}


                  onChange={
                    (e)=>

                    updateJoint(
                      key,
                      e.target.value
                    )

                  }


                  style={{

                    width:'260px'

                  }}

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
  onClick={resetPosition}
>
  JOINT ZERO
</button>



      </div>


    </div>


  )

}


export default App