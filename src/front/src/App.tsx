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
import { Edges, Plane, Text, Text3D } from "@react-three/drei";
import { ScreenTitle } from "./components/screens/ScreenTitle";
import { ScreenSpawnPortal } from "./components/screens/ScreenSpawnPortal";
import { useState } from "react";
import { useOnClick } from "./hooks/inputs";
import { BarSide } from "./components/ui/BarSide";
import "../global.css"
import { BarBottom } from "./components/ui/BarBottom";
import { usePrivy } from "@privy-io/react-auth";
import { ScreenLogin } from "./components/screens/ScreenLogin";
import { WORLD_RADIUS, WORLD_WIDTH } from "../../core/consts";

import { useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { StatsLeaderboard } from "./components/ui/StatsLeaderboard";
import { StatsEventBox } from "./components/ui/StatsEventBox";
import { StatsTokenomics } from "./components/ui/StatsTokenomics";
import { Edge } from "planck-js";
import { useSelector } from "react-redux";
import { ScreenDeposit } from "./components/screens/ScreenDeposit";
import { ScreenWithdraw } from "./components/screens/ScreenWithdraw";
import { useVouchers } from "./hooks/vouchers";

function Background() {
    const defaultUrl = "/bg.png";
    const texture = useLoader(TextureLoader, defaultUrl);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(400, 400);

    return (
        <Plane
            position={[0, 0, -10]}
        >
            <planeGeometry args={[WORLD_WIDTH*2, WORLD_WIDTH*2]} />
            <meshBasicMaterial attach="material" map={texture} />
        </Plane>
    );
}

//Circle border
function Border() {
    return (
        <mesh>
            <circleGeometry args={[WORLD_RADIUS, 100]} />
            <meshBasicMaterial transparent={true} opacity={0} color={"#000000"} />
            <Edges />
        </mesh>
    );

}


function App() {
    //const { snapshot } = useInspect({ type: InspectType.State, value: 0 });
    //const { inputs } = useInputs();

    const { logout, authenticated } = usePrivy();
    const withdrawModal = useSelector((state: any) => state.controls.withdraw);
    const depositModal = useSelector((state: any) => state.controls.deposit);
    // const {vouchers, executeVoucher, voucherToExecute, getProof } = useVouchers();
    // const [isExecutingVoucher, setIsExecutingVoucher ] = useState<boolean>(false);
    // console.log("vouchers", vouchers);


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
                <Border />

            </Canvas>
            <StatsLeaderboard />
            <BarBottom />
            


            {!authenticated && <ScreenLogin />}
            {authenticated && <ScreenSpawnPortal /> }
            {authenticated && <ScreenTitle />}
            {withdrawModal && <ScreenWithdraw />}
            {depositModal && <ScreenDeposit />}

            {/* <button onClick={logout}>Log out</button> */}
        </>
    );
}

export default App;
