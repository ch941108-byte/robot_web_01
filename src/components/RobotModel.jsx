import { useEffect, useState } from 'react'
import URDFLoader from 'urdf-loader'


// =====================================
// 로봇별 설정 사전
// =====================================
// 로봇을 새로 추가할 때는 이 객체에 항목만 추가하면 됩니다.
// (예: 나중에 Franka, Doosan 등 추가 시 여기에 한 줄씩 늘어남)
//
// urdfPath   : 이 로봇의 웹용 urdf 파일 위치
// jointNames : ROS(실제 로봇)에서 쓰는 joint 이름을, UI의 j1~j6 순서에 맞게 나열
// position   : Three.js 장면 안에서의 위치 보정값 (로봇마다 원점이 다름)
// scale      : Three.js 장면 안에서의 크기 배율 (로봇마다 실제 크기가 다름)
const ROBOT_CONFIGS = {

  ur5e: {
    urdfPath: '/models/ur5e/ur5e_web.urdf',
    jointNames: [
      'shoulder_pan_joint',
      'shoulder_lift_joint',
      'elbow_joint',
      'wrist_1_joint',
      'wrist_2_joint',
      'wrist_3_joint',
    'robotiq_85_left_knuckle_joint',
    ],
    position: [-0.3, 0, 0],
    scale: [4, 4, 4]
  },

  indy7: {
    urdfPath: '/models/indy7/indy7_gripper_web.urdf',
    jointNames: [
      'joint0',
      'joint1',
      'joint2',
      'joint3',
      'joint4',
      'joint5',
      'robotiq_85_left_knuckle_joint',
    ],
    // TODO: 아직 미조정 상태. 브라우저에서 실제로 보면서 값을 맞춰야 함.
    // 일단 UR5e와 동일한 값으로 시작.
    position: [-0.3, 0, 0],
    scale: [4, 4, 4]
  }

}


function RobotModel({
  robotType = 'ur5e',
  j1 = 0,
  j2 = -90,
  j3 = 90,
  j4 = -90,
  j5 = -90,
  j6 = 0,
  gripper = 0,
}) {

  const [robot, setRobot] = useState(null)

  // 현재 선택된 로봇의 설정을 사전에서 꺼내옴
  const config = ROBOT_CONFIGS[robotType]


  // =====================================
  // URDF Load
  // =====================================
  useEffect(() => {

    const loader = new URDFLoader()

    loader.parseVisual = true
    loader.parseCollision = false


    loader.load(

      config.urdfPath,

      (loadedRobot) => {

        console.log(
          `===== ${robotType.toUpperCase()} LOAD SUCCESS =====`
        )

        console.log(
          'Joints:',
          Object.keys(loadedRobot.joints)
        )


        // =====================================
        // 초기 자세
        // =====================================
        // config.jointNames 순서 = [j1, j2, j3, j4, j5, j6] 순서와 동일하게 맞춰둠

        applyJointValues(
          loadedRobot,
          config.jointNames,
          [j1, j2, j3, j4, j5, j6, gripper]
        )


        setRobot(loadedRobot)

      },


      undefined,


      (error) => {

        console.error(
          `===== ${robotType.toUpperCase()} LOAD ERROR =====`
        )

        console.error(error)

      }

    )


    return () => {

      setRobot(null)

    }


  }, [robotType])
  // ★ robotType이 바뀌면(=다른 로봇을 선택하면) 이 useEffect가 다시 실행되어
  //   새 로봇을 새로 로드합니다.





  // =====================================
  // Joint 실시간 업데이트
  // =====================================
  useEffect(() => {

    if (!robot) return


    applyJointValues(
      robot,
      config.jointNames,
      [j1, j2, j3, j4, j5, j6, gripper]
    )


  }, [
    robot,
    j1,
    j2,
    j3,
    j4,
    j5,
    j6,
    gripper
  ])




  if (!robot) {

    return null

  }




  return (

    <group

      // ROS Z-up → Three.js Y-up 변환
      // (로봇 종류와 무관하게 항상 동일하게 적용되는 좌표계 변환)
      rotation={[
        -Math.PI / 2,
        0,
        0
      ]}


      position={config.position}


      scale={config.scale}

    >

      <primitive object={robot} />

    </group>

  )

}



// =====================================
// 여러 joint에 한 번에 각도값 적용하는 헬퍼 함수
// =====================================
// jointNames와 degrees 배열은 순서(index)가 서로 짝지어져 있다고 가정합니다.
// 예: jointNames[0]='joint0', degrees[0]=j1 값  →  joint0에 j1값 적용
function applyJointValues(robot, jointNames, degrees) {

  jointNames.forEach((name, index) => {

    const exists = !!robot.joints[name]
    const changed = robot.setJointValue(
      name,
      degToRad(degrees[index])
    )
    console.log(`[JOINT DEBUG] ${name}: value=${degrees[index]} exists=${exists} changed=${changed}`)

  })

}


// degree → radian 변환
function degToRad(degree) {

  return (
    degree * Math.PI / 180
  )

}



export default RobotModel
