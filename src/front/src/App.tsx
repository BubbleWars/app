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
import { Plane, Text, Text3D } from "@react-three/drei";
import { ScreenTitle } from "./components/screens/ScreenTitle";
import { ScreenSpawnPortal } from "./components/screens/ScreenSpawnPortal";
import { useState } from "react";
import { useOnClick } from "./hooks/inputs";
import { BarSide } from "./components/ui/BarSide";
import "../global.css"
import { BarBottom } from "./components/ui/BarBottom";
import { usePrivy } from "@privy-io/react-auth";
import { ScreenLogin } from "./components/screens/ScreenLogin";
import { WORLD_WIDTH } from "../../core/consts";

import { useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';

function Background() {
    const defaultUrl = "/bg.png";
    const texture = useLoader(TextureLoader, defaultUrl);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(400, 400);

    return (
        <Plane
            position={[0, 0, -10]}
        >
            <planeGeometry args={[WORLD_WIDTH*10, WORLD_WIDTH*10]} />
            <meshBasicMaterial attach="material" map={texture} />
        </Plane>
    );
}


function App() {
    //const { snapshot } = useInspect({ type: InspectType.State, value: 0 });
    //const { inputs } = useInputs();

    const { logout, authenticated } = usePrivy();

    return (
        <>
            <Canvas
                
                orthographic={true}
                camera={{
                    position: [0, 0, 100],
                    zoom: 60,
                    near: 0.01,
                    far: 1000,
                    fov: 10,
                }}
                gl={{ toneMapping: THREE.NoToneMapping}}
                dpr={[1, 2]}
                style={{ height: "100vh", width: "100vw" }}
            >
                <Background />

                <Game />
                <CustomCameraControls />

            </Canvas>

            {!authenticated && <ScreenLogin />}
            {authenticated && <ScreenSpawnPortal /> }
            {authenticated && <ScreenTitle />}
            {/* <button onClick={logout}>Log out</button> */}
        </>
    );
}

export default App;
