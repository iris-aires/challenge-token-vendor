// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Test } from "forge-std/Test.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IVendor } from "../contracts/IVendor.sol";
import { Lumen } from "../contracts/Lumen.sol";
import { Vendor } from "../contracts/Vendor.sol";

contract VendorTest is Test {
    event BuyTokens(address indexed buyer, uint256 amountOfETH, uint256 amountOfTokens);
    event SellTokens(address indexed seller, uint256 amountOfTokens, uint256 amountOfETH);

    IERC20 public lumen;
    IVendor public vendor;
    address public deployer;
    address public user;

    uint256 constant TOKENS_PER_ETH = 1;
    uint256 constant INITIAL_SUPPLY = 1000 ether;

    function setUp() public {
        deployer = address(this);
        user = makeAddr("user");
        vm.deal(user, 100 ether);

        Lumen tokenImpl = new Lumen();
        lumen = IERC20(address(tokenImpl));
        vendor = IVendor(address(new Vendor(address(lumen))));

        // Seed vendor with tokens
        lumen.transfer(address(vendor), INITIAL_SUPPLY);
    }

    // ============================================================
    // Checkpoint 1: Lumen (ERC20 mint + transfer)
    // ============================================================

    function test_Checkpoint1_MintsExactly1000TokensToDeployer() public {
        // Deploy a fresh token to test initial state
        IERC20 freshToken = IERC20(address(new Lumen()));
        assertEq(freshToken.totalSupply(), INITIAL_SUPPLY);
        assertEq(freshToken.balanceOf(address(this)), INITIAL_SUPPLY);
    }

    function test_Checkpoint1_CanTransferTokensAndBalanceUpdates() public {
        IERC20 freshToken = IERC20(address(new Lumen()));
        uint256 amount = 10 ether;

        freshToken.transfer(user, amount);

        assertEq(freshToken.balanceOf(user), amount);
        assertEq(freshToken.balanceOf(address(this)), INITIAL_SUPPLY - amount);
    }

    // ============================================================
    // Checkpoint 2: Vendor buyTokens()
    // ============================================================

    function test_Checkpoint2_TokensPerEthIs1() public view {
        assertEq(vendor.tokensPerEth(), TOKENS_PER_ETH);
    }

    function test_Checkpoint2_BuyTokensRevertsOn0Eth() public {
        vm.prank(user);
        vm.expectRevert(IVendor.InvalidEthAmount.selector);
        vendor.buyTokens{ value: 0 }();
    }

    function test_Checkpoint2_CanBuy1TokenFor1Eth() public {
        uint256 ethToSpend = 1 ether;
        uint256 expectedTokens = 1 ether;

        uint256 startingBalance = lumen.balanceOf(user);

        vm.prank(user);
        vendor.buyTokens{ value: ethToSpend }();

        assertEq(lumen.balanceOf(user), startingBalance + expectedTokens);
    }

    function test_Checkpoint2_BuyTokensEmitsBuyTokensEvent() public {
        uint256 ethToSpend = 0.1 ether;
        uint256 expectedTokens = ethToSpend * TOKENS_PER_ETH;

        vm.expectEmit(true, false, false, true);
        emit BuyTokens(user, ethToSpend, expectedTokens);

        vm.prank(user);
        vendor.buyTokens{ value: ethToSpend }();
    }

    function test_Checkpoint2_RevertsIfVendorLacksTokens() public {
        // Deploy a vendor with no tokens
        IVendor emptyVendor = IVendor(address(new Vendor(address(lumen))));
        uint256 ethToSpend = 1 ether;
        uint256 requiredTokens = ethToSpend * TOKENS_PER_ETH;

        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(IVendor.InsufficientVendorTokenBalance.selector, 0, requiredTokens));
        emptyVendor.buyTokens{ value: ethToSpend }();
    }

    // ============================================================
    // Checkpoint 3: Ownable + withdraw()
    // ============================================================

    function test_Checkpoint3_DeployerIsOwner() public view {
        assertEq(vendor.owner(), deployer);
    }

    function test_Checkpoint3_NonOwnerCannotWithdraw() public {
        // Fund vendor with ETH
        vm.prank(user);
        vendor.buyTokens{ value: 0.1 ether }();

        vm.prank(user);
        vm.expectRevert();
        vendor.withdraw();
    }

    function test_Checkpoint3_OwnerWithdrawsAllEth() public {
        // Fund vendor with ETH via buy
        vm.prank(user);
        vendor.buyTokens{ value: 0.1 ether }();

        uint256 vendorEthBefore = address(vendor).balance;
        assertGt(vendorEthBefore, 0);

        uint256 ownerEthBefore = deployer.balance;

        vendor.withdraw();

        assertEq(address(vendor).balance, 0);
        assertEq(deployer.balance, ownerEthBefore + vendorEthBefore);
    }

    // ============================================================
    // Checkpoint 4: Vendor buyback (sellTokens + approve)
    // ============================================================

    function test_Checkpoint4_SellTokensRejectsZeroAmount() public {
        vm.prank(user);
        vm.expectRevert(IVendor.InvalidTokenAmount.selector);
        vendor.sellTokens(0);
    }

    function test_Checkpoint4_SellTokensRevertsIfVendorLacksEth() public {
        // Give user tokens directly
        IERC20 freshToken = IERC20(address(new Lumen()));
        IVendor noEthVendor = IVendor(address(new Vendor(address(freshToken))));
        freshToken.transfer(user, 10 ether);

        uint256 amountToSell = 10 ether;
        uint256 expectedEth = amountToSell / TOKENS_PER_ETH;

        vm.startPrank(user);
        freshToken.approve(address(noEthVendor), amountToSell);

        vm.expectRevert(abi.encodeWithSelector(IVendor.InsufficientVendorEthBalance.selector, 0, expectedEth));
        noEthVendor.sellTokens(amountToSell);
        vm.stopPrank();
    }

    function test_Checkpoint4_ApproveAndSellReturnsCorrectEth() public {
        // User buys tokens first
        vm.prank(user);
        vendor.buyTokens{ value: 10 ether }();

        uint256 amountToSell = 10 ether; // 10 tokens
        uint256 expectedEth = amountToSell / TOKENS_PER_ETH; // 10 ether

        vm.startPrank(user);
        lumen.approve(address(vendor), amountToSell);

        uint256 userEthBefore = user.balance;
        uint256 userTokensBefore = lumen.balanceOf(user);

        vendor.sellTokens(amountToSell);
        vm.stopPrank();

        assertEq(lumen.balanceOf(user), userTokensBefore - amountToSell);
        assertEq(user.balance, userEthBefore + expectedEth);
    }

    function test_Checkpoint4_SellTokensEmitsSellTokensEvent() public {
        // User buys tokens first
        vm.prank(user);
        vendor.buyTokens{ value: 10 ether }();

        uint256 amountToSell = 10 ether;
        uint256 expectedEth = amountToSell / TOKENS_PER_ETH;

        vm.startPrank(user);
        lumen.approve(address(vendor), amountToSell);

        vm.expectEmit(true, false, false, true);
        emit SellTokens(user, amountToSell, expectedEth);

        vendor.sellTokens(amountToSell);
        vm.stopPrank();
    }

    // Allow this contract to receive ETH (for withdraw)
    receive() external payable { }
}
