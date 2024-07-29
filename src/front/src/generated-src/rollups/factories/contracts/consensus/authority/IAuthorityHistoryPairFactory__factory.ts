/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type {
  IAuthorityHistoryPairFactory,
  IAuthorityHistoryPairFactoryInterface,
} from "../../../../contracts/consensus/authority/IAuthorityHistoryPairFactory";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "contract IAuthorityFactory",
        name: "authorityFactory",
        type: "address",
      },
      {
        indexed: false,
        internalType: "contract IHistoryFactory",
        name: "historyFactory",
        type: "address",
      },
    ],
    name: "AuthorityHistoryPairFactoryCreated",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_authorityOwner",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "_salt",
        type: "bytes32",
      },
    ],
    name: "calculateAuthorityHistoryAddressPair",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
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
    inputs: [],
    name: "getAuthorityFactory",
    outputs: [
      {
        internalType: "contract IAuthorityFactory",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getHistoryFactory",
    outputs: [
      {
        internalType: "contract IHistoryFactory",
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
        name: "_authorityOwner",
        type: "address",
      },
    ],
    name: "newAuthorityHistoryPair",
    outputs: [
      {
        internalType: "contract Authority",
        name: "",
        type: "address",
      },
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
        name: "_authorityOwner",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "_salt",
        type: "bytes32",
      },
    ],
    name: "newAuthorityHistoryPair",
    outputs: [
      {
        internalType: "contract Authority",
        name: "",
        type: "address",
      },
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

export class IAuthorityHistoryPairFactory__factory {
  static readonly abi = _abi;
  static createInterface(): IAuthorityHistoryPairFactoryInterface {
    return new utils.Interface(_abi) as IAuthorityHistoryPairFactoryInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): IAuthorityHistoryPairFactory {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as IAuthorityHistoryPairFactory;
  }
}
