//import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { ethers } from "ethers";
//import { isHex, Hex } from "viem";
import { BehaviorSubject } from "rxjs";

// This is a modified version of the burner wallet code from viem

type Hex = string;

function isHex(value: string): value is Hex {
    return /^0x[0-9a-f]*$/i.test(value);
}

function generatePrivateKey(): Hex {
    const randomBytes = ethers.randomBytes(32);
    return ethers.hexlify(randomBytes);
}

export function privateKeyToAccount(privateKey: Hex): string {
    const wallet = new ethers.Wallet(privateKey);
    return wallet.address;
}

function assertPrivateKey(
    privateKey: string,
    cacheKey: string,
): asserts privateKey is Hex {
    if (!isHex(privateKey)) {
        console.error("Private key found in cache is not valid hex", {
            privateKey,
            cacheKey,
        });
        throw new Error(
            `Private key found in cache (${cacheKey}) is not valid hex`,
        );
    }
    // ensure we can extract address from private key
    // this should throw on bad private keys
    privateKeyToAccount(privateKey);
}

export function getBurnerWallet(
    cacheKey = "bubblewars:burnerWallet",
): BehaviorSubject<Hex> {
    const cachedPrivateKey = localStorage.getItem(cacheKey);

    if (cachedPrivateKey != null) {
        assertPrivateKey(cachedPrivateKey, cacheKey);
    }

    const subject =
        cachedPrivateKey != null
            ? new BehaviorSubject(cachedPrivateKey)
            : (() => {
                  const privateKey = generatePrivateKey();
                  console.log(
                      "New burner wallet created:",
                      privateKeyToAccount(privateKey),
                  );
                  localStorage.setItem(cacheKey, privateKey);
                  return new BehaviorSubject(privateKey);
              })();

    window.addEventListener("storage", function listener(event) {
        // Clean up
        if (subject.closed) {
            window.removeEventListener("storage", listener);
            return;
        }

        if (event.key !== cacheKey) return;
        if (event.storageArea !== localStorage) return;

        if (!event.newValue) {
            // We'll intentionally not create a new burner wallet here to avoid potential infinite
            // loop issues, and just warn the user. A refresh will go through the logic above to
            // create a new burner wallet.
            console.warn(
                "Burner wallet removed from cache! You may need to reload to create a new wallet.",
            );
            return;
        }

        assertPrivateKey(event.newValue, cacheKey);
        subject.next(event.newValue);
    });

    return subject;
}
