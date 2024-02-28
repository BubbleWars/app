import { useContractWrite } from "wagmi";
import {
  CartesiDAppAddress,
  EtherPortal,
  InputBox,
  currentChain,
} from "../contracts";
import { Input, InputType } from "../../../core/types/inputs";
import { parseEther, toHex, zeroAddress } from "viem";
import { useEffect, useState } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { burnerAccount, burnerAddress } from "../config";
import { publicClient } from "../main";

export const useCreateInput = (input: Input) => {
  //console.log("useCreateInput", input)
  //Check if deposit input
  const [nonce, setNonce] = useState<number | undefined>(undefined);
  const isDeposit = input.type == InputType.Deposit;
  const functionName = isDeposit ? "depositEther" : "addInput";
  const args = isDeposit
    ? [CartesiDAppAddress, zeroAddress]
    : [CartesiDAppAddress, toHex(JSON.stringify(input))];
  const contract = isDeposit ? EtherPortal : InputBox;
  const value = isDeposit ? parseEther(input.amount.toString()) : undefined;

  useEffect(() => {
    if (burnerAddress) {
      const fetchNonce = async () => {
        const transactionCount = await publicClient({
          chainId: currentChain.id,
        }).getTransactionCount({
          address: burnerAddress,
        });
        setNonce(transactionCount);
      };

      fetchNonce();
    }
  }, [burnerAddress, publicClient]);

  const val = useContractWrite({
    ...contract,
    functionName,
    args,
    account: burnerAccount,
    value,
    nonce,
  });

  return {
    ...val,
    submitTransaction: () => {
      val.write();
      setNonce(nonce + 1);
    },
  };
};

export const useOnClick = (handler: (event: MouseEvent) => void) => {
  useEffect(() => {
    // Add event listener
    document.addEventListener("click", handler);

    // Clean up the event listener on component unmount
    return () => {
      document.removeEventListener("click", handler);
    };
  }, [handler]); // Re-run the effect only if the handler changes
};

export const useOnWheel = (onWheel: (event: WheelEvent) => void) => {
  useEffect(() => {
    // Handler to call on mouse wheel event
    const handleWheel = (event: WheelEvent) => {
      // Invoke the provided onWheel function with the wheel event
      onWheel(event);
    };

    // Add wheel event listener
    window.onwheel = () => {
      return false;
    };
    window.addEventListener("wheel", handleWheel);

    // Clean up the event listener on component unmount
    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, [onWheel]); // Re-run the effect only if the onWheel function changes
};

export const useMousePosition = (handler: (event: MouseEvent) => void) => {
  useEffect(() => {
    // Add mousemove event listener
    document.addEventListener("mousemove", handler);

    // Clean up the event listener on component unmount
    return () => {
      document.removeEventListener("mousemove", handler);
    };
  }, [handler]); // Re-run the effect only if the handler changes
};
