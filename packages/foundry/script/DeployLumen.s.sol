//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../contracts/Lumen.sol";
import "../contracts/Vendor.sol";
import "./DeployHelpers.s.sol";

contract DeployLumen is ScaffoldETHDeploy {
    /**
     * Student TODO:
     * - Put the address you're using in the frontend here (leave address(0) to default to the deployer)
     */
    address constant FRONTEND_ADDRESS = 0x49162053DDE83F81b7b42e7b5ad59370F1d63420;

    /**
     * Mode switch:
     * - If true: deploy Vendor and seed it with the token balance
     * - If false: send tokens to your frontend address (or deployer if unset)
     */
    bool constant SEND_TOKENS_TO_VENDOR = true; // Checkpoint 2: seed the vendor with tokens.

    function run() external ScaffoldEthDeployerRunner {
        Lumen lumen = new Lumen();
        console.logString(string.concat("Lumen deployed at: ", vm.toString(address(lumen))));

        address recipient = FRONTEND_ADDRESS != address(0) ? FRONTEND_ADDRESS : msg.sender;

        if (!SEND_TOKENS_TO_VENDOR) {
            // Send the entire initial supply to the wallet you use in the UI.
            // If FRONTEND_ADDRESS is address(0), this defaults to the deployer (no-op transfer).
            if (recipient != msg.sender) {
                lumen.transfer(recipient, 1000 ether);
            }
            return;
        }

        // Deploy Vendor and seed it with tokens
        Vendor vendor = new Vendor(address(lumen));
        console.logString(string.concat("Vendor deployed at: ", vm.toString(address(vendor))));

        lumen.transfer(address(vendor), 1000 ether);

        // Make the UI wallet the owner (for withdraw(), etc). Defaults to deployer if unset.
        vendor.transferOwnership(recipient);
    }
}
