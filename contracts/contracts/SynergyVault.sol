// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ISynthetixRouter} from "./synthetix/interfaces/ISynthethixRouter.sol";
import {Owned} from "./Owned.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";

/// @title Synergy
/// @author jefedcreator

contract Vault is ERC4626, Owned(msg.sender) {
    /// @notice name of the Synergy vault share token
    string public constant NAME = "SYNERGY";

    /// @notice symbol of the Synergy vault share token
    string public constant SYMBOL = "sTOKEN";

    ISynthetixRouter public synthethix;

    /// @notice emitted when shares is received and token is transfered
    /// @param vault address of the vault
    /// @param investor address of the caller
    /// @param investment amount of capital deployed to the vault
    event Invested(
        address indexed vault,
        address indexed investor,
        uint256 investment
    );

    /// @notice emitted when shares are sold and token is received
    /// @param vault address of the vault
    /// @param investor address of the caller
    /// @param divestment amount of capital received from the vault
    event Divested(
        address indexed vault,
        address indexed investor,
        uint256 divestment
    );

    /// @notice initializes Vault with given underlying asset, USDC
    /// @param _underlying address of the underlying asset,USDC

    constructor(
        address _underlying
    ) ERC4626(ERC20(_underlying)) ERC20(NAME, SYMBOL) {}

    /// @notice invest in synthetix with deposited capital
    /// @dev redeems caller's shares and deploys capital to synthetix
    /// @dev throws if sythethix address is not registered
    function invest() external {
        if (address(synthethix) == address(0))
            revert("Sythethix address is null");

        uint256 investment = previewRedeem(maxRedeem(msg.sender));

        redeem(investment, address(this), msg.sender);

        address asset = asset();

        ERC20(asset).approve(address(synthethix), investment);

        ISynthetixRouter(synthethix).invest({
            _for: msg.sender,
            _with: investment
        });

        emit Invested(address(this), msg.sender, investment);
    }

    /// @notice receive invested capital with profit from synthetix
    /// @dev unwinds caller's capital from synthetix
    /// @dev throws if sythethix address is not registered
    function divest() external {
        if (address(synthethix) == address(0))
            revert("Sythethix adrress is null");
        uint256 divestment = ISynthetixRouter(synthethix).divest(msg.sender);
        emit Divested(address(this), msg.sender, divestment);
    }

    /// @notice register synthetix address to vault
    function regiterSythethix(address _sythethix) external {
        synthethix = ISynthetixRouter(_sythethix);
    }
}
