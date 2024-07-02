# synergy
[![Synergy Demo](https://img.youtube.com/vi/hVdLKZ3MHjo/0.jpg)](https://youtu.be/hVdLKZ3MHjo)
## 🌞 Base onchain summer

This project was built during the [Base onchain summer hackathon](https://www.base.org/onchainsummer).

### 💰 Tracks

synergy is applicable to the following tracks:

- **Coinbase Account Abstraction prize**: we developed a native wallet that leverages AA (ERC-4337) to simplify the experience of sending, receiving and borrowing USDC tokens;
- **Sythethix Trading Prize**: for allowing users to trade USDC tokens seamlessly by using their email address or Google account.
- **Aerodrome Trading Prize**: for allowing users to swap and invest USDC tokens seamlessly by using their email address or Google account.


## ⚒️ synergy features

synergy is a USDC native wallet; this means that everything is built around USDC tokens: transfers, deposits, withdrawals, borrows. It allows users to create a new Smart Wallet by using their email address or Google account. Once the account is created, a custom Smart Account contract is created in order to automatically swap between received DAI or USDT tokens into USDC.

All the transactions are made leveraging the ERC-4337 Account Abstraction standard using the Thirdweb paymaster

Every time a user receives USDT, USDC or DAI, the remainder rounded to nearest dollar (eg. you receive $1.30, $0.30 will be set aside) is sent to:

- **AAVE Lending Contracts** in the case of **USDT** or **DAI**. The rest (eg. $1) is automatically swapped to USDC (on Sepolia using a Mock Aerodrome Router) and sent to the user's Smart Account. Here these tokens maybe used by the user in the future to borrow some USDT, or they can leave them there to accrue some interest;
- **USDC Vault** in the case of USDC. The rest (eg. $1) is sent to the user's Smart Account. The tokens inside the USDC Vault are then used as liquidity provider into a USDC/USDT Aerodrome pool.

In addition to this, when a synergy user wants to send USDC tokens to another user and the sender doesn't have enough USDC tokens in their Smart Account, the app **will automatically borrow** the required amount from the AAVE Lending Contracts to match the amount and send it to the recipient.

## :link: synergy contract addresses:

- **Account Factory**: [0x543F0BB75a4B76B7fF8253A283D1137A7E354fe3](https://sepolia.etherscan.io/address/0x543F0BB75a4B76B7fF8253A283D1137A7E354fe3)
- **Ghost Vault**: [0x6801402aE64a287d172f5c79b5b1e14505019494](https://sepolia.etherscan.io/address/0x6801402aE64a287d172f5c79b5b1e14505019494)
- **Mocked Router** [0x49b86914d97Db46FF0F771F7bea4f0B28501605b](https://sepolia.etherscan.io/address/0x49b86914d97Db46FF0F771F7bea4f0B28501605b)
- **Mocked Supply Router**: [0xC847fe71906748A56cA211D0189d8b7798A60cDD](https://sepolia.etherscan.io/address/0xC847fe71906748A56cA211D0189d8b7798A60cDD)
- **Ghost Portal Mumbai**: [0x3674a4fbedd210fe6c82def29b8b3f9fd6324c49](https://sepolia.etherscan.io/address/0x3674a4fbedd210fe6c82def29b8b3f9fd6324c49)
- **Mock DAI BaseSepolia**: [0x693F54323e8bb9A0B1110a51ea5DcCdB891904e1](https://sepolia.etherscan.io/address/0x693F54323e8bb9A0B1110a51ea5DcCdB891904e1)
- **Mock USDT BaseSepolia**: [0x2e87bba7ab20Ee5cE79552a2454e4406d1479250](https://sepolia.etherscan.io/address/0x2e87bba7ab20Ee5cE79552a2454e4406d1479250)
- **Mock Aerodrome poolfactory BaseSepolia**: [0xf0228B35a1a69Ce079346804b81E44BD5e738A81](https://sepolia.etherscan.io/address/0xf0228B35a1a69Ce079346804b81E44BD5e738A81)
- **Mock Aerodrome gaugeFactory BaseSepolia**: [0x0E8FcF60fd14404CF6551F5716e360878A01F4db](https://sepolia.etherscan.io/address/0x0E8FcF60fd14404CF6551F5716e360878A01F4db)
- **Mock Aerodrome managedRewardsFactory BaseSepolia**: [0x2C3eE9e823006CFdfd3a08A30b0285d643485060](https://sepolia.etherscan.io/address/0x2C3eE9e823006CFdfd3a08A30b0285d643485060)
- **Mock Aerodrome votingRewardsFactory BaseSepolia**: [0x39c0fD27E2AB0282c161eC87cE58f7016c67D31D](https://sepolia.etherscan.io/address/0x39c0fD27E2AB0282c161eC87cE58f7016c67D31D)
- **Mock Aerodrome factoryRegistry BaseSepolia**: [0xcb83CB8a6FD1Ab1a02668f69DDE8A0Cecd01caaC](https://sepolia.etherscan.io/address/0xcb83CB8a6FD1Ab1a02668f69DDE8A0Cecd01caaC)
- **Mock Aerodrome router BaseSepolia**: [0x50b574348a2533Bd53c2Eb356f07B8bC57c150B6](https://sepolia.etherscan.io/address/0x50b574348a2533Bd53c2Eb356f07B8bC57c150B6)

## 💻 Tech Stack

synergy contracts is built using Aerodrome contracts, Synthetix,Openzeppelin, Chainlink Automation, Chainlink CCIP and Thirdweb Abstracted Account factory. with react native for the mobile app

## 📱 App features

synergy wallet allows users to:

- [x] Create a Smart Wallet using their email address or Google account that can be exported to any Ethereum wallet via the private key;
- [x] Seamlessly transfer USDC tokens to other users using their synergy username;
- [x] View their total **Pocket** balance (USDC Vault Balance + AAVE Lending Balance);
- [x] Deposit or withdraw USDC tokens from the USDC Vault;
- [x] Borrow or repay USDC tokens from the AAVE Protocol.

### 📦 Run locally
In order to run the app locally, you need to execute the following steps:

```bash
# Install dependencies
npx expo install
```

Once the dependencies are installed, you **must** install the Expo modules and prebuild the app:

```bash
# Install Expo modules
npx install-expo-modules@latest
# Prebuild the app
npx expo prebuild
```

We need to prebuild the app because the Thirdweb SDK uses the Coinbase Wallet SDK that needs the app to be prebuilt in order to work.

Once the app is prebuilt, you can run it locally:

```bash
# iOS
yarn ios
# Android
yarn android
```
