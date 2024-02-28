import "./App.css";
import { Connector, useAccount, useConnect, useEnsName } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";
import {
  useBlockTimestamp,
  useInputs,
  useInspect,
  useLocalTimestamp,
  useMachineTimestamp,
  useNotices,
} from "./hooks/state";
import { InspectType } from "../../core/types/inputs";
import { Game } from "./components/Game";
import { GameBar } from "./components/GameBar";
import { Canvas, extend } from "@react-three/fiber";
import { CustomCameraControls } from "./components/CameraControls";
import * as THREE from "three";
import { Text, Text3D } from "@react-three/drei";
import { ScreenTitle } from "./components/screens/ScreenTitle";
import { ScreenSpawnPortal } from "./components/screens/ScreenSpawnPortal";
import { useState } from "react";

function App() {
  const { snapshot } = useInspect({ type: InspectType.State, value: 0 });
  const { inputs } = useInputs();
  const { notices } = useNotices();
  const [isConnected, setIsConnected] = useState(false);

  return (
    <>
      <Canvas
        orthographic={true}
        camera={{ position: [0, 0, 100], zoom: 10, near: 0.01, far: 1000 }}
        style={{ height: "100vh", width: "100vw" }}
      >
        <Game snapshot={snapshot} inputs={inputs} notices={notices} />
        <CustomCameraControls />

        <gridHelper
          position={[0, 0, -10]}
          rotation={[Math.PI / 2, 0, 0]}
          args={[10000, 550, 0xf5f5f5, 0xf5f5f5]}
        />
      </Canvas>
      <ScreenTitle
        isConnectedFunc={(bool) => {
          setIsConnected(bool);
        }}
      />
      <ScreenSpawnPortal />
    </>
  );
}

export default App;
