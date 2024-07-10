// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {OwnerIsCreator} from "@chainlink/contracts-ccip/src/v0.8/shared/access/OwnerIsCreator.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {IERC20} from "@chainlink/contracts-ccip/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@chainlink/contracts-ccip/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/utils/SafeERC20.sol";

interface IUSDC {
    function transfer(address to, uint256 value) external returns (bool);
}

/// @title - A simple messenger contract for transferring USDC tokens to a user.
contract Sender is OwnerIsCreator {
    using SafeERC20 for IERC20;

    // Custom errors to provide more descriptive revert messages.
    error InvalidRouter(); // Used when the router address is 0
    error InvalidLinkToken(); // Used when the link token address is 0
    error InvalidUsdcToken(); // Used when the usdc token address is 0
    error NotEnoughBalance(uint256 currentBalance, uint256 calculatedFees); // Used to make sure contract has enough balance to cover the fees.
    error NotEnoughUSDCBalance(uint256 currentBalance, uint256 calculatedFees); // Used to make sure contract has enough balance to cover the fees.
    error NothingToWithdraw(); // Used when trying to withdraw Ether but there's nothing to withdraw.
    error InvalidDestinationChain(); // Used when the destination chain selector is 0.
    error InvalidReceiverAddress(); // Used when the receiver address is 0.
    error NoReceiverOnDestinationChain(uint64 destinationChainSelector); // Used when the receiver address is 0 for a given destination chain.
    error AmountIsZero(); // Used if the amount to transfer is 0.
    error InvalidGasLimit(); // Used if the gas limit is 0.
    error NoGasLimitOnDestinationChain(uint64 destinationChainSelector); // Used when the gas limit is 0.

    // Event emitted when a message is sent to another chain.
    event MessageSent(
        bytes32 indexed messageId, // The unique ID of the CCIP message.
        uint64 indexed destinationChainSelector, // The chain selector of the destination chain.
        address indexed beneficiary, // The beneficiary of the staked tokens on the destination chain.
        address token, // The token address that was transferred.
        uint256 tokenAmount, // The token amount that was transferred.
        address feeToken, // the token address used to pay CCIP fees.
        uint256 fees // The fees paid for sending the message.
    );

    IRouterClient private immutable i_router;
    IERC20 private immutable i_linkToken;
    IERC20 private immutable i_usdcToken;

    // Mapping to store the gas limit per destination chain.
    mapping(uint64 => uint256) public s_gasLimits;

    modifier validateDestinationChain(uint64 _destinationChainSelector) {
        if (_destinationChainSelector == 0) revert InvalidDestinationChain();
        _;
    }

    /// @notice Constructor initializes the contract with the router address.
    /// @param _router The address of the router contract.
    /// @param _link The address of the link contract.
    /// @param _usdcToken The address of the usdc contract.

    constructor(address _router, address _usdcToken, address _link) {
        if (_router == address(0)) revert InvalidRouter();
        if (_usdcToken == address(0)) revert InvalidUsdcToken();
        i_router = IRouterClient(_router);
        i_linkToken = IERC20(_link);
        i_usdcToken = IERC20(_usdcToken);
    }

    /// @dev Set the gas limit for a given destination chain.
    /// @notice This function can only be called by the owner.
    /// @param _destinationChainSelector The selector of the destination chain.
    /// @param _gasLimit The gas limit on the destination chain .
    function setGasLimitForDestinationChain(
        uint64 _destinationChainSelector,
        uint256 _gasLimit
    ) external onlyOwner validateDestinationChain(_destinationChainSelector) {
        if (_gasLimit == 0) revert InvalidGasLimit();
        s_gasLimits[_destinationChainSelector] = _gasLimit;
    }

    /// @notice Sends data and transfer tokens to receiver on the destination chain.
    /// @notice Pay for fees in LINK.
    /// @dev Assumes your contract has sufficient LINK to pay for CCIP fees.
    /// @param _destinationChainSelector The identifier (aka selector) for the destination blockchain.
    /// @param _beneficiary The address of the beneficiary of the staked tokens on the destination blockchain.
    /// @param _amount token amount.
    /// @return messageId The ID of the CCIP message that was sent.
    function sendMessagePayETH(
        uint64 _destinationChainSelector,
        address _beneficiary,
        uint256 _amount
    )
        external
        onlyOwner
        validateDestinationChain(_destinationChainSelector)
        returns (bytes32 messageId)
    {
        if (_beneficiary == address(0))
            revert NoReceiverOnDestinationChain(_destinationChainSelector);
        if (_amount == 0) revert AmountIsZero();
        // Create an EVM2AnyMessage struct in memory with necessary information for sending a cross-chain message
        // address(linkToken) means fees are paid in LINK
        Client.EVMTokenAmount[]
            memory tokenAmounts = new Client.EVMTokenAmount[](1);
        tokenAmounts[0] = Client.EVMTokenAmount({
            token: address(i_usdcToken),
            amount: _amount
        });
        // Create an EVM2AnyMessage struct in memory with necessary information for sending a cross-chain message
        Client.EVM2AnyMessage memory evm2AnyMessage = Client.EVM2AnyMessage({
            receiver: abi.encode(_beneficiary), // ABI-encoded receiver address
            data: abi.encodeWithSelector(
                IUSDC.transfer.selector,
                _beneficiary,
                _amount
            ), // Encode the function selector and the arguments of the stake function
            tokenAmounts: tokenAmounts, // The amount and type of token being transferred
            extraArgs: Client._argsToBytes(
                // Additional arguments, setting gas limit
                Client.EVMExtraArgsV1({gasLimit: 200_000})
            ),
            // Set the feeToken to a feeTokenAddress, indicating specific asset will be used for fees
            feeToken: address(0)
        });

        // Get the fee required to send the CCIP message
        uint256 fees = i_router.getFee(
            _destinationChainSelector,
            evm2AnyMessage
        );

        // if (fees > i_linkToken.balanceOf(address(this)))
        //     revert NotEnoughBalance(i_linkToken.balanceOf(address(this)), fees);
        if (fees > address(this).balance)
            revert NotEnoughBalance(address(this).balance, fees);
        // approve the Router to transfer LINK tokens on contract's behalf. It will spend the fees in LINK
        // i_linkToken.approve(address(i_router), fees);

        // approve the Router to spend usdc tokens on contract's behalf. It will spend the amount of the given token
        i_usdcToken.approve(address(i_router), _amount);

        // Send the message through the router and store the returned message ID
        messageId = i_router.ccipSend{value: fees}(
            _destinationChainSelector,
            evm2AnyMessage
        );

        // Emit an event with message details
        emit MessageSent(
            messageId,
            _destinationChainSelector,
            _beneficiary,
            address(i_usdcToken),
            _amount,
            address(i_linkToken),
            fees
        );

        // Return the message ID
        return messageId;
    }

    function sendMessagePayLINK(
        uint64 _destinationChainSelector,
        address _beneficiary,
        uint256 _amount
    )
        external
        onlyOwner
        validateDestinationChain(_destinationChainSelector)
        returns (bytes32 messageId)
    {
        if (_beneficiary == address(0))
            revert NoReceiverOnDestinationChain(_destinationChainSelector);
        if (_amount == 0) revert AmountIsZero();
        // Create an EVM2AnyMessage struct in memory with necessary information for sending a cross-chain message
        // address(linkToken) means fees are paid in LINK
        Client.EVMTokenAmount[]
            memory tokenAmounts = new Client.EVMTokenAmount[](1);
        tokenAmounts[0] = Client.EVMTokenAmount({
            token: address(i_usdcToken),
            amount: _amount
        });
        // Create an EVM2AnyMessage struct in memory with necessary information for sending a cross-chain message
        Client.EVM2AnyMessage memory evm2AnyMessage = Client.EVM2AnyMessage({
            receiver: abi.encode(_beneficiary), // ABI-encoded receiver address
            data: "", // Encode the function selector and the arguments of the stake function
            tokenAmounts: tokenAmounts, // The amount and type of token being transferred
            extraArgs: Client._argsToBytes(
                // Additional arguments, setting gas limit
                Client.EVMExtraArgsV1({gasLimit: 0})
            ),
            // Set the feeToken to a feeTokenAddress, indicating specific asset will be used for fees
            feeToken: address(i_linkToken)
        });

        // Get the fee required to send the CCIP message
        uint256 fees = i_router.getFee(
            _destinationChainSelector,
            evm2AnyMessage
        );

        if (fees > i_linkToken.balanceOf(address(this)))
            revert NotEnoughBalance(i_linkToken.balanceOf(address(this)), fees);

        // approve the Router to transfer LINK tokens on contract's behalf. It will spend the fees in LINK
        i_linkToken.approve(address(i_router), fees);

        if (_amount > i_usdcToken.balanceOf(msg.sender))
            revert NotEnoughUSDCBalance(
                i_usdcToken.balanceOf(msg.sender),
                _amount
            );

        // approve the Router to spend usdc tokens on contract's behalf. It will spend the amount of the given token
        i_usdcToken.approve(address(i_router), _amount);
        i_usdcToken.safeTransferFrom(msg.sender, address(this), _amount);
        // Send the message through the router and store the returned message ID
        messageId = i_router.ccipSend(
            _destinationChainSelector,
            evm2AnyMessage
        );

        // Emit an event with message details
        emit MessageSent(
            messageId,
            _destinationChainSelector,
            _beneficiary,
            address(i_usdcToken),
            _amount,
            address(i_linkToken),
            fees
        );

        // Return the message ID
        return messageId;
    }

    /// @notice Allows the owner of the contract to withdraw all LINK tokens in the contract and transfer them to a beneficiary.
    /// @dev This function reverts with a 'NothingToWithdraw' error if there are no tokens to withdraw.
    /// @param _beneficiary The address to which the tokens will be sent.
    function withdrawLinkToken(address _beneficiary) public onlyOwner {
        // Retrieve the balance of this contract
        uint256 amount = i_linkToken.balanceOf(address(this));

        // Revert if there is nothing to withdraw
        if (amount == 0) revert NothingToWithdraw();

        i_linkToken.safeTransfer(_beneficiary, amount);
    }

    /// @notice Allows the owner of the contract to withdraw all usdc tokens in the contract and transfer them to a beneficiary.
    /// @dev This function reverts with a 'NothingToWithdraw' error if there are no tokens to withdraw.
    /// @param _beneficiary The address to which the tokens will be sent.
    function withdrawUsdcToken(address _beneficiary) public onlyOwner {
        // Retrieve the balance of this contract
        uint256 amount = i_usdcToken.balanceOf(address(this));

        // Revert if there is nothing to withdraw
        if (amount == 0) revert NothingToWithdraw();

        i_usdcToken.safeTransfer(_beneficiary, amount);
    }
}
