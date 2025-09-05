// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {EIP712Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract AyniStaking is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    EIP712Upgradeable
{
    using ECDSA for bytes32;
    using SafeERC20 for IERC20;

    struct Stake {
        uint256 amount;
        uint256 startTime;
        uint256 endTime;
        uint256 claimedAmount; //preClaim 
        uint256 claimedUntilMonth; //preClaim
        address staker;
        address claimAddress;
        bool isClaimed;
        bool isActive;
    }

    bytes32 private constant STAKEEXTERNAL_TYPEHASH =
        keccak256(
            "StakeExternal(address destinationAddress,address sourceAddress,uint256 stakeId,uint256 intervalId,uint256 endTime,uint256 amount,bytes32 userId,bytes32 salt)"
        );

    bytes32 private constant STAKEVIRTUAL_TYPEHASH =
        keccak256(
            "StakeVirtual(address sourceAddress,uint256 stakeId,uint256 intervalId,uint256 endTime,uint256 amount,uint256 feeTokens,bytes32 userId,bytes32 salt)"
        );

    bytes32 private constant CLAIM_TYPEHASH =
        keccak256(
            "Claim(address destinationAddress,uint256 stakeId,uint256 intervalId,uint256 rewards,uint256 claimedMonth,uint256 expiry,bytes32 salt,bytes32 userId, bytes32 nonce)"
        );

    IERC20 public stakingToken;
    IERC20 public rewardToken;
    address public feeCollector;

    mapping(bytes32 => mapping(uint256 => mapping(uint256 => Stake)))
        public stakes;
    mapping(address => bool) public isSigner;
    mapping(bytes32 => bool) public usedSalts;
    mapping(bytes32 => mapping(uint256 => mapping(bytes32 => bool))) public usedNonces; 


    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Storage gap for future upgrades
     * @custom:oz-upgrades-unsafe-allow state-variable-immutable
     * state-variable-assignment 
     */ 
    uint256[50] private __gap;

    // Events
    event Staked(
        address indexed sourceAddress,
        address indexed destinationAddress,
        bytes32 indexed userId,
        uint256 stakeId,
        uint256 intervalId,
        uint256 amount
    );
    
    event Claimed(
        address indexed caller,
        bytes32 indexed userId,
        uint256 stakeId,
        uint256 intervalId,
        uint256 lastPreclaimMonth,
        uint256 reward,
        uint256 principal
    );
    
    event EmergencyWithdraw(address indexed wallet, address token , uint256 amount);

    // Custom errors
    error InvalidSignature();
    error TransferFailed();
    error InvalidInput();
    error InvalidSigner();
    error AlreadyClaimed();
    error StakeNotFound();
    error NotMatured();
    error SaltAlreadyUsed();
    error InvalidClaimAddress();
    error InvalidStakeAddress();
    error InvalidAddress();
    error AlreadyStaked();
    error SignatureExpired();
    error StakeAlreadyExists();
    error NonceAlreadyUsed();
    error PreclaimNotMatured();
    error InsufficientBalance();

    function initialize(address _stakingToken, address _rewardToken, address _feeCollector) public initializer {
        if (
            _stakingToken == address(0) ||
            _rewardToken == address(0) ||
            _feeCollector == address(0)
        ) revert InvalidInput();

        __Ownable_init(msg.sender);
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        __EIP712_init("AyniStaking", "1");

        stakingToken = IERC20(_stakingToken);
        rewardToken  = IERC20(_rewardToken);
        feeCollector = _feeCollector;
    }

    /**
     * @notice Allows a user to stake tokens by providing a backend-signed authorization through any EOA wallet.
     * @dev Uses EIP712 typed data signatures to verify off-chain authorization.
     *      Prevents replay attacks using unique salts and ensures the stake does not already exist.
     * @param _encodedData ABI-encoded data containing:
     *        - destinationAddress: A turnkey address where rewards will be claimed
     *        - stakeId: unique identifier for this stake
     *        - endTime: timestamp when the stake fully mature.
     *        - intervalId: staking interval in months (e.g., 12 for 12 months)
     *        - amount: amount of tokens to stake
     *        - userId: unique user identifier from backend
     *        - salt: unique salt to prevent replay
     * @param _signature Backend-generated EIP712 signature authorizing the stake.
     * @notice Emits a {Staked} event after a successful stake.
     */
    function stakeExternal(
        bytes calldata _encodedData,
        bytes memory _signature
    ) external nonReentrant whenNotPaused {
        (
            address destinationAddress,
            uint256 stakeId,
            uint256 endTime,
            uint256 intervalId,
            uint256 amount,
            bytes32 userId,
            bytes32 salt
        ) = abi.decode(
                _encodedData,
                (address, uint256, uint256, uint256, uint256, bytes32, bytes32)
            ); //tartTime?

        if (destinationAddress == address(0) || endTime == 0 || amount == 0)
            revert InvalidInput();
        if (usedSalts[salt]) revert SaltAlreadyUsed();
        if (stakes[userId][intervalId][stakeId].isActive)
            revert AlreadyStaked();

        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    STAKEEXTERNAL_TYPEHASH,
                    destinationAddress,
                    msg.sender,
                    stakeId,
                    intervalId,
                    endTime,
                    amount,
                    userId,
                    salt
                )
            )
        );

        usedSalts[salt] = true;

        address signer = ECDSA.recover(digest, _signature);
        if (!isSigner[signer]) revert InvalidSigner();

        stakes[userId][intervalId][stakeId] = Stake({
            amount: amount,
            startTime: block.timestamp,
            endTime: endTime,
            claimedAmount: 0, //preclaim change
            claimedUntilMonth: 0, //preclaim change
            staker: msg.sender,
            claimAddress: destinationAddress,
            isClaimed: false,
            isActive: true
        });

        stakingToken.safeTransferFrom(msg.sender, address(this), amount);

        emit Staked(
            msg.sender,
            destinationAddress,
            userId,
            stakeId,
            intervalId,
            amount
        );
    }

    /**
     * @notice Allows a user to stake tokens by providing a backend-signed authorization through turnkey wallet.
     * @dev Uses EIP712 typed data signatures to verify off-chain authorization.
     *      Prevents replay attacks using unique salts and ensures the stake does not already exist.
     * @param _encodedData ABI-encoded data containing:
     *        - stakeId: unique identifier for this stake
     *        - intervalId: staking interval in months (e.g., 12 for 12 months)
     *        - endTime: timestamp when the stake fully mature.
     *        - amount: amount of tokens to stake
     *        - feeTokens: amount of tokens to be deducted as gas fee
     *        - userId: unique user identifier from backend
     *        - salt: unique salt to prevent replay
     * @param _signature Backend-generated EIP712 signature authorizing the stake.
     * @notice Emits a {Staked} event after a successful stake.
     */
    function stakeVirtual(
        bytes calldata _encodedData,
        bytes memory _signature
    ) external nonReentrant whenNotPaused {
        (
            uint256 stakeId,
            uint256 intervalId,
            uint256 endTime,
            uint256 amount,
            uint256 feeTokens,
            bytes32 userId,
            bytes32 salt
        ) = abi.decode(
                _encodedData,
                (uint256, uint256, uint256, uint256, uint256, bytes32, bytes32)
            ); // start time??

        if (endTime == 0 || amount == 0 || feeTokens == 0) revert InvalidInput();
        if (usedSalts[salt]) revert SaltAlreadyUsed();

        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    STAKEVIRTUAL_TYPEHASH,
                    msg.sender,
                    stakeId,
                    intervalId,
                    endTime,
                    amount,
                    feeTokens,
                    userId,
                    salt
                )
            )
        );

        usedSalts[salt] = true;

        address signer = ECDSA.recover(digest, _signature);
        if (!isSigner[signer]) revert InvalidSigner();

        if (stakes[userId][intervalId][stakeId].isActive) revert StakeAlreadyExists();

        stakes[userId][intervalId][stakeId] = Stake({
            amount: amount,
            startTime: block.timestamp,
            endTime: endTime,
            staker: msg.sender,
            claimedAmount: 0,
            claimedUntilMonth: 0,
            claimAddress: msg.sender,
            isClaimed: false,
            isActive: true
        });

        stakingToken.safeTransferFrom(
            msg.sender,
            feeCollector,
            feeTokens
        );

        stakingToken.safeTransferFrom(
            msg.sender,
            address(this),
            amount
        );

        emit Staked(
            msg.sender,
            msg.sender,
            userId,
            stakeId,
            intervalId,
            amount
        );
    }
    
    /**
     * @notice Allows a user to claim their staking rewards for a specific stake via destinationAddress.
     * @dev Verifies backend-generated EIP712 signature to ensure authorized claims.
     *      Uses salts and nonces to prevent replay attacks.
     *      Enforces a minimum 3-month gap between claims.
     *      Transfers preclaim rewards in `rewardToken` and returns principal if the stake is fully claimed.
     * @param _encodedData ABI-encoded data containing:
     *        - stakeId: unique identifier of the stake
     *        - intervalId: staking interval in months (e.g., 12 for 12 months)
     *        - rewards: amount of reward tokens to claim
     *        - claimedMonth: the month up to which the reward is being claimed
     *        - expiry: signature expiry timestamp
     *        - userId: unique user identifier
     *        - salt: unique salt to prevent replay attacks
     *        - nonce: unique nonce for additional replay protection
     * @param _signature Backend-generated EIP712 signature authorizing the claim.
     * @notice Emits a {Claimed} event after successful reward claim.
     */
    function claim(
        bytes calldata _encodedData,
        bytes memory _signature
    ) external nonReentrant whenNotPaused {
        (
            uint256 stakeId,
            uint256 intervalId,
            uint256 rewards,  
            uint256 claimedMonth,
            uint256 expiry,
            bytes32 userId,
            bytes32 salt,
            bytes32 nonce
        ) = abi.decode(
                _encodedData,
                (uint256, uint256, uint256, uint256, uint256, bytes32, bytes32, bytes32)
            ); //should there be addresses sent from backnemd at the time of claim

        if (rewards == 0 || expiry == 0 || claimedMonth == 0) revert InvalidInput();
        if (usedSalts[salt]) revert SaltAlreadyUsed();
        if (usedNonces[userId][stakeId][nonce]) revert NonceAlreadyUsed();

        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    CLAIM_TYPEHASH,
                    msg.sender,
                    stakeId,
                    intervalId,
                    rewards,
                    claimedMonth,
                    expiry,
                    salt,
                    userId,
                    nonce
                )
            )
        );

        usedSalts[salt] = true;
        usedNonces[userId][stakeId][nonce] = true;

        address signer = ECDSA.recover(digest, _signature);
        if (!isSigner[signer]) revert InvalidSigner();
        if (expiry < block.timestamp) revert SignatureExpired();

        Stake storage userStake = stakes[userId][intervalId][stakeId];

        if (userStake.claimAddress != msg.sender) revert InvalidClaimAddress();
        if (userStake.isClaimed) revert AlreadyClaimed();
        if (!userStake.isActive) revert StakeNotFound();
        if (userStake.claimedUntilMonth + 3 >= claimedMonth) revert PreclaimNotMatured();

        userStake.claimedUntilMonth = claimedMonth;
        userStake.claimedAmount += rewards;

        rewardToken.safeTransfer(msg.sender, rewards);

        if (claimedMonth >= intervalId && block.timestamp >= userStake.endTime) {
            userStake.isClaimed = true; 
            userStake.isActive = false;

            stakingToken.safeTransfer(userStake.staker, userStake.amount);
        }

        emit Claimed(
            msg.sender,
            userId,
            stakeId,
            intervalId,
            claimedMonth,
            rewards,
            userStake.amount
        );
    }

    /**
     * @notice Adds a backend signer. Only callable by the contract owner.
     * @param _signer Address of the signer to be added.
     */
    function addSigner(address _signer) external onlyOwner {
        if (_signer == address(0)) revert InvalidInput();

        isSigner[_signer] = true;
    }

    /**
     * @notice Removes a backend signer. Only callable by the contract owner.
     * @param _signer Address of the signer to be removed.
     */
    function removeSigner(address _signer) external onlyOwner {
        if (_signer == address(0)) revert InvalidInput();
        if (!isSigner[_signer]) revert InvalidInput();

        isSigner[_signer] = false;
    }

    /**
     * @notice Updates the address that collects staking fees.
     * @dev Only callable by the contract owner.
     *      Reverts if the provided address is the zero address.
     * @param _feeCollector The new address to receive staking fees.
     */
    function setFeeCollector(address _feeCollector) external onlyOwner {
        if (_feeCollector == address(0)) revert InvalidInput();
        feeCollector = _feeCollector;
    }
      
    /**
     * @notice Withdraws tokens from the contract in case of emergency.
     * @dev Only callable by the contract owner.
     * @param _wallet Address to receive the withdrawn tokens.
     * @param _amount Amount of tokens to withdraw.
     * @param _token Address of the token to withdraw.
     */
    function emergencyWithdraw(address _wallet, uint256 _amount, address _token) external onlyOwner {
        if(_wallet == address(0) || _amount == 0 || _token == address(0)) revert InvalidInput();
        if (IERC20(_token).balanceOf(address(this)) < _amount) revert InsufficientBalance();

        IERC20(_token).safeTransfer(_wallet, _amount);
        emit EmergencyWithdraw(_wallet, _token, _amount);
    }

    /**
     * @notice Pauses the contract, preventing certain functions from being executed.
     */
    function pauseStaking() external onlyOwner {
        _pause();
    }
    /**
     * @notice Unpauses the contract, allowing functions to be executed again.
     */
    function unpauseStaking() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Required function for UUPSUpgradeable to restrict upgraded to only owner.
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        require(newImplementation != address(0), "Invalid address");
    }
}
