// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Vault} from "../SynergyVault.sol";
import {ISynthetix} from "./ISynthetix.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";

/// @title Synthetix
/// @author jefedcreator

contract Synthetix {
    /// @notice Synthetix sUSDC spot market id
    uint128 public constant sUSDC_MARKET_ID = 1;

    /// @notice Synthetix collateral leverage amount
    uint256 public constant LEVERAGE = 1 ether;

    /// @notice Synthetix core proxy
    ISynthetix public immutable SYNTHETIX_CORE;

    /// @notice Synthetix spot market proxy
    ISynthetix public immutable SYNTHETIX_SPOT_MARKET;

    /// @notice Synthetix preferred pool id
    uint128 public immutable PREFERRED_POOL_ID;

    /// @notice Synthetix sUSDC synth
    ERC20 public immutable sUSDC;

    /// @notice Synergy vault contract
    Vault public immutable VAULT;

    /// @notice USDC token contract
    /// @dev is the underlying Vault token;
    ERC20 public immutable USDC;

    /// @notice mapping of users to Synthetix accountId
    mapping(address users => uint128 synthetixAccountId) public sythetixId;

    /// @notice Constructs the Synthetix contract
    /// @param _core Synthetix core proxy address
    /// @param _spot Synthetix spot market proxy address
    constructor(address _core, address _spot, Vault _vault) {
        VAULT = Vault(_vault);
        USDC = ERC20(_vault.asset());
        VAULT.regiterSythethix(address(this));
        SYNTHETIX_CORE = ISynthetix(_core);
        SYNTHETIX_SPOT_MARKET = ISynthetix(_spot);
        sUSDC = ERC20(SYNTHETIX_SPOT_MARKET.getSynth(sUSDC_MARKET_ID));

        PREFERRED_POOL_ID = SYNTHETIX_CORE.getPreferredPool();

        USDC.approve(address(SYNTHETIX_CORE), type(uint256).max);
        USDC.approve(address(SYNTHETIX_SPOT_MARKET), type(uint256).max);
        USDC.approve(address(this), type(uint256).max);

        sUSDC.approve(address(SYNTHETIX_CORE), type(uint256).max);
        sUSDC.approve(address(SYNTHETIX_SPOT_MARKET), type(uint256).max);
    }

    /// @notice Provide tokens to contract for investment
    /// @dev tokens provided capitalize yield bearing position
    /// @dev Throws if the vault is not the caller
    /// @param _for user whom sythetix associates the resulting position
    /// @param _with amount of tokens to provide for investment
    function invest(address _for, uint256 _with) external {
        // transfer token to the contract from the vault
        USDC.transferFrom(address(VAULT), address(this), _with);

        /// @dev Synthetix expects 18 decimals of precision
        uint256 withD18 = _with * 10 ** (18 - USDC.decimals());

        // wrap the Bess for the Synthetix Core
        SYNTHETIX_SPOT_MARKET.wrap({
            marketId: sUSDC_MARKET_ID,
            wrapAmount: _with,
            minAmountReceived: 1
        });

        // establish Synthetix account for the beekeeper;
        // if none exists, create one and store it
        uint128 accountId = sythetixId[_for] == 0
            ? (sythetixId[_for] = SYNTHETIX_CORE.createAccount())
            : sythetixId[_for];
        console.log("accountId");
        console.logUint(accountId);
        console.log("sUSDC");
        console.logAddress(address(sUSDC));
        console.log("PREFERRED_POOL_ID");
        console.logUint(PREFERRED_POOL_ID);
        // transfer Bees to the Synthetix Core address as collateral
        SYNTHETIX_CORE.deposit({
            accountId: accountId,
            collateralType: address(sUSDC),
            tokenAmount: withD18
        });

        // delegate collateral to the preferred pool
        SYNTHETIX_CORE.delegateCollateral({
            accountId: accountId,
            poolId: PREFERRED_POOL_ID,
            collateralType: address(sUSDC),
            amount: withD18,
            leverage: LEVERAGE
        });
    }

    /// @notice Conclude investment and withdraw from synthetix
    /// @dev Throws if the vault is not the caller
    /// @param _for user whom the account is associated with by synthetix
    /// @return divested amount
    function divest(address _for) external returns (uint256 divested) {
        /// @dev account preserved (despite withdrawal);
        /// future investment won't require minting a new account
        uint128 accountId = sythetixId[_for];

        /// @dev specifying a new collateral amount of zero unwinds the position
        SYNTHETIX_CORE.delegateCollateral({
            accountId: accountId,
            poolId: PREFERRED_POOL_ID,
            collateralType: address(sUSDC),
            amount: 0,
            leverage: LEVERAGE
        });

        // determine unwound position's collateral amount
        uint256 availableCollateral = SYNTHETIX_CORE
            .getAccountAvailableCollateral({
                accountId: accountId,
                collateralType: address(sUSDC)
            });

        // withdraw unwound collateral
        SYNTHETIX_CORE.withdraw({
            accountId: accountId,
            collateralType: address(sUSDC),
            tokenAmount: availableCollateral
        });

        // adjust precision back to Bee's decimal representation
        divested = availableCollateral / 10 ** (18 - USDC.decimals());

        // unwrap the balance harvested from the Synthetix Core
        SYNTHETIX_SPOT_MARKET.unwrap({
            marketId: sUSDC_MARKET_ID,
            unwrapAmount: availableCollateral,
            minAmountReceived: divested
        });

        // realize the harvest by depositing it into the vault
        VAULT.deposit(divested, _for);
    }

    /// @notice collect any rewards accumulated
    /// @dev investemnt remains ongoing
    /// @custom:caution calling may result in Synthetix imposed timelocks
    /// @param _for user whom the account is associated with by synthetix
    /// @return rewards harvested
    function harvestSynthetixRewards(
        address _for
    ) external returns (uint256 rewards) {
        require(msg.sender == _for);

        uint128 accountId = sythetixId[_for];

        uint256[] memory claimableD18;
        address[] memory distributors;

        // retrieve claimable rewards and associated distributors
        (claimableD18, distributors) = SYNTHETIX_CORE.updateRewards({
            poolId: PREFERRED_POOL_ID,
            collateralType: address(USDC),
            accountId: accountId
        });

        // sanity check; should never fail under normal circumstances
        assert(claimableD18.length == distributors.length);

        // claim rewards from each distributor
        /// @dev rewards are automatically transferred to the Flower
        for (uint256 i = 0; i < claimableD18.length; i++) {
            rewards += SYNTHETIX_CORE.claimRewards({
                accountId: accountId,
                poolId: PREFERRED_POOL_ID,
                collateralType: address(USDC),
                distributor: distributors[i]
            });
        }

        /// @dev use contract balance to determine final amount of rewards
        rewards = USDC.balanceOf(address(this));

        // realize the harvested rewards by depositing it into the Hive
        VAULT.deposit(rewards, _for);
    }

    /// @notice contract must be ERC-721 compliant
    /// @dev Synthetix accounts are represented as ERC-721 tokens
    /// @return selector to confirm the token transfer
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure returns (bytes4 selector) {
        selector = this.onERC721Received.selector;
    }
}
