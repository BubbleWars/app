import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Connector, useAccount, useConnect, useEnsName } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";
import { UserStatsBar } from "./components/UserStatsBar";
import { BubbleStats } from "./components/BubbleStats";
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

function App() {
    //const { snapshot } = useInspect({ type: InspectType.State, value: 0 });
    //const { inputs } = useInputs();

    return (
        <div
            className="position-relative"
            style={{ width: "100vw", height: "100vh" }}
        >
            <Canvas
                orthographic={true}
                camera={{
                    position: [0, 0, 100],
                    zoom: 10,
                    near: 0.01,
                    far: 1000,
                }}
                style={{ width: "100%", height: "100%" }}
            >
                <color attach="background" args={["#fdfaf1"]} />
                <Game />
                <CustomCameraControls />
                <gridHelper
                    position={[0, 0, -10]}
                    rotation={[Math.PI / 2, 0, 0]}
                    args={[10000, 10000, 0xeee8d5, 0xeee8d5]}
                />
            </Canvas>

            <ScreenTitle />

            <ScreenSpawnPortal />
            <div className="position-absolute bottom-0 start-0 p-3">
                <UserStatsBar />
            </div>
            <div
                className="position-absolute top-0 end-0 p-3"
                style={{ maxWidth: "20%", overflowY: "auto", height: "100vh" }}
            >
                <BubbleStats />
            </div>
        </div>
    );
}

export default App;
