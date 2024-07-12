import {
    ethereumAddressToColor,
    massToRadius,
} from "../../../core/funcs/utils";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { currentState } from "../../../core/world";
import { BubblesInfo } from "./BubblesInfo";
import { BubblesControlsEmit } from "./BubblesControlsEmit";
import { Circle, Edges, Outlines, RoundedBox, useTexture } from "@react-three/drei";
import { darkenColor } from "../utils";
import * as THREE from "three";
import { bubbleStartPositions, dynamicLerp, timestampDiff } from "./Game";
import { useDispatch, useSelector } from "react-redux";
import {
    setIsBubbleSelected,
    setSelectedEntityId,
} from "../store/interpolation";

import { LERP_SPEED } from "../consts";
import { MathUtils } from "three";


import vertexShader from "../shaders/bubbleParticleVert.glsl?raw";
import fragmentShader from "../shaders/bubbleParticleFrag.glsl?raw";
import { CustomGeometryParticles } from "./Portals";

const BubbleOutlineShader = ({
    color = 'white',
    outlineWidth = 0.05,
    ...props
}) => {
    const materialRef = useRef();

    const uniforms = useMemo(
        () => ({
            color: { value: new THREE.Color(color) },
            outlineWidth: { value: outlineWidth }
        }),
        [color, outlineWidth]
    );

    useEffect(() => {
        materialRef.current.uniforms.color.value = new THREE.Color(color);
        materialRef.current.uniforms.outlineWidth.value = outlineWidth;
    }, [color, outlineWidth]);

    useFrame(() => {
        materialRef.current.uniforms.outlineWidth.value = outlineWidth;
    });

    return (
        <shaderMaterial
            ref={materialRef}
            vertexShader={`
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
            `}
            fragmentShader={`
            uniform vec3 color;
            uniform float outlineWidth;
            varying vec3 vNormal;

            void main() {
                float intensity = 1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0));
                float outline = smoothstep(outlineWidth - 0.01, outlineWidth + 0.01, intensity);
                gl_FragColor = vec4(color, outline);
            }
            `}
            uniforms={uniforms}
            side={THREE.BackSide}
            {...props}
        />
    );
};


const BubbleMovementParticles =(props: {magnitude: number, count: number, radius: number, position: THREE.Vector3, color: THREE.Color | string, direction: { x: number, y: number}, height: number }) => {
    const { count, radius, color, height, direction } = props;
  const { camera } = useThree()
  const zoom = camera.zoom
 //console.log("zoom:", zoom)

  // This reference gives us direct access to our points
  const points = useRef();

  // Generate our positions attributes array
  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const distance = 1
      const theta = THREE.MathUtils.randFloatSpread(360);
  
      let x = distance * Math.cos(theta);
      let y = i * (height / count) - height / 2;
      // Since we're working in a 2D plane, z will always be 0
      let z = distance * Math.sin(theta);
  
      positions.set([x, y, z], i * 3);
    }
    
    return positions;
  }, [count]);

  const uniforms = useRef({
    uTime: { value: 0.0 },
    uRadius: { value: radius },
    uColor: { value: (new THREE.Color(color)).convertLinearToSRGB() },
    uZoom: { value: zoom },
    uDirection: { value: new THREE.Vector2(0, 1) },
    uMagnitude: { value: 1 },
  }).current;

  useEffect(() => {
    uniforms.uRadius.value = radius;
    uniforms.uColor.value = new THREE.Color(color).convertLinearToSRGB();
    uniforms.uZoom.value = zoom;
    uniforms.uDirection.value = new THREE.Vector2(direction.x, direction.y);
    uniforms.uMagnitude.value = props.magnitude;
  }, [radius, color, zoom, direction, props.magnitude]);
  

  useFrame(() => {
    uniforms.uTime.value += 0.1;
    points.current.material.uniforms = uniforms; // Ensure uniforms are correctly referenced
  
    // Other updates...
  });

  return (
    <points ref={points} position={props.position}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesPosition.length / 3}
          array={particlesPosition}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        depthWrite={false}
        fragmentShader={fragmentShader}
        vertexShader={vertexShader}
        uniforms={uniforms}
      />
    </points>
  );
  };
import { useWallets } from "@privy-io/react-auth";
import { useUserSocial } from "@/hooks/socials";
import Outline from "./Outline";
import { text } from "stream/consumers";
import { usePfpTexture, useTextureWithFallback } from "@/hooks/state";
import { BubbleState } from "../../../core/types/state";
import ShadowMesh from "./Shadow";
import { EffectShield } from "./EffectShield";
import { getBubbleStateResourceMass } from "../../../core/funcs/bubble";
import { ResourceType } from "../../../core/types/resource";

export const Bubble = ({ bubbleId }: { bubbleId: string }) => {
    const { wallets } = useWallets();

    const connectedAddress = wallets[0]?.address ? `${wallets[0].address}` : "";

    const meshRef = useRef<any>();
    const [isHovered, setIsHovered] = useState<boolean>(false);
    const dispatch = useDispatch();
    const setIsSelected = (isSelected1: boolean) => {
        dispatch(setIsBubbleSelected(isSelected1));
        dispatch(setSelectedEntityId(isSelected1 ? bubbleId : null));
    };
    const selectedBubbleId = useSelector(
        (state: any) => state.interpolation.selectedEntityId,
    );
    const isBubbleSelected = useSelector(
        (state: any) => state.interpolation.isBubbleSelected,
    );
    const isSelected = isBubbleSelected && selectedBubbleId == bubbleId;

    const bubble: BubbleState = currentState.bubbles.find(
        (bubble) => bubble.id == bubbleId,
    ) ?? { position: { x: 0, y: 0 }, mass: 0, owner: "", velocity: { x: 0, y: 0 }, from: "" };

    const user = useUserSocial({ address: bubble?.owner ?? ""});

    const pfpUrl = user?.pfpUrl;
   //console.log("pfpUrl", pfpUrl)
    const texture = usePfpTexture(pfpUrl, pfpUrl, user?.social);
    texture.anisotropy = 16;
    //if(!bubble) return null;
    const [ velocity, setVelocity ] = useState(bubble.velocity);
    const normalizedVelocity = useMemo(() => {
        return {
        x: velocity.x / Math.sqrt(velocity.x ** 2 + velocity.y ** 2),
        y: velocity.y / Math.sqrt(velocity.x ** 2 + velocity.y ** 2),
        }
    }, [velocity]);
    const inverseVelocity = { x: -velocity.x, y: -velocity.y };
    const radius = massToRadius(bubble?.mass ?? 0);

    const hasTokens = useMemo(() => {
        return getBubbleStateResourceMass(bubble, ResourceType.ENERGY) > 0;
    }, [bubble]);

    const [mainBubble, setMainBubble] = useState<BubbleState>(null);
    const [position, setPosition] = useState(new THREE.Vector3(0,0,0));
    const [lerpedRadius, setLerpedRadius] = useState<number>(radius);


    useFrame((state, delta) => {
        const elapsedTime = delta;
        const timeSinceLastUpdate = timestampDiff;

        const lerpFactor = LERP_SPEED * Math.pow(elapsedTime / timeSinceLastUpdate, 2.5);
       //console.log("lerpFactor", lerpFactor)
        const bubble = currentState.bubbles.find(
            (bubble) => bubble.id === bubbleId,
        );
        if (!bubble) {
            //console.log("bubble not found")
            return;
        }

        if (!meshRef.current) {
            //console.log("bubble not found")
            return;
        }

        if (!meshRef.current.position.x || !meshRef.current.position.y) {
            const startPosition = bubbleStartPositions[bubbleId];
           //console.log("fetching start position", startPosition);
            if (false) {
                meshRef.current.position.set(
                    startPosition.x,
                    startPosition.y,
                    0,
                );
            } else {
                //Get start position from bubble.from
                const fromBubble = currentState.bubbles.find((newBubble) => {
                    return (
                        newBubble.id.toLowerCase() == bubble.from.toLowerCase()
                    );
                });
                const fromPortal = currentState.portals.find(
                    (portal) => portal.id == bubble.from,
                );
                const fromNode = currentState.nodes.find(
                    (node) => node.id == bubble.from,
                );

               //console.log("from node", bubble.from);

                if (fromBubble) {
                    meshRef.current.position.set(
                        fromBubble.position.x,
                        fromBubble.position.y,
                        0,
                    );
                } else if (fromPortal) {
                    meshRef.current.position.set(
                        fromPortal.position.x,
                        fromPortal.position.y,
                        0,
                    );
                } else if (fromNode) {
                    meshRef.current.position.set(
                        fromNode.position.x,
                        fromNode.position.y,
                        0,
                    );
                } else {
                   //console.log("bubble.from not found");
                }
                meshRef.current.scale.set(0, 0, 0);
                meshRef.current.material.depthTest = false;
                meshRef.current.renderOrder = 10;
            }
            //console.log("bubble not found")
        }
        const radius = massToRadius(bubble.mass);
        const newRadius = MathUtils.lerp(meshRef.current.scale.x, radius, 0.1);
        meshRef.current.scale.set(newRadius, newRadius, newRadius);
        setLerpedRadius(newRadius);
        //console.log("bubble position:", bubble.position)
        const lastX = meshRef.current.position.x;
        const newX = MathUtils.lerp(
            meshRef.current.position.x,
            bubble.position.x,
            LERP_SPEED,
        );
        const newY = MathUtils.lerp(
            meshRef.current.position.y,
            bubble.position.y,
            LERP_SPEED,
        );
        meshRef.current.position.set(newX, newY, 0);
        meshRef.current.updateMatrix();

        setPosition(new THREE.Vector3(newX, newY, 10));

        const newVelocityX = MathUtils.lerp(
            velocity.x,
            bubble.velocity.x,
            LERP_SPEED/10
        );
        const newVelocityY = MathUtils.lerp(
            velocity.y,
            bubble.velocity.y,
            LERP_SPEED/10
        );
        setVelocity({ x: newVelocityX, y: newVelocityY });
        setMainBubble(currentState.bubbles.find((bubble) => bubble.id == bubbleId));
    });

    const owner =
        currentState.bubbles.find((bubble) => bubble.id == bubbleId)?.owner ??
        "";
    const baseColor = ethereumAddressToColor(owner);
    const outlineColor = darkenColor(baseColor, 0.65); // Darken by 20%

    // useEffect(() => {
    //     //console.log("setIsBubbleSelected: ui", isSelected)
    //     dispatch(setIsBubbleSelected(isSelected));
    // }, [isSelected]);

    return (
        <>
            <BubbleMovementParticles
                direction={normalizedVelocity}
                magnitude={Math.sqrt(velocity.x ** 2 + velocity.y ** 2)}
                height={radius*2}
                count={20}
                radius={radius}
                position={position}
                color={baseColor}
            />
            {/* {hasTokens && <EffectShield position={position} radius={lerpedRadius} />} */}
            {isSelected && (
                <BubblesControlsEmit
                    isHovered={isHovered}
                    bubbleId={bubbleId}
                />
            )}
            <ShadowMesh originalMesh={
            <mesh
            args={[undefined, 60]}
                ref={meshRef}
                onPointerEnter={() => {
                    if (!isSelected) setIsHovered(true);
                }}
                onPointerMissed={() => {
                    setIsHovered(false);
                    setIsBubbleSelected(false);
                }}
                onPointerLeave={() => setIsHovered(false)}
                onClick={() => {
                    if (connectedAddress.toLowerCase() == owner.toLowerCase()) {
                        setIsSelected(!isSelected && isHovered);
                        setIsHovered(false);
                    }
                }}
                onContextMenu={() => setIsSelected(false)}
            >
                <circleGeometry />
                <meshBasicMaterial
                  toneMapped={false}
                  map={texture}
                  color={"white"}
                  transparent={true}
                  opacity={1}
                  depthWrite={true}
                  depthTest={true}
                />
                <Edges 
                color={"black"}
                linewidth={4}
                />


            </mesh>}
                originalRef={meshRef}
             />

            
            <BubblesInfo
                key={bubbleId}
                bubble={mainBubble}
                position = {position}
            />
        </>
    );
};

export const Bubbles = ({ bubbles }: { bubbles: string[] }) => {
   //console.log("bubbles2", bubbles);
    return bubbles.map((bubble, index) => (
        <Bubble key={bubble} bubbleId={bubble} />
    ));
};
