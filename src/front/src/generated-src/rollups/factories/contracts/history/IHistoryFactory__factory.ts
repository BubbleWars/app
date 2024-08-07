/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type {
  IHistoryFactory,
  IHistoryFactoryInterface,
} from "../../../contracts/history/IHistoryFactory";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "historyOwner",
        type: "address",
      },
      {
        indexed: false,
        internalType: "contract History",
        name: "history",
        type: "address",
      },
    ],
    name: "HistoryCreated",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_historyOwner",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "_salt",
        type: "bytes32",
      },
    ],
    name: "calculateHistoryAddress",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_historyOwner",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "_salt",
        type: "bytes32",
      },
    ],
    name: "newHistory",
    outputs: [
      {
        internalType: "contract History",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_historyOwner",
        type: "address",
      },
    ],
    name: "newHistory",
    outputs: [
      {
        internalType: "contract History",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export class IHistoryFactory__factory {
  static readonly abi = _abi;
  static createInterface(): IHistoryFactoryInterface {
    return new utils.Interface(_abi) as IHistoryFactoryInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): IHistoryFactory {
    return new Contract(address, _abi, signerOrProvider) as IHistoryFactory;
  }
}
