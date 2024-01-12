import './App.css'
import { useAccount, useConnect, useEnsName } from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { useBlockTimestamp, useInputs, useInspect, useLocalTimestamp, useMachineTimestamp, useNotices } from './hooks/state'
import { InspectType } from '../../core/types/inputs'
import { Game } from './components/Game'
import { GameBar } from './components/GameBar'
import { Canvas, extend } from '@react-three/fiber'
import { CustomCameraControls } from './components/CameraControls'
import * as THREE from 'three'
import { Text3D } from '@react-three/drei'

function App() {
  const { snapshot } = useInspect({type:InspectType.State, value: 0})
  const { inputs } = useInputs();
  const { notices } = useNotices();

  return (
    <>
      <Canvas 
        orthographic={true} 
        camera={{ position: [0, 0, 5], zoom: 40 }}
        style={{ height: '100vh', width: '100vw' }}
      >
        <CustomCameraControls/>
        <Game snapshot={snapshot} inputs={inputs} notices ={notices} />
        <gridHelper 
          position={[0, 0, -10]}
          rotation={[Math.PI / 2, 0, 0]}
          args={[1000, 2000, 0xebebeb, 0xebebeb]}
        />
        <ambientLight />
        <pointLight position={[1, 1, 3]} intensity={5}  color={new THREE.Color(0xffffff)} />
        
      </Canvas>
      <GameBar />
    </>
  )
}

export default App
