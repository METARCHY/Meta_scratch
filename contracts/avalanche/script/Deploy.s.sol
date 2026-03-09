// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MetarchyTokens.sol";
import "../src/MetarchyGame.sol";

/// @title Deploy — Deploys Metarchy contracts to Avalanche (C-Chain or Fuji testnet)
/// @dev Run: forge script script/Deploy.s.sol --rpc-url fuji --broadcast
contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy ERC-1155 token contract
        MetarchyTokens tokens = new MetarchyTokens();

        // 2. Deploy main game contract
        MetarchyGame game = new MetarchyGame(address(tokens));

        // 3. Authorize game contract to mint/burn tokens
        tokens.setGameContract(address(game));

        vm.stopBroadcast();

        // Log deployed addresses
        console.log("MetarchyTokens:", address(tokens));
        console.log("MetarchyGame:  ", address(game));
    }
}
