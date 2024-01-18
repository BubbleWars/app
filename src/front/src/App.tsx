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
        camera={{ position: [0, 0, 10], zoom: 10, near: 0.01, far: 1000 }}
        style={{ height: '100vh', width: '100vw' }}
      >
            <ambientLight intensity={5.5} color={'white'} />
            <pointLight position={[10, 10, 10]} />

        {/* <color attach="background" args={['#272730']} /> */}
        <CustomCameraControls/>
        <Game snapshot={snapshot} inputs={inputs} notices ={notices} />
        <gridHelper 
          position={[0, 0, -10]}
          rotation={[Math.PI / 2, 0, 0]}
          args={[5000, 100, 0xebebeb, 0xebebeb]}
        />
        
      </Canvas>
      <GameBar />
    </>
  )
}

export default App
