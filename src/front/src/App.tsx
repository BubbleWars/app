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
import { useOnClick } from "./hooks/inputs";
import { BarSide } from "./components/ui/BarSide";
import "../global.css";
import { BarBottom } from "./components/ui/BarBottom";
import { usePrivy } from "@privy-io/react-auth";

function App() {
    //const { snapshot } = useInspect({ type: InspectType.State, value: 0 });
    //const { inputs } = useInputs();

    const { logout } = usePrivy();

    return (
        <>
            <Canvas
                orthographic={true}
                camera={{
                    position: [0, 0, 100],
                    zoom: 100,
                    near: 0.01,
                    far: 1000,
                }}
                style={{ height: "90vh", width: "100vw" }}
            >
                <color attach="background" args={["#FFFFF7"]} />
                <Game />
                <CustomCameraControls />

                <gridHelper
                    position={[0, 0, -10]}
                    rotation={[Math.PI / 2, 0, 0]}
                    args={[10000, 10000, 0xf9f9f5, 0xf9f9f5]}
                />
            </Canvas>
            <BarSide />
            <BarBottom />
            <ScreenTitle />
            <ScreenSpawnPortal />
            <button onClick={logout}>Log out</button>
        </>
    );
}

export default App;
