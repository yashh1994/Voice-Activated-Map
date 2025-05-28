import React, { useState } from "react";
import { OrbiterClient, ENDPOINT, RouterType } from "@orbiter-finance/bridge-sdk";
import { Account, Provider } from "starknet";
import { JsonRpcProvider, Wallet } from "ethers";

const Orbitor = () => {
  const [status, setStatus] = useState("Idle");
  const [error, setError] = useState(null);

  const handleSwap = async () => {

    const orbiter = await OrbiterClient.create({
        apiEndpoint: ENDPOINT.TESTNET, // Use MAINNET endpoint for production
      });
  
      // Fetch available chains
    //   const chains = orbiter.getAllChains();
  
    //   // Choose a chain from the list to get available tokens
    //   const chain = { id: "421614", name: "Arbitrum" };
    //   const tokens = orbiter.getAvailableTokens(chain.id);
  
    //   console.log("Available Tokens:", tokens);
  
      // Define the TradePair for Ethereum to StarkNet
      const tradePair = {
        srcChainId: "11155111", // Ethereum Testnet Chain ID
        dstChainId: "SN_SEPOLIA",   // Arbitrum Testnet Chain ID
        srcTokenSymbol: "ETH",  // Token on Ethereum
        dstTokenSymbol: "ETH",  // Token on Arbitrum
        routerType: RouterType.CONTRACT, // Use CONTRACT route
      };
  
      // Create the Router
      const router = orbiter.createRouter(tradePair);
  
    //   const minSendAmount = await router.getMinSendAmount();
    //   console.log("Minimum Send Amount:", ethers.utils.formatEther(minSendAmount));
  
      // Define sending parameters
      const sendValue = ethers.utils.parseEther("0.000005"); // Convert ETH amount to Wei
  
      //! Connect to Metamask
      if (!window.ethereum) {
        throw new Error("Metamask is not installed. Please install Metamask to proceed.");
      }
  
      // Request account access
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const userAddress = accounts[0];
      console.log("Connected Metamask Account:", userAddress);
  
      // Create Ethereum provider and signer from Metamask
      const ethereumProvider = new ethers.providers.Web3Provider(window.ethereum);
      const ethereumSigner = ethereumProvider.getSigner();
  
      //! StarkNet account (replace with actual account setup)
      const starknetProvider = new Provider({ sequencer: { network: "starknet-sepolia" } });
      const starknetAccountAddress = "0x076a6a6A1E654e2D47246957Aa8fab832beA84bE648A9BB34131172C7dE6BD71"; // Replace with your StarkNet account
      const starknetAccount = new Account(starknetProvider, starknetAccountAddress);
  
      // Approve transaction (on Ethereum)
      const approveCall = await router.createApprove(userAddress, sendValue);
      console.log("Approval Call:", approveCall);
  
      // Request user approval via Metamask
      const approveResponse = await ethereumSigner.sendTransaction(approveCall);
      console.log("Waiting for Approval to be confirmed by user...");
  
      // Wait for the approval transaction to be mined
      const approvalConfirmation = await approveResponse.wait();
      console.log("Approve Transaction Response:", approvalConfirmation);
  
      // Ensure that the approval was successful
      if (approvalConfirmation.status === 1) {
        console.log("Approval successful! Proceeding with the Bridge Transaction...");
  
        // Bridge transaction (from Ethereum to StarkNet)
        const transactionCall = await router.createTransaction(
          userAddress,
          starknetAccount.address,
          sendValue
        );
        console.log("Bridge Transaction Call:", transactionCall);
  
        // Request user confirmation for the transaction via Metamask
        const transactionResponse = await ethereumSigner.sendTransaction(transactionCall);
        console.log("Waiting for Bridge Transaction to be confirmed by user...");
  
        // Wait for the transaction to be mined
        const transactionConfirmation = await transactionResponse.wait();
        console.log("Bridge Transaction Response:", transactionConfirmation);
  
        // Handle transaction receipt and confirmation
        if (transactionConfirmation.status === 1) {
          console.log("Swap/Bridge transaction successful!");
          console.log("Transaction Receipt:", transactionConfirmation);
        } else {
          console.error("Transaction failed, please check the details.");
        }
      } else {
        console.error("Approval failed. The transaction was not approved.");
      }

  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-6">Ethereum to StarkNet Bridge</h1>
      <button
        onClick={handleSwap}
        className="px-6 py-3 text-white bg-blue-500 hover:bg-blue-600 rounded-lg shadow-md transition"
      >
        Swap Tokens
      </button>
      <div className="mt-4 text-center">
        <p className="text-lg font-medium">Status: {status}</p>
        {error && <p className="text-red-500 mt-2">Error: {error}</p>}
      </div>
    </div>
  );
};

export default Orbitor;
