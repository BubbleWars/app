import {
    CartesiDApp__factory,
    ERC20Portal__factory,
    ERC721Portal__factory,
    InputBox__factory,
    EtherPortal__factory,
    CartesiDAppFactory__factory,
    DAppAddressRelay__factory,
    ERC1155BatchPortal__factory,
    ERC1155SinglePortal__factory,
} from "@cartesi/rollups";
import { erc20ABI } from "wagmi";
import { defineChain } from "viem";
import { RPC_URL } from "./consts";

const isProd = process.env.NODE_ENV == "production";
const blockchainId = isProd ? import.meta.env.VITE_CARTESI_BLOCKCHAIN_ID : 31337;
export const currentChain = defineChain({
    id: blockchainId,
    name: "bubblewars_anvil",
    network: "bubblewars_anvil",
    nativeCurrency: {
        decimals: 18,
        name: "Ether",
        symbol: "ETH",
    },
    rpcUrls: {
        default: { http: [RPC_URL] },
        public: { http: [RPC_URL] },
    },
});

export const CartesiDAppFactoryAddress =
    "0x7122cd1221C20892234186facfE8615e6743Ab02";
export const DAppAddressRelayAddress =
    "0xF5DE34d6BbC0446E2a45719E718efEbaaE179daE";
export const ERC1155BatchPortalAddress =
    "0xedB53860A6B52bbb7561Ad596416ee9965B055Aa";
export const ERC1155SinglePortalAddress =
    "0x7CFB0193Ca87eB6e48056885E026552c3A941FC4";
export const ERC20PortalAddress = "0x9C21AEb2093C32DDbC53eEF24B873BDCd1aDa1DB";
export const ERC721PortalAddress = "0x237F8DD094C0e47f4236f12b4Fa01d6Dae89fb87";
export const EtherPortalAddress = process?.env?.CARTESI_CONTRACTS_ETHER_PORTAL_ADDRESS ??
"0xFfdbe43d4c855BF7e0f105c400A50857f53AB044";
export const InputBoxAddress = process?.env?.CARTESI_CONTRACTS_INPUT_BOX_ADDRESS ??
"0x59b22D57D4f067708AB0c00552767405926dc768";
export const cartesiTokenAddress = "0xae7f61eCf06C65405560166b259C54031428A9C4";
export const CartesiDAppAddress = "0xab7528bb862fb57e8a2bcd567a2e929a0be56a5e";

export const CartesiDAppFactory = {
    address: CartesiDAppFactoryAddress,
    abi: CartesiDAppFactory__factory.abi,
} as const;

export const DAppAddressRelay = {
    address: DAppAddressRelayAddress,
    abi: DAppAddressRelay__factory.abi,
} as const;

export const ERC1155BatchPortal = {
    address: ERC1155BatchPortalAddress,
    abi: ERC1155BatchPortal__factory.abi,
} as const;

export const ERC1155SinglePortal = {
    address: ERC1155SinglePortalAddress,
    abi: ERC1155SinglePortal__factory.abi,
} as const;

export const ERC20Portal = {
    address: ERC20PortalAddress,
    abi: ERC20Portal__factory.abi,
} as const;

export const ERC721Portal = {
    address: ERC721PortalAddress,
    abi: ERC721Portal__factory.abi,
} as const;

export const EtherPortal = {
    address: EtherPortalAddress,
    abi: EtherPortal__factory.abi,
} as const;

export const InputBox = {
    address: InputBoxAddress,
    abi: InputBox__factory.abi,
} as const;

export const cartesiToken = {
    address: cartesiTokenAddress,
    abi: erc20ABI,
} as const;

export const CartesiDApp = {
    address: CartesiDAppAddress,
    abi: CartesiDApp__factory.abi,
} as const;
