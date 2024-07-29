/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type { FunctionFragment, Result } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "../../../common";

export interface MerkleV2Interface extends utils.Interface {
  functions: {
    "calculateRootFromPowerOfTwo(bytes32[])": FunctionFragment;
    "getEmptyTreeHashAtIndex(uint256)": FunctionFragment;
    "getHashOfWordAtIndex(bytes,uint256)": FunctionFragment;
    "getMerkleRootFromBytes(bytes,uint256)": FunctionFragment;
    "getRootAfterReplacementInDrive(uint256,uint256,uint256,bytes32,bytes32[])": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "calculateRootFromPowerOfTwo"
      | "getEmptyTreeHashAtIndex"
      | "getHashOfWordAtIndex"
      | "getMerkleRootFromBytes"
      | "getRootAfterReplacementInDrive"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "calculateRootFromPowerOfTwo",
    values: [PromiseOrValue<BytesLike>[]]
  ): string;
  encodeFunctionData(
    functionFragment: "getEmptyTreeHashAtIndex",
    values: [PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "getHashOfWordAtIndex",
    values: [PromiseOrValue<BytesLike>, PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "getMerkleRootFromBytes",
    values: [PromiseOrValue<BytesLike>, PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "getRootAfterReplacementInDrive",
    values: [
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BytesLike>,
      PromiseOrValue<BytesLike>[]
    ]
  ): string;

  decodeFunctionResult(
    functionFragment: "calculateRootFromPowerOfTwo",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getEmptyTreeHashAtIndex",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getHashOfWordAtIndex",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getMerkleRootFromBytes",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getRootAfterReplacementInDrive",
    data: BytesLike
  ): Result;

  events: {};
}

export interface MerkleV2 extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: MerkleV2Interface;

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
     * Calculate the root of Merkle tree from an array of power of 2 elements
     * @param hashes The array containing power of 2 elements
     */
    calculateRootFromPowerOfTwo(
      hashes: PromiseOrValue<BytesLike>[],
      overrides?: CallOverrides
    ): Promise<[string]>;

    /**
     * first index is keccak(0), second index is keccak(keccak(0), keccak(0))
     * Gets precomputed hash of zero in empty tree hashes
     * @param _index of hash wanted
     */
    getEmptyTreeHashAtIndex(
      _index: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[string]>;

    /**
     * if word is incomplete (< 8 bytes) it gets padded with zeroes
     * Get the hash of a word in an array of bytes
     * @param _data array of bytes
     * @param _wordIndex index of word inside the bytes to get the hash of
     */
    getHashOfWordAtIndex(
      _data: PromiseOrValue<BytesLike>,
      _wordIndex: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[string]>;

    /**
     * _data is padded with zeroes until is multiple of 8root is completed with zero tree until log2size is completehashes are taken word by word (8 bytes by 8 bytes)
     * get merkle root of generic array of bytes
     * @param _data array of bytes to be merklelized
     * @param _log2Size log2 of total size of the drive
     */
    getMerkleRootFromBytes(
      _data: PromiseOrValue<BytesLike>,
      _log2Size: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[string]>;

    /**
     * Gets merkle root hash of drive with a replacement
     * @param _logSizeOfFullDrive log2 of size the full drive, which can be the entire machine
     * @param _logSizeOfReplacement log2 of size the replacement
     * @param _position position of _drive
     * @param _replacement hash of the replacement
     * @param siblings of replacement that merkle root can be calculated
     */
    getRootAfterReplacementInDrive(
      _position: PromiseOrValue<BigNumberish>,
      _logSizeOfReplacement: PromiseOrValue<BigNumberish>,
      _logSizeOfFullDrive: PromiseOrValue<BigNumberish>,
      _replacement: PromiseOrValue<BytesLike>,
      siblings: PromiseOrValue<BytesLike>[],
      overrides?: CallOverrides
    ): Promise<[string]>;
  };

  /**
   * Calculate the root of Merkle tree from an array of power of 2 elements
   * @param hashes The array containing power of 2 elements
   */
  calculateRootFromPowerOfTwo(
    hashes: PromiseOrValue<BytesLike>[],
    overrides?: CallOverrides
  ): Promise<string>;

  /**
   * first index is keccak(0), second index is keccak(keccak(0), keccak(0))
   * Gets precomputed hash of zero in empty tree hashes
   * @param _index of hash wanted
   */
  getEmptyTreeHashAtIndex(
    _index: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<string>;

  /**
   * if word is incomplete (< 8 bytes) it gets padded with zeroes
   * Get the hash of a word in an array of bytes
   * @param _data array of bytes
   * @param _wordIndex index of word inside the bytes to get the hash of
   */
  getHashOfWordAtIndex(
    _data: PromiseOrValue<BytesLike>,
    _wordIndex: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<string>;

  /**
   * _data is padded with zeroes until is multiple of 8root is completed with zero tree until log2size is completehashes are taken word by word (8 bytes by 8 bytes)
   * get merkle root of generic array of bytes
   * @param _data array of bytes to be merklelized
   * @param _log2Size log2 of total size of the drive
   */
  getMerkleRootFromBytes(
    _data: PromiseOrValue<BytesLike>,
    _log2Size: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<string>;

  /**
   * Gets merkle root hash of drive with a replacement
   * @param _logSizeOfFullDrive log2 of size the full drive, which can be the entire machine
   * @param _logSizeOfReplacement log2 of size the replacement
   * @param _position position of _drive
   * @param _replacement hash of the replacement
   * @param siblings of replacement that merkle root can be calculated
   */
  getRootAfterReplacementInDrive(
    _position: PromiseOrValue<BigNumberish>,
    _logSizeOfReplacement: PromiseOrValue<BigNumberish>,
    _logSizeOfFullDrive: PromiseOrValue<BigNumberish>,
    _replacement: PromiseOrValue<BytesLike>,
    siblings: PromiseOrValue<BytesLike>[],
    overrides?: CallOverrides
  ): Promise<string>;

  callStatic: {
    /**
     * Calculate the root of Merkle tree from an array of power of 2 elements
     * @param hashes The array containing power of 2 elements
     */
    calculateRootFromPowerOfTwo(
      hashes: PromiseOrValue<BytesLike>[],
      overrides?: CallOverrides
    ): Promise<string>;

    /**
     * first index is keccak(0), second index is keccak(keccak(0), keccak(0))
     * Gets precomputed hash of zero in empty tree hashes
     * @param _index of hash wanted
     */
    getEmptyTreeHashAtIndex(
      _index: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<string>;

    /**
     * if word is incomplete (< 8 bytes) it gets padded with zeroes
     * Get the hash of a word in an array of bytes
     * @param _data array of bytes
     * @param _wordIndex index of word inside the bytes to get the hash of
     */
    getHashOfWordAtIndex(
      _data: PromiseOrValue<BytesLike>,
      _wordIndex: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<string>;

    /**
     * _data is padded with zeroes until is multiple of 8root is completed with zero tree until log2size is completehashes are taken word by word (8 bytes by 8 bytes)
     * get merkle root of generic array of bytes
     * @param _data array of bytes to be merklelized
     * @param _log2Size log2 of total size of the drive
     */
    getMerkleRootFromBytes(
      _data: PromiseOrValue<BytesLike>,
      _log2Size: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<string>;

    /**
     * Gets merkle root hash of drive with a replacement
     * @param _logSizeOfFullDrive log2 of size the full drive, which can be the entire machine
     * @param _logSizeOfReplacement log2 of size the replacement
     * @param _position position of _drive
     * @param _replacement hash of the replacement
     * @param siblings of replacement that merkle root can be calculated
     */
    getRootAfterReplacementInDrive(
      _position: PromiseOrValue<BigNumberish>,
      _logSizeOfReplacement: PromiseOrValue<BigNumberish>,
      _logSizeOfFullDrive: PromiseOrValue<BigNumberish>,
      _replacement: PromiseOrValue<BytesLike>,
      siblings: PromiseOrValue<BytesLike>[],
      overrides?: CallOverrides
    ): Promise<string>;
  };

  filters: {};

  estimateGas: {
    /**
     * Calculate the root of Merkle tree from an array of power of 2 elements
     * @param hashes The array containing power of 2 elements
     */
    calculateRootFromPowerOfTwo(
      hashes: PromiseOrValue<BytesLike>[],
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    /**
     * first index is keccak(0), second index is keccak(keccak(0), keccak(0))
     * Gets precomputed hash of zero in empty tree hashes
     * @param _index of hash wanted
     */
    getEmptyTreeHashAtIndex(
      _index: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    /**
     * if word is incomplete (< 8 bytes) it gets padded with zeroes
     * Get the hash of a word in an array of bytes
     * @param _data array of bytes
     * @param _wordIndex index of word inside the bytes to get the hash of
     */
    getHashOfWordAtIndex(
      _data: PromiseOrValue<BytesLike>,
      _wordIndex: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    /**
     * _data is padded with zeroes until is multiple of 8root is completed with zero tree until log2size is completehashes are taken word by word (8 bytes by 8 bytes)
     * get merkle root of generic array of bytes
     * @param _data array of bytes to be merklelized
     * @param _log2Size log2 of total size of the drive
     */
    getMerkleRootFromBytes(
      _data: PromiseOrValue<BytesLike>,
      _log2Size: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    /**
     * Gets merkle root hash of drive with a replacement
     * @param _logSizeOfFullDrive log2 of size the full drive, which can be the entire machine
     * @param _logSizeOfReplacement log2 of size the replacement
     * @param _position position of _drive
     * @param _replacement hash of the replacement
     * @param siblings of replacement that merkle root can be calculated
     */
    getRootAfterReplacementInDrive(
      _position: PromiseOrValue<BigNumberish>,
      _logSizeOfReplacement: PromiseOrValue<BigNumberish>,
      _logSizeOfFullDrive: PromiseOrValue<BigNumberish>,
      _replacement: PromiseOrValue<BytesLike>,
      siblings: PromiseOrValue<BytesLike>[],
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    /**
     * Calculate the root of Merkle tree from an array of power of 2 elements
     * @param hashes The array containing power of 2 elements
     */
    calculateRootFromPowerOfTwo(
      hashes: PromiseOrValue<BytesLike>[],
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    /**
     * first index is keccak(0), second index is keccak(keccak(0), keccak(0))
     * Gets precomputed hash of zero in empty tree hashes
     * @param _index of hash wanted
     */
    getEmptyTreeHashAtIndex(
      _index: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    /**
     * if word is incomplete (< 8 bytes) it gets padded with zeroes
     * Get the hash of a word in an array of bytes
     * @param _data array of bytes
     * @param _wordIndex index of word inside the bytes to get the hash of
     */
    getHashOfWordAtIndex(
      _data: PromiseOrValue<BytesLike>,
      _wordIndex: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    /**
     * _data is padded with zeroes until is multiple of 8root is completed with zero tree until log2size is completehashes are taken word by word (8 bytes by 8 bytes)
     * get merkle root of generic array of bytes
     * @param _data array of bytes to be merklelized
     * @param _log2Size log2 of total size of the drive
     */
    getMerkleRootFromBytes(
      _data: PromiseOrValue<BytesLike>,
      _log2Size: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    /**
     * Gets merkle root hash of drive with a replacement
     * @param _logSizeOfFullDrive log2 of size the full drive, which can be the entire machine
     * @param _logSizeOfReplacement log2 of size the replacement
     * @param _position position of _drive
     * @param _replacement hash of the replacement
     * @param siblings of replacement that merkle root can be calculated
     */
    getRootAfterReplacementInDrive(
      _position: PromiseOrValue<BigNumberish>,
      _logSizeOfReplacement: PromiseOrValue<BigNumberish>,
      _logSizeOfFullDrive: PromiseOrValue<BigNumberish>,
      _replacement: PromiseOrValue<BytesLike>,
      siblings: PromiseOrValue<BytesLike>[],
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}