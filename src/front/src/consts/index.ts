export const BASE_URL = `${window.location.protocol}//${window.location.hostname}`;

const isProd = process.env.NODE_ENV == "production";
export const INSPECTOR_URL = `${BASE_URL}:8080/inspect`;
export const URL_QUERY_GRAPHQL = isProd ? `${BASE_URL}/graphql` : `${BASE_URL}:8080/graphql`;
export const RPC_URL =  isProd ? import.meta.env.VITE_RPC_HTTP_ENDPOINT :`${BASE_URL}:8545`;
export const FAUCET_URL = isProd ? `${BASE_URL}/faucet` :`${BASE_URL}:2001/trpc`;
export const INDEXER_URL = isProd ? `${BASE_URL}/indexer`:`${BASE_URL}:2567`;

//log all urls
console.log("isProd", isProd);
console.log("BASE_URL", BASE_URL);
console.log("INSPECTOR_URL", INSPECTOR_URL);
console.log("URL_QUERY_GRAPHQL", URL_QUERY_GRAPHQL);
console.log("RPC_URL", RPC_URL);
console.log("FAUCET_URL", FAUCET_URL);
console.log("INDEXER_URL", INDEXER_URL);


export const LERP_SPEED = 0.07;
