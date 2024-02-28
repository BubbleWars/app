import { privateKeyToAccount, privateKeyToAddress } from "viem/accounts";
import { getBurnerWallet } from "./utils/burner";

export const burnerPrivateKey = getBurnerWallet();
export const burnerAccount = privateKeyToAccount(
    burnerPrivateKey.value as `0x{string}`,
);
export const burnerAddress = privateKeyToAddress(
    burnerPrivateKey.value as `0x{string}`,
);
