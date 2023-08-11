'use strict';
require("dotenv").config();
// const { testnetInfo } = require('@axelar-network/axelar-local-dev');
const  testnetInfo  = require('../info/testnet2.json');
const { ethers, Wallet } = require('ethers');

const chains =  testnetInfo;
console.log("chains:",chains);
const deployer_key = process.env.EVM_PRIVATE_KEY;
const address = new Wallet(deployer_key).address;
(async () => {
    const promises = []
    for(const chain of chains) {
        if (chain.name == 'Ethereum') continue
        const rpc = chain.rpc;
        const provider = ethers.getDefaultProvider(rpc);
        promises.push(provider.getBalance(address));
        console.log(chain.name);
    }
    await Promise.all(promises);
    for(const chain of chains) {
        if (chain.name == 'Ethereum') continue
        const balance = (await promises.shift())/1e18;
        console.log(`Account ${address} has ${balance} ${chain.tokenSymbol} on ${chain.name}.`);
    }
})();