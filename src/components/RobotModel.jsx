import { useEffect, useState } from 'react'
import URDFLoader from 'urdf-loader'


function RobotModel({
  j1 = 0,
  j2 = -90,
  j3 = 90,
  j4 = -90,
  j5 = -90,
  j6 = 0
}) {

  const [robot, setRobot] = useState(null)



  // =====================================
  // UR5e URDF Load
  // =====================================
  useEffect(() => {

    const loader = new URDFLoader()

    loader.parseVisual = true
    loader.parseCollision = false


    loader.load(
      '/models/ur5e/ur5e_web.urdf',

      (loadedRobot) => {

        console.log(
          '===== UR5e LOAD SUCCESS ====='
        )

        console.log(
          'Joints:',
          Object.keys(loadedRobot.joints)
        )


        // =====================================
        // 초기 자세
        // =====================================

        loadedRobot.setJointValue(
          'shoulder_pan_joint',
          degToRad(j1)
        )


        loadedRobot.setJointValue(
          'shoulder_lift_joint',
          degToRad(j2)
        )


        loadedRobot.setJointValue(
          'elbow_joint',
          degToRad(j3)
        )


        loadedRobot.setJointValue(
          'wrist_1_joint',
          degToRad(j4)
        )


        loadedRobot.setJointValue(
          'wrist_2_joint',
          degToRad(j5)
        )


        loadedRobot.setJointValue(
          'wrist_3_joint',
          degToRad(j6)
        )


        setRobot(loadedRobot)

      },


      undefined,


      (error) => {

        console.error(
          '===== UR5e LOAD ERROR ====='
        )

        console.error(error)

      }

    )


    return () => {

      setRobot(null)

    }


  }, [])





  // =====================================
  // Joint 실시간 업데이트
  // =====================================
  useEffect(() => {

    if (!robot) return



    robot.setJointValue(
      'shoulder_pan_joint',
      degToRad(j1)
    )


    robot.setJointValue(
      'shoulder_lift_joint',
      degToRad(j2)
    )


    robot.setJointValue(
      'elbow_joint',
      degToRad(j3)
    )


    robot.setJointValue(
      'wrist_1_joint',
      degToRad(j4)
    )


    robot.setJointValue(
      'wrist_2_joint',
      degToRad(j5)
    )


    robot.setJointValue(
      'wrist_3_joint',
      degToRad(j6)
    )


  }, [
    robot,
    j1,
    j2,
    j3,
    j4,
    j5,
    j6
  ])






  if (!robot) {

    return null

  }





  return (

    <group

      // ROS Z-up → Three.js Y-up 변환

      rotation={[
        -Math.PI / 2,
        0,
        0
      ]}


      position={[
        -0.3,
        0,
        0
      ]}


      scale={[
        4,
        4,
        4
      ]}

    >

      <primitive object={robot} />

    </group>

  )

}




// degree → radian 변환
function degToRad(degree) {

  return (
    degree * Math.PI / 180
  )

}



export default RobotModel
