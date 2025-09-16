# AyniStaking
AyniStaking is a smart contract that enables users to stake tokens and earn rewards over time. It supports both external and virtual staking methods, allowing users to stake tokens through any EOA wallet or a turnkey wallet. The contract incorporates EIP712 signatures for secure off-chain authorization, preventing replay attacks with unique salts and nonces. It also includes features for pausing the contract, emergency withdrawals, and ownership management. The contract is upgradeable using the UUPS proxy pattern, ensuring flexibility for future enhancements.
## Overview
- **Staking Tokens**: Users can stake a specified amount of tokens for a defined interval (in months) to earn rewards based on backend-generated EIP712 signatures.
- **External Staking**: Users can stake tokens through any EOA wallet by providing a backend-signed authorization.
- **Virtual Staking**: Users can stake tokens through a turnkey wallet by providing a backend-signed authorization. Fees will be deducted in stakeed token equivalent to gas fees used. While at the time of function eexecution, Zero dev wallet will sponsor gas fee.
- **Claiming Rewards**: Users can claim their staking rewards based on the backend-generated EIP712 signatures.
## Methods

### UPGRADE_INTERFACE_VERSION

```solidity
function UPGRADE_INTERFACE_VERSION() external view returns (string)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined |

### addSigner

```solidity
function addSigner(address _signer) external nonpayable
```

Adds a backend signer. Only callable by the contract owner.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _signer | address | Address of the signer to be added. |

### claim

```solidity
function claim(bytes _encodedData, bytes _signature) external nonpayable
```

Allows a user to claim their staking rewards for a specific stake via destinationAddress.Emits a {Claimed} event after successful reward claim.

*Verifies backend-generated EIP712 signature to ensure authorized claims.      Uses salts and nonces to prevent replay attacks.      Transfers preclaim rewards in `rewardToken` and returns principal if the stake is fully claimed.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _encodedData | bytes | ABI-encoded data containing:        - stakeId: unique identifier of the stake        - interval: staking interval in months (e.g., 12 for 12 months)        - rewards: amount of reward tokens to claim        - claimedMonth: the month up to which the reward is being claimed        - expiry: signature expiry timestamp        - userId: unique user identifier        - salt: unique salt to prevent replay attacks        - nonce: unique nonce for additional replay protection |
| _signature | bytes | Backend-generated EIP712 signature authorizing the claim. |

### eip712Domain

```solidity
function eip712Domain() external view returns (bytes1 fields, string name, string version, uint256 chainId, address verifyingContract, bytes32 salt, uint256[] extensions)
```



*See {IERC-5267}.*


#### Returns

| Name | Type | Description |
|---|---|---|
| fields | bytes1 | undefined |
| name | string | undefined |
| version | string | undefined |
| chainId | uint256 | undefined |
| verifyingContract | address | undefined |
| salt | bytes32 | undefined |
| extensions | uint256[] | undefined |

### emergencyWithdraw

```solidity
function emergencyWithdraw(address _wallet, uint256 _amount, address _token) external nonpayable
```

Withdraws tokens from the contract in case of emergency.

*Only callable by the contract owner.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _wallet | address | Address to receive the withdrawn tokens. |
| _amount | uint256 | Amount of tokens to withdraw. |
| _token | address | Address of the token to withdraw. |

### feeCollector

```solidity
function feeCollector() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### initialize

```solidity
function initialize(address _stakingToken, address _rewardToken, address _feeCollector) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _stakingToken | address | undefined |
| _rewardToken | address | undefined |
| _feeCollector | address | undefined |

### isSigner

```solidity
function isSigner(address) external view returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### owner

```solidity
function owner() external view returns (address)
```



*Returns the address of the current owner.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### pauseStaking

```solidity
function pauseStaking() external nonpayable
```

Pauses the contract, preventing certain functions from being executed.




### paused

```solidity
function paused() external view returns (bool)
```



*Returns true if the contract is paused, and false otherwise.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### proxiableUUID

```solidity
function proxiableUUID() external view returns (bytes32)
```



*Implementation of the ERC-1822 {proxiableUUID} function. This returns the storage slot used by the implementation. It is used to validate the implementation&#39;s compatibility when performing an upgrade. IMPORTANT: A proxy pointing at a proxiable contract should not be considered proxiable itself, because this risks bricking a proxy that upgrades to it, by delegating to itself until out of gas. Thus it is critical that this function revert if invoked through a proxy. This is guaranteed by the `notDelegated` modifier.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### removeSigner

```solidity
function removeSigner(address _signer) external nonpayable
```

Removes a backend signer. Only callable by the contract owner.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _signer | address | Address of the signer to be removed. |

### renounceOwnership

```solidity
function renounceOwnership() external nonpayable
```



*Leaves the contract without owner. It will not be possible to call `onlyOwner` functions. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby disabling any functionality that is only available to the owner.*


### rewardToken

```solidity
function rewardToken() external view returns (contract IERC20)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IERC20 | undefined |

### setFeeCollector

```solidity
function setFeeCollector(address _feeCollector) external nonpayable
```

Updates the address that collects staking fees.

*Only callable by the contract owner.      Reverts if the provided address is the zero address.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _feeCollector | address | The new address to receive staking fees. |

### stakeExternal

```solidity
function stakeExternal(bytes _encodedData, bytes _signature) external nonpayable
```

Allows a user to stake tokens by providing a backend-signed authorization through any EOA wallet.Emits a {Staked} event after a successful stake.

*Uses EIP712 typed data signatures to verify off-chain authorization.      Prevents replay attacks using unique salts and ensures the stake does not already exist.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _encodedData | bytes | ABI-encoded data containing:        - destinationAddress: A turnkey address where rewards will be claimed        - stakeId: unique identifier for this stake        - endTime: timestamp when the stake fully mature.        - interval: staking interval in months (e.g., 12 for 12 months)        - amount: amount of tokens to stake        - userId: unique user identifier from backend        - salt: unique salt to prevent replay |
| _signature | bytes | Backend-generated EIP712 signature authorizing the stake. |

### stakeVirtual

```solidity
function stakeVirtual(bytes _encodedData, bytes _signature) external nonpayable
```

Allows a user to stake tokens by providing a backend-signed authorization through turnkey wallet.Emits a {Staked} event after a successful stake.

*Uses EIP712 typed data signatures to verify off-chain authorization.      Prevents replay attacks using unique salts and ensures the stake does not already exist.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _encodedData | bytes | ABI-encoded data containing:        - sourceAddress: address from which tokens will be staked        - stakeId: unique identifier for this stake        - interval: staking interval in months (e.g., 12 for 12 months)        - endTime: timestamp when the stake fully mature.        - amount: amount of tokens to stake        - feeTokens: amount of tokens to be deducted as gas fee        - userId: unique user identifier from backend        - salt: unique salt to prevent replay |
| _signature | bytes | Backend-generated EIP712 signature authorizing the stake. |

### stakes

```solidity
function stakes(bytes32, uint256, uint256) external view returns (uint256 amount, uint256 startTime, uint256 endTime, uint256 claimedAmount, uint256 claimedUntilMonth, address staker, address claimAddress, bool isClaimed, bool isActive)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |
| _1 | uint256 | undefined |
| _2 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| amount | uint256 | undefined |
| startTime | uint256 | undefined |
| endTime | uint256 | undefined |
| claimedAmount | uint256 | undefined |
| claimedUntilMonth | uint256 | undefined |
| staker | address | undefined |
| claimAddress | address | undefined |
| isClaimed | bool | undefined |
| isActive | bool | undefined |

### stakingToken

```solidity
function stakingToken() external view returns (contract IERC20)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IERC20 | undefined |

### transferOwnership

```solidity
function transferOwnership(address newOwner) external nonpayable
```



*Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newOwner | address | undefined |

### unpauseStaking

```solidity
function unpauseStaking() external nonpayable
```

Unpauses the contract, allowing functions to be executed again.




### upgradeToAndCall

```solidity
function upgradeToAndCall(address newImplementation, bytes data) external payable
```



*Upgrade the implementation of the proxy to `newImplementation`, and subsequently execute the function call encoded in `data`. Calls {_authorizeUpgrade}. Emits an {Upgraded} event.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newImplementation | address | undefined |
| data | bytes | undefined |

### usedNonces

```solidity
function usedNonces(bytes32, uint256, bytes32) external view returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |
| _1 | uint256 | undefined |
| _2 | bytes32 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### usedSalts

```solidity
function usedSalts(bytes32) external view returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |



## Events

### Claimed

```solidity
event Claimed(address indexed caller, bytes32 indexed userId, uint256 stakeId, uint256 interval, uint256 lastPreclaimMonth, uint256 reward, uint256 principal)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| caller `indexed` | address | undefined |
| userId `indexed` | bytes32 | undefined |
| stakeId  | uint256 | undefined |
| interval  | uint256 | undefined |
| lastPreclaimMonth  | uint256 | undefined |
| reward  | uint256 | undefined |
| principal  | uint256 | undefined |

### EIP712DomainChanged

```solidity
event EIP712DomainChanged()
```



*MAY be emitted to signal that the domain could have changed.*


### EmergencyWithdraw

```solidity
event EmergencyWithdraw(address indexed wallet, address token, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| wallet `indexed` | address | undefined |
| token  | address | undefined |
| amount  | uint256 | undefined |

### Initialized

```solidity
event Initialized(uint64 version)
```



*Triggered when the contract has been initialized or reinitialized.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| version  | uint64 | undefined |

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| previousOwner `indexed` | address | undefined |
| newOwner `indexed` | address | undefined |

### Paused

```solidity
event Paused(address account)
```



*Emitted when the pause is triggered by `account`.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| account  | address | undefined |

### Staked

```solidity
event Staked(address indexed sourceAddress, address indexed destinationAddress, bytes32 indexed userId, uint256 stakeId, uint256 interval, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| sourceAddress `indexed` | address | undefined |
| destinationAddress `indexed` | address | undefined |
| userId `indexed` | bytes32 | undefined |
| stakeId  | uint256 | undefined |
| interval  | uint256 | undefined |
| amount  | uint256 | undefined |

### Unpaused

```solidity
event Unpaused(address account)
```



*Emitted when the pause is lifted by `account`.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| account  | address | undefined |

### Upgraded

```solidity
event Upgraded(address indexed implementation)
```



*Emitted when the implementation is upgraded.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| implementation `indexed` | address | undefined |



## Errors

### AddressEmptyCode

```solidity
error AddressEmptyCode(address target)
```



*There&#39;s no code at `target` (it is not a contract).*

#### Parameters

| Name | Type | Description |
|---|---|---|
| target | address | undefined |

### AlreadyClaimed

```solidity
error AlreadyClaimed()
```






### AlreadyStaked

```solidity
error AlreadyStaked()
```






### ECDSAInvalidSignature

```solidity
error ECDSAInvalidSignature()
```



*The signature derives the `address(0)`.*


### ECDSAInvalidSignatureLength

```solidity
error ECDSAInvalidSignatureLength(uint256 length)
```



*The signature has an invalid length.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| length | uint256 | undefined |

### ECDSAInvalidSignatureS

```solidity
error ECDSAInvalidSignatureS(bytes32 s)
```



*The signature has an S value that is in the upper half order.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| s | bytes32 | undefined |

### ERC1967InvalidImplementation

```solidity
error ERC1967InvalidImplementation(address implementation)
```



*The `implementation` of the proxy is invalid.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| implementation | address | undefined |

### ERC1967NonPayable

```solidity
error ERC1967NonPayable()
```



*An upgrade function sees `msg.value &gt; 0` that may be lost.*


### EnforcedPause

```solidity
error EnforcedPause()
```



*The operation failed because the contract is paused.*


### ExpectedPause

```solidity
error ExpectedPause()
```



*The operation failed because the contract is not paused.*


### FailedCall

```solidity
error FailedCall()
```



*A call to an address target failed. The target may have reverted.*


### InsufficientBalance

```solidity
error InsufficientBalance()
```






### InvalidAddress

```solidity
error InvalidAddress()
```






### InvalidClaimAddress

```solidity
error InvalidClaimAddress()
```






### InvalidInitialization

```solidity
error InvalidInitialization()
```



*The contract is already initialized.*


### InvalidInput

```solidity
error InvalidInput()
```






### InvalidSignature

```solidity
error InvalidSignature()
```






### InvalidSigner

```solidity
error InvalidSigner()
```






### InvalidStakeAddress

```solidity
error InvalidStakeAddress()
```






### NonceAlreadyUsed

```solidity
error NonceAlreadyUsed()
```






### NotInitializing

```solidity
error NotInitializing()
```



*The contract is not initializing.*


### NotMatured

```solidity
error NotMatured()
```






### OwnableInvalidOwner

```solidity
error OwnableInvalidOwner(address owner)
```



*The owner is not a valid owner account. (eg. `address(0)`)*

#### Parameters

| Name | Type | Description |
|---|---|---|
| owner | address | undefined |

### OwnableUnauthorizedAccount

```solidity
error OwnableUnauthorizedAccount(address account)
```



*The caller account is not authorized to perform an operation.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |

### PreclaimNotMatured

```solidity
error PreclaimNotMatured()
```






### ReentrancyGuardReentrantCall

```solidity
error ReentrancyGuardReentrantCall()
```



*Unauthorized reentrant call.*


### SafeERC20FailedOperation

```solidity
error SafeERC20FailedOperation(address token)
```



*An operation with an ERC-20 token failed.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| token | address | undefined |

### SaltAlreadyUsed

```solidity
error SaltAlreadyUsed()
```






### SignatureExpired

```solidity
error SignatureExpired()
```






### StakeAlreadyExists

```solidity
error StakeAlreadyExists()
```






### StakeNotFound

```solidity
error StakeNotFound()
```






### TransferFailed

```solidity
error TransferFailed()
```






### UUPSUnauthorizedCallContext

```solidity
error UUPSUnauthorizedCallContext()
```



*The call is from an unauthorized context.*


### UUPSUnsupportedProxiableUUID

```solidity
error UUPSUnsupportedProxiableUUID(bytes32 slot)
```



*The storage `slot` is unsupported as a UUID.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| slot | bytes32 | undefined |


