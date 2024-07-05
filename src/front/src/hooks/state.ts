import { useQuery } from "@apollo/client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    GetNoticesDocument,
    GetNoticesQuery,
    Notice,
} from "../generated-src/graphql";
import { Snapshot } from "../../../core/types/state";
import { Input, InputType, Inspect } from "../../../core/types/inputs";
import { INSPECTOR_URL } from "../consts";
import { hexToString } from "viem";
import { useBlockNumber } from "wagmi";
import { currentChain } from "../contracts";
import { getPublicClient } from "wagmi/actions";
import { useDispatch, useSelector } from "react-redux";
import { setInputs } from "../store/inputs";
import { TextureLoader } from 'three';
import { useTexture } from '@react-three/drei';
import { ResourceType } from "../../../core/types/resource";
import { currentState } from "../../../core/world";
import * as THREE from "three";
import { massToRadius } from "../../../core/funcs/utils";
import { useFrame, useThree } from "@react-three/fiber";
import { getBubbleResourceMass } from "../../../core/funcs/bubble";
import { useCreateInput, useOnClick, useOnWheel, waitForEmission } from "./inputs";
import { clearAiming, clearEmitting, setAiming, setEmitting } from "@/store/controls";
import { resourceAmountToMass } from "../../../core/funcs/resource";


export const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

const DefaultSnapshot = {
    timestamp: 0,
    pendingInputs: [],
    users: [],
    bubbles: [],
    portals: [],
    nodes: [],
    resources: [],
    obstacles: [],
};

//Get latest timestamp from blockchain
export const useBlockTimestamp = (): number => {
    const [timestamp, setTimestamp] = useState<number>(0);
    const blockNumber = useBlockNumber({
        chainId: currentChain.id,
        watch: true,
    });
    useEffect(() => {
        const _ = async () => {
            const block = await getPublicClient({
                chainId: currentChain.id,
            }).getBlock({ blockNumber: blockNumber.data });
            setTimestamp(Number(block.timestamp));
        };
        _();
    }, [blockNumber]);
    return timestamp;
};

//Get the last processed timestamp within the Cartesi Machine (Seconds)
export const useMachineTimestamp = (
    snapshot: Snapshot,
    notices: Notice[],
): number => {
    //get notice with the highest timestamp
    const greatestNoticeTimestamp = notices
        ?.map((notice) => notice.input.timestamp)
        ?.reduce((prev: number, current: number) => {
            return prev > current ? prev : current;
        }, 0);

    //get the last processed timestamp
    const snapshotTimestamp = snapshot?.timestamp || 0;

    //return the greatest timestamp
    return Math.max(greatestNoticeTimestamp, snapshotTimestamp);
};

//Use effect that runs every specified amount of seconds
export const useInterval = (callback: () => void, delay: number) => {
    const savedCallback = useRef<() => void>();

    // Remember the latest callback
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    // Set up the interval
    useEffect(() => {
        function tick() {
            if (savedCallback.current) savedCallback.current();
        }
        if (delay !== null) {
            const id = setInterval(tick, delay);
            return () => clearInterval(id);
        }
    }, [delay]);
};

//Get current timestamp on local machine (Seconds)
export const useLocalTimestamp = (): number => {
    const [timestamp, setTimestamp] = useState<number>(0);
    useEffect(() => {
        const intervalId = setInterval(() => setTimestamp(Date.now() / 1000), 1000);
        return () => clearInterval(intervalId);
    }, []);
    return timestamp;
};

//Inspect the state of the Cartesi Machine
export const inspectState = async (
    inspect: Inspect,
): Promise<Snapshot | undefined> => {
    const param = JSON.stringify(inspect);
    const url = `${INSPECTOR_URL}/${param}`;
    const response = await fetch(url);
    const json = await response.json();
    if (!json) return undefined;
    const payloadString = json?.reports[0]?.payload;
    if (!payloadString) return undefined;
    return JSON.parse(hexToString(payloadString)) as Snapshot;
};

//Hook to inspect the state of the Cartesi Machine
export const useInspect = (
    inspect: Inspect,
): {
    loading: boolean;
    error: any;
    snapshot: Snapshot | undefined;
} => {
    const [snapshot, setSnapshot] = useState<Snapshot | undefined>(
        DefaultSnapshot,
    );
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<any>(undefined);

    useEffect(() => {
        const _ = async () => {
            setLoading(true);
            const snapshot = await inspectState(inspect);
            //console.log("snapshot fetched", snapshot);
            if (snapshot) setSnapshot(snapshot);
            else setError("Could not fetch snapshot");
            setLoading(false);
        };
        _();
    }, []);

    return {
        loading,
        error,
        snapshot,
    };
};

export const useNotices = (): {
    loading: boolean;
    error: any;
    notices: Notice[];
    cursor: any;
} => {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [cursor, setCursor] = useState<string | null | undefined>(null);

    //Fetch notices
    const { loading, error, data } = useQuery<GetNoticesQuery>(
        GetNoticesDocument,
        {
            variables: { cursor },
            pollInterval: 500,
        },
    );

    //Update cursor
    const length = data?.notices?.edges?.length;
    if (length) setCursor(data.notices.pageInfo.endCursor);

    //Add new notices
    const newNotices = data?.notices?.edges?.map(
        (edge) => edge.node,
    ) as Notice[];
    if (newNotices?.length > 0) setNotices([...notices, ...newNotices]);

    //console.log("notices main2", notices);

    return {
        loading,
        error,
        notices,
        cursor,
    };
};

//Simply converts notices to actions
export const useInputs = (): {
    loading: boolean;
    error: any;
    inputs: Input[];
    cursor: any;
} => {
    const { loading, error, notices, cursor } = useNotices();
    const dispatch = useDispatch();
    const inputs = notices.map((notice) => {
        return {
            ...JSON.parse(hexToString(notice.payload as "0x{string}")),
        } as Input;
    });

    useEffect(() => {
        dispatch(setInputs(inputs));
        //console.log("inputs effect", inputs);
    }, [inputs]);

    let storeInputs = useSelector((state) => state.inputs.inputs);

    //console.log("inputs main2", storeInputs);
    return { loading, error, inputs: storeInputs, cursor };
};


export const usePfpTexture = (imageUrl, fallbackImage, social) => {
    const [validatedUrl, setValidatedUrl] = useState(null);

    useEffect(() => {
      // Function to check image availability
      const validateImage = async (url) => {
        try {
            console.log("fetching image", url)
          const response = await fetch(url, { method: 'HEAD' });
          if (response.ok) {
            setValidatedUrl(url);
          } else {
            setValidatedUrl(fallbackImage);
          }
        } catch (error) {
          console.error('Error fetching image:', error);
          setValidatedUrl(fallbackImage);
        }
      };
      
      const img = social ? "https://unavatar.io/x/" + social : imageUrl;
      validateImage(img);
    }, [imageUrl, fallbackImage]);
  
    // Load the texture from the validated URL
    const texture = useTexture(validatedUrl || fallbackImage);
  
    return texture;
  };


//Controls

export const useAiming = (): {mass: number, type: ResourceType, id: string, isPortal:boolean} => {
    const aiming = useSelector((state: any) => state.controls.aiming)
    return aiming ?? {mass: null, type: null, id: null, isPortal: false};
}

export const useClearAiming = (): () => void => {
    const dispatch = useDispatch();
    return useCallback(() => {
        dispatch(clearAiming());
    }, [])
}

export const useIsAiming = (): boolean => {
    const aiming = useAiming();
    return aiming.id != null;
}

export const useAimingResource = (): ResourceType => {
    const { type } = useAiming();
    return type;
}

export const useAimingLine = (): [THREE.Vector3, THREE.Vector3, THREE.Vector3] => {
    const { viewport } = useThree();
    const { id, isPortal } = useAiming();
    
    const [p1, setP1] = useState<THREE.Vector3>(new THREE.Vector3(10, 10, 0));
    const [p2, setP2] = useState<THREE.Vector3>(new THREE.Vector3(20, 0, 0));
    const [direction, setDirection] = useState<THREE.Vector3>(new THREE.Vector3(10, 0, 0));

    //Calculate direction
    useFrame(({ pointer, camera }) => {
        if(!id) return;
        const entity = (isPortal ? currentState?.portals : currentState?.bubbles)?.find((entity) => entity.id == id) ?? {position: {x: 0, y: 0}, mass: 0};
        const position = new THREE.Vector3(entity.position.x, entity.position.y, 0)
        const radius = massToRadius(entity.mass)
        const length = radius * 3;

        //camera.updateProjectionMatrix();
        const x = ((pointer.x * viewport.getCurrentViewport().width) / 2) + camera.position.x;
        const y = (pointer.y * viewport.getCurrentViewport().height) / 2 + camera.position.y;
        const worldMouse = new THREE.Vector3(x, y, 0);

        // Calculate the direction vector
        const directionVector = worldMouse.sub(position).normalize();
        setDirection(directionVector);
        setP1(position);
        setP2(position.clone().add(directionVector.clone().multiplyScalar(length)));
    });

    return [
        p1,
        p2,
        direction,
    ]
}

export const useAimingMass = (): number => {
    const { id, type, isPortal } = useAiming();
    const [mass, setMass] = useState<number>(1);

    //Handle scrolling to change mass
    useOnWheel((event) => {
        if(id){
            const entity = (isPortal ? currentState?.portals : currentState?.bubbles)?.find((entity) => entity.id == id) ?? {position: {x: 0, y: 0}, mass: 0, resources: []};
            const max = entity?.resources?.find((resource) => resource.resource == type)?.mass ?? 0;
            const minMass = 1;
            const step = 1;
            const newMass = Math.min(
                Math.max(mass + (Math.sign(event.deltaY) * step), minMass),
                max,
            );
            setMass(newMass);
        }
        
    });

    return mass;
}

export const getEntityMass = (id: string): number => {
    const bubble = currentState?.bubbles?.find((bubble) => bubble.id == id)
    const portal = currentState?.portals?.find((portal) => portal.id == id)
    return bubble?.mass ?? portal?.mass ?? 0;
}


export const useAimingFire = (
    mass: number,
    direction: THREE.Vector3,
): () => void => {
    const { id, type } = useAiming();
    const dispatch = useDispatch()
    const { isError, isLoading, isSuccess, submitTransaction } =
        useCreateInput({
            type: InputType.Emit,
            mass,
            from: id,
            direction,
            emissionType: type,
        });
    

    return useCallback(() => {
       //console.log("is firing")
        //if (isError || isLoading || isSuccess) return;
        dispatch(clearAiming());
        dispatch(setEmitting({mass, type, id, x: direction.x, y: direction.y}))
        submitTransaction()
        waitForEmission(
            id, 
            getEntityMass(id),
            resourceAmountToMass(type, mass), 
            () => dispatch(clearEmitting(id))
        )
    }, [mass, direction, id, type]);
    
}

export const useEmissions = (): {mass: number, type: ResourceType, id: string, p1: THREE.Vector3, p2: THREE.Vector3}[] => {
    const emitting:{[id: string]: {id:string, mass: number, type: ResourceType, x: number, y: number}}
        = useSelector((state: any) => state.controls.emitting);
    const [emits, setEmits] = useState<{mass: number, type: ResourceType, id: string, p1: THREE.Vector3, p2: THREE.Vector3}[]>([]);

    useFrame(() => {
        setEmits(
            Object.values(emitting).map((emission) => {
                const bubble = currentState?.bubbles?.find((bubble) => bubble.id == emission.id) ?? {position: {x: 0, y: 0}, mass: 0};
                const p1 = new THREE.Vector3(bubble.position.x, bubble.position.y, 0)
                const p2 = new THREE.Vector3(bubble.position.x + emission.x, bubble.position.y + emission.y, 0)

                return {
                    mass: emission.mass,
                    type: emission.type,
                    id: emission.id,
                    p1,
                    p2
                }
            })
        )
    });

    return emits;
}

// export const useClearEmission = (id: string): () => void => {
//     const dispatch = useDispatch();
//     return useCallback(() => {
//         dispatch(clearEmitting(id));
//     }, [id])
// }