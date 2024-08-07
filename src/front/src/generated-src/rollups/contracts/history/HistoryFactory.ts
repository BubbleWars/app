/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type {
  FunctionFragment,
  Result,
  EventFragment,
} from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "../../common";

export interface HistoryFactoryInterface extends utils.Interface {
  functions: {
    "calculateHistoryAddress(address,bytes32)": FunctionFragment;
    "newHistory(address,bytes32)": FunctionFragment;
    "newHistory(address)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "calculateHistoryAddress"
      | "newHistory(address,bytes32)"
      | "newHistory(address)"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "calculateHistoryAddress",
    values: [PromiseOrValue<string>, PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(
    functionFragment: "newHistory(address,bytes32)",
    values: [PromiseOrValue<string>, PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(
    functionFragment: "newHistory(address)",
    values: [PromiseOrValue<string>]
  ): string;

  decodeFunctionResult(
    functionFragment: "calculateHistoryAddress",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "newHistory(address,bytes32)",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "newHistory(address)",
    data: BytesLike
  ): Result;

  events: {
    "HistoryCreated(address,address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "HistoryCreated"): EventFragment;
}

export interface HistoryCreatedEventObject {
  historyOwner: string;
  history: string;
}
export type HistoryCreatedEvent = TypedEvent<
  [string, string],
  HistoryCreatedEventObject
>;

export type HistoryCreatedEventFilter = TypedEventFilter<HistoryCreatedEvent>;

export interface HistoryFactory extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: HistoryFactoryInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    /**
     * Beware that only the `newHistory` function with the `_salt` parameter      is able to deterministically deploy a history.
     * Calculate the address of a history to be deployed deterministically.
     * @param _historyOwner The initial history owner
     * @param _salt The salt used to deterministically generate the history address
     */
    calculateHistoryAddress(
      _historyOwner: PromiseOrValue<string>,
      _salt: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<[string]>;

    /**
     * On success, MUST emit a `HistoryCreated` event.
     * Deploy a new history deterministically.
     * @param _historyOwner The initial history owner
     * @param _salt The salt used to deterministically generate the history address
     */
    "newHistory(address,bytes32)"(
      _historyOwner: PromiseOrValue<string>,
      _salt: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    /**
     * On success, MUST emit a `HistoryCreated` event.
     * Deploy a new history.
     * @param _historyOwner The initial history owner
     */
    "newHistory(address)"(
      _historyOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;
  };

  /**
   * Beware that only the `newHistory` function with the `_salt` parameter      is able to deterministically deploy a history.
   * Calculate the address of a history to be deployed deterministically.
   * @param _historyOwner The initial history owner
   * @param _salt The salt used to deterministically generate the history address
   */
  calculateHistoryAddress(
    _historyOwner: PromiseOrValue<string>,
    _salt: PromiseOrValue<BytesLike>,
    overrides?: CallOverrides
  ): Promise<string>;

  /**
   * On success, MUST emit a `HistoryCreated` event.
   * Deploy a new history deterministically.
   * @param _historyOwner The initial history owner
   * @param _salt The salt used to deterministically generate the history address
   */
  "newHistory(address,bytes32)"(
    _historyOwner: PromiseOrValue<string>,
    _salt: PromiseOrValue<BytesLike>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  /**
   * On success, MUST emit a `HistoryCreated` event.
   * Deploy a new history.
   * @param _historyOwner The initial history owner
   */
  "newHistory(address)"(
    _historyOwner: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    /**
     * Beware that only the `newHistory` function with the `_salt` parameter      is able to deterministically deploy a history.
     * Calculate the address of a history to be deployed deterministically.
     * @param _historyOwner The initial history owner
     * @param _salt The salt used to deterministically generate the history address
     */
    calculateHistoryAddress(
      _historyOwner: PromiseOrValue<string>,
      _salt: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<string>;

    /**
     * On success, MUST emit a `HistoryCreated` event.
     * Deploy a new history deterministically.
     * @param _historyOwner The initial history owner
     * @param _salt The salt used to deterministically generate the history address
     */
    "newHistory(address,bytes32)"(
      _historyOwner: PromiseOrValue<string>,
      _salt: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<string>;

    /**
     * On success, MUST emit a `HistoryCreated` event.
     * Deploy a new history.
     * @param _historyOwner The initial history owner
     */
    "newHistory(address)"(
      _historyOwner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<string>;
  };

  filters: {
    "HistoryCreated(address,address)"(
      historyOwner?: null,
      history?: null
    ): HistoryCreatedEventFilter;
    HistoryCreated(
      historyOwner?: null,
      history?: null
    ): HistoryCreatedEventFilter;
  };

  estimateGas: {
    /**
     * Beware that only the `newHistory` function with the `_salt` parameter      is able to deterministically deploy a history.
     * Calculate the address of a history to be deployed deterministically.
     * @param _historyOwner The initial history owner
     * @param _salt The salt used to deterministically generate the history address
     */
    calculateHistoryAddress(
      _historyOwner: PromiseOrValue<string>,
      _salt: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    /**
     * On success, MUST emit a `HistoryCreated` event.
     * Deploy a new history deterministically.
     * @param _historyOwner The initial history owner
     * @param _salt The salt used to deterministically generate the history address
     */
    "newHistory(address,bytes32)"(
      _historyOwner: PromiseOrValue<string>,
      _salt: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    /**
     * On success, MUST emit a `HistoryCreated` event.
     * Deploy a new history.
     * @param _historyOwner The initial history owner
     */
    "newHistory(address)"(
      _historyOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    /**
     * Beware that only the `newHistory` function with the `_salt` parameter      is able to deterministically deploy a history.
     * Calculate the address of a history to be deployed deterministically.
     * @param _historyOwner The initial history owner
     * @param _salt The salt used to deterministically generate the history address
     */
    calculateHistoryAddress(
      _historyOwner: PromiseOrValue<string>,
      _salt: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    /**
     * On success, MUST emit a `HistoryCreated` event.
     * Deploy a new history deterministically.
     * @param _historyOwner The initial history owner
     * @param _salt The salt used to deterministically generate the history address
     */
    "newHistory(address,bytes32)"(
      _historyOwner: PromiseOrValue<string>,
      _salt: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    /**
     * On success, MUST emit a `HistoryCreated` event.
     * Deploy a new history.
     * @param _historyOwner The initial history owner
     */
    "newHistory(address)"(
      _historyOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;
  };
}
