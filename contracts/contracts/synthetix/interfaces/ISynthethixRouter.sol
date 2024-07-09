// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ISynthetixRouter {
    /// @notice Provide tokens to contract for investment
    /// @dev tokens provided capitalize yield bearing position
    /// @dev Throws if the vault is not the caller
    /// @param _for user whom sythetix associates the resulting position
    /// @param _with amount of tokens to provide for investment
    function invest(address _for, uint256 _with) external;

   /// @notice Conclude investment and withdraw from synthetix
    /// @dev Throws if the vault is not the caller
    /// @param _for user whom the account is associated with by synthetix
    /// @return divested amount
    function divest(address _for) external  returns (uint256 divested);
}
