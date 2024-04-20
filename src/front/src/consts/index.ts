export const BASE_URL = `${window.location.protocol}//${window.location.hostname}`;

const isProd = process.env.NODE_ENV == "production";
export const INSPECTOR_URL = `${BASE_URL}:8080/inspect`;
export const URL_QUERY_GRAPHQL = `${BASE_URL}:8080/graphql`;
export const RPC_URL =  isProd ? `${BASE_URL}/node` :`${BASE_URL}:8545`;
export const FAUCET_URL = isProd ? `${BASE_URL}/faucet` :`${BASE_URL}:2001/trpc`;
export const INDEXER_URL = isProd ? `${BASE_URL}/indexer`:`${BASE_URL}:2567`;

export const LERP_SPEED = 0.07;
