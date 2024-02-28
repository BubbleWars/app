import { useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import {
    GetNoticesDocument,
    GetNoticesQuery,
    Notice,
} from "../generated-src/graphql";
import { Snapshot } from "../../../core/types/state";
import { Input, Inspect } from "../../../core/types/inputs";
import { INSPECTOR_URL } from "../consts";
import { hexToString } from "viem";
import { useBlockNumber } from "wagmi";
import { currentChain } from "../contracts";
import { getPublicClient } from "wagmi/actions";
import { useDispatch, useSelector } from "react-redux";
import { setInputs } from "../store/inputs";

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
