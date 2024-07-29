/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../../../common";
import type {
  AuthorityFactory,
  AuthorityFactoryInterface,
} from "../../../../contracts/consensus/authority/AuthorityFactory";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "authorityOwner",
        type: "address",
      },
      {
        indexed: false,
        internalType: "contract Authority",
        name: "authority",
        type: "address",
      },
    ],
    name: "AuthorityCreated",
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
    name: "calculateAuthorityAddress",
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
        name: "_authorityOwner",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "_salt",
        type: "bytes32",
      },
    ],
    name: "newAuthority",
    outputs: [
      {
        internalType: "contract Authority",
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
    ],
    name: "newAuthority",
    outputs: [
      {
        internalType: "contract Authority",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const _bytecode =
  "0x608060405234801561001057600080fd5b50610cb5806100206000396000f3fe608060405234801561001057600080fd5b50600436106100405760003560e01c80629c5784146100455780635a3f27d314610074578063b3a51b8414610087575b600080fd5b610058610053366004610288565b61009a565b6040516001600160a01b03909116815260200160405180910390f35b610058610082366004610288565b610115565b6100586100953660046102b2565b6101a4565b600061010e82604051806020016100b09061025f565b601f1982820381018352601f9091011660408181526001600160a01b03881660208301520160408051601f19818403018152908290526100f392916020016102fd565b6040516020818303038152906040528051906020012061022d565b9392505050565b60008082846040516101269061025f565b6001600160a01b0390911681526020018190604051809103906000f5905080158015610156573d6000803e3d6000fd5b50604080516001600160a01b038088168252831660208201529192507f0fb2d916aa6a78060ff9e89d89d62797c6668818dec04969013c5098754380ec910160405180910390a19392505050565b600080826040516101b49061025f565b6001600160a01b039091168152602001604051809103906000f0801580156101e0573d6000803e3d6000fd5b50604080516001600160a01b038087168252831660208201529192507f0fb2d916aa6a78060ff9e89d89d62797c6668818dec04969013c5098754380ec910160405180910390a192915050565b600061010e8383306000604051836040820152846020820152828152600b8101905060ff815360559020949350505050565b6109658061031b83390190565b80356001600160a01b038116811461028357600080fd5b919050565b6000806040838503121561029b57600080fd5b6102a48361026c565b946020939093013593505050565b6000602082840312156102c457600080fd5b61010e8261026c565b6000815160005b818110156102ee57602081850181015186830152016102d4565b50600093019283525090919050565b600061031261030c83866102cd565b846102cd565b94935050505056fe608060405234801561001057600080fd5b5060405161096538038061096583398101604081905261002f91610181565b61003833610057565b336001600160a01b0382161461005157610051816100a7565b506101b1565b600080546001600160a01b038381166001600160a01b0319831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a35050565b6100af610125565b6001600160a01b0381166101195760405162461bcd60e51b815260206004820152602660248201527f4f776e61626c653a206e6577206f776e657220697320746865207a65726f206160448201526564647265737360d01b60648201526084015b60405180910390fd5b61012281610057565b50565b6000546001600160a01b0316331461017f5760405162461bcd60e51b815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e65726044820152606401610110565b565b60006020828403121561019357600080fd5b81516001600160a01b03811681146101aa57600080fd5b9392505050565b6107a5806101c06000396000f3fe608060405234801561001057600080fd5b506004361061009e5760003560e01c8063b688a36311610066578063b688a3631461010e578063bcdd1e1314610116578063d79a824014610129578063ddfdfbb014610157578063f2fde38b1461016a57600080fd5b8063159c5ea1146100a3578063715018a6146100b85780638da5cb5b146100c05780639368a3d3146100ea578063aa15efc8146100fd575b600080fd5b6100b66100b1366004610567565b61017d565b005b6100b66101d9565b6000546001600160a01b03165b6040516001600160a01b0390911681526020015b60405180910390f35b6100b66100f8366004610567565b6101ed565b6001546001600160a01b03166100cd565b6100b6610257565b6100b661012436600461058b565b61028c565b61013c610137366004610615565b610331565b604080519384526020840192909252908201526060016100e1565b6100b661016536600461066a565b6103ba565b6100b6610178366004610567565b61042a565b6101856104a8565b600180546001600160a01b0319166001600160a01b0383169081179091556040519081527f2bcd43869347a1d42f97ac6042f3d129817abd05a6125f9750fe3724e321d23e9060200160405180910390a150565b6101e16104a8565b6101eb6000610502565b565b6101f56104a8565b60015460405163fc41168360e01b81526001600160a01b0383811660048301529091169063fc41168390602401600060405180830381600087803b15801561023c57600080fd5b505af1158015610250573d6000803e3d6000fd5b5050505050565b6040513381527f27c2b702d3bff195a18baca2daf00b20a986177c5f1449af4e2d46a3c3e02ce59060200160405180910390a1565b6102946104a8565b60405163a9059cbb60e01b81526001600160a01b038381166004830152602482018390526000919085169063a9059cbb906044016020604051808303816000875af11580156102e7573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061030b91906106ac565b90508061032b5760405163099e1ca760e11b815260040160405180910390fd5b50505050565b60015460405163035e6a0960e61b8152600091829182916001600160a01b03169063d79a82409061036a908990899089906004016106f7565b606060405180830381865afa158015610387573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906103ab9190610725565b92509250925093509350939050565b6103c26104a8565b600154604051630ddfdfbb60e41b81526001600160a01b039091169063ddfdfbb0906103f49085908590600401610753565b600060405180830381600087803b15801561040e57600080fd5b505af1158015610422573d6000803e3d6000fd5b505050505050565b6104326104a8565b6001600160a01b03811661049c5760405162461bcd60e51b815260206004820152602660248201527f4f776e61626c653a206e6577206f776e657220697320746865207a65726f206160448201526564647265737360d01b60648201526084015b60405180910390fd5b6104a581610502565b50565b6000546001600160a01b031633146101eb5760405162461bcd60e51b815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e65726044820152606401610493565b600080546001600160a01b038381166001600160a01b0319831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a35050565b6001600160a01b03811681146104a557600080fd5b60006020828403121561057957600080fd5b813561058481610552565b9392505050565b6000806000606084860312156105a057600080fd5b83356105ab81610552565b925060208401356105bb81610552565b929592945050506040919091013590565b60008083601f8401126105de57600080fd5b50813567ffffffffffffffff8111156105f657600080fd5b60208301915083602082850101111561060e57600080fd5b9250929050565b60008060006040848603121561062a57600080fd5b833561063581610552565b9250602084013567ffffffffffffffff81111561065157600080fd5b61065d868287016105cc565b9497909650939450505050565b6000806020838503121561067d57600080fd5b823567ffffffffffffffff81111561069457600080fd5b6106a0858286016105cc565b90969095509350505050565b6000602082840312156106be57600080fd5b8151801515811461058457600080fd5b81835281816020850137506000828201602090810191909152601f909101601f19169091010190565b6001600160a01b038416815260406020820181905260009061071c90830184866106ce565b95945050505050565b60008060006060848603121561073a57600080fd5b8351925060208401519150604084015190509250925092565b6020815260006107676020830184866106ce565b94935050505056fea2646970667358221220c0785a1cc37ffa8f096145bce62f62d9cae719c200dba5e33a279c7f0894965164736f6c63430008130033a26469706673582212202de7e9a1b007ca2f3a7a6c53b2972dc3f889e83efde5ce289389b45306e1fe7864736f6c63430008130033";

type AuthorityFactoryConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: AuthorityFactoryConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class AuthorityFactory__factory extends ContractFactory {
  constructor(...args: AuthorityFactoryConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<AuthorityFactory> {
    return super.deploy(overrides || {}) as Promise<AuthorityFactory>;
  }
  override getDeployTransaction(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  override attach(address: string): AuthorityFactory {
    return super.attach(address) as AuthorityFactory;
  }
  override connect(signer: Signer): AuthorityFactory__factory {
    return super.connect(signer) as AuthorityFactory__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): AuthorityFactoryInterface {
    return new utils.Interface(_abi) as AuthorityFactoryInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): AuthorityFactory {
    return new Contract(address, _abi, signerOrProvider) as AuthorityFactory;
  }
}
