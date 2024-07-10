import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ReceiverModule = buildModule("receiver", (m) => {
  const usdc = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d";
  const arbitrumRouter = "0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165";
  const receiver = m.contract("Receiver", [arbitrumRouter, usdc]);

  return { receiver };
});

export default ReceiverModule;
