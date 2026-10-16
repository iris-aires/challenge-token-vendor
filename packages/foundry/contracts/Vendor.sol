pragma solidity 0.8.20; // 固定编译器版本，保持与挑战测试一致。
// SPDX-License-Identifier: MIT

// Ownable 提供 owner()、onlyOwner 和 transferOwnership()，无需自行维护管理员权限。
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Lumen.sol";

/**
 * @title LUM 固定汇率售卖与回购合约
 * @notice 用户可以支付 ETH 购买 LUM，也可以授权本合约扣取 LUM 后换回 ETH。
 * @dev 当前汇率为 1 ETH = 1 LUM，代币初始库存由部署脚本转入。
 * ETH 使用 wei 计量；LUM 默认有 18 位小数，也使用最小单位计量。
 * 因此 1 ETH 和 1 LUM 在计算中都表示为 10**18，无需额外乘除 10**18。
 * 购买时 ETH 留在 Vendor；卖回时 Vendor 支出 ETH，因此回购需要足够的 ETH 储备。
 */
contract Vendor is Ownable {

    /// @notice 购买时没有支付 ETH。
    error InvalidEthAmount();
    /// @notice Vendor 的代币库存不足；参数依次为实际库存、本次所需数量，均为代币最小单位。
    error InsufficientVendorTokenBalance(uint256 vendorBalance,uint256 amount);
    /// @notice 代币 transfer 或 transferFrom 返回 false；记录代币接收地址和数量。
    error TransferTokenFailed(address recipient,uint256 amount);
    /// @notice ETH 发送失败；记录接收地址和发送金额，金额单位为 wei。
    error EthTransferFailed(address to, uint256 amount);

    /// @notice 卖回数量为 0，或卖回数量超过用户当前持有的代币余额。
    error InvalidTokenAmount();
    /// @notice Vendor 的 ETH 储备不足；参数依次为实际余额、应付金额，单位为 wei。
    error InsufficientVendorEthBalance(uint256 available, uint256 required);

    /// @notice 卖回完成后记录卖家、收回的代币数量和支付的 ETH 金额。
    /// @dev indexed 允许前端按卖家地址筛选日志；数量为代币最小单位，ETH 金额为 wei。
    event SellTokens(address indexed seller, uint256 amountOfTokens, uint256 amountOfETH);

    /// @notice 本 Vendor 买卖的 Lumen 代币合约。
    /// @dev immutable 表示只能在构造时赋值，部署后不能换成另一种代币。
    Lumen public immutable lumen;

    /// @notice 每 1 ETH 可以买到的 LUM 数量；当前 1 LUM 需要 1 ETH。
    /// @dev public 自动生成 tokensPerEth()，前端据此计算价格；constant 部署后不可修改。
    uint256 public constant tokensPerEth = 1;

    /// @notice 购买完成后记录买家、支付的 ETH 金额和发出的代币数量。
    /// @dev indexed 允许按买家筛选日志；ETH 金额为 wei，代币数量为最小单位。
    event BuyTokens(address indexed buyer, uint256 amountOfETH, uint256 amountOfTokens);

    /// @param tokenAddress 已部署的 Lumen 合约地址；这里只保存引用，不创建或铸造代币。
    /// @dev 创建 Vendor 的调用者先成为 owner；部署脚本可以随后转移管理权。
    constructor(address tokenAddress) Ownable(msg.sender) {
        lumen = Lumen(tokenAddress);
    }

    /**
     * @notice 支付 ETH 购买 LUM，代币直接转入本次调用者的钱包。
     * @dev payable 允许接收 ETH。msg.sender 是买家，msg.value 是本次支付的 wei 数量。
     * 调用过程中发生 revert 时，本次 ETH 支付和代币转账都会回滚，交易消耗的 Gas 不会退还。
     */
    function buyTokens() external payable {
        // 不接受零金额购买。
        if(msg.value ==0){
            revert InvalidEthAmount();
        }

        // ETH 与 LUM 都有 18 位精度：支付 1 ether，在当前汇率下可得到 10**18 个代币最小单位。
        uint256 tokenAmount = msg.value * tokensPerEth;
        // address(this) 是 Vendor 自身；购买需要检查卖方库存，而不是买家已有多少代币。
        uint256 vendorBalance = lumen.balanceOf(address(this));
        if  (vendorBalance < tokenAmount){
            revert InsufficientVendorTokenBalance(vendorBalance,tokenAmount);
        }
        // Vendor 转出自己持有的代币，使用 transfer，不需要买家授权。
        // OpenZeppelin ERC20 遇到转账错误会 revert，正常完成时返回 true。
        bool success =lumen.transfer(msg.sender,tokenAmount);
        if(!success){
            revert TransferTokenFailed(msg.sender,tokenAmount);
        }
        // 操作成功后写入链上日志，供前端事件列表读取。
         emit BuyTokens(msg.sender, msg.value, tokenAmount);
    }

    /**
     * @notice 管理员提走 Vendor 当前持有的全部 ETH，LUM 库存不受影响。
     * @dev onlyOwner 拒绝非管理员调用。owner() 返回当前管理员，不一定是最初的部署者。
     * 提现后 ETH 储备减少，可能导致后续卖回因余额不足而失败。
     */
    function withdraw() public onlyOwner {
        // 原生 ETH 余额通过 address.balance 查询，和 lumen.balanceOf() 查询的代币余额不同。
        uint256 balance = address(this).balance;
        // payable 将地址转换为可接收 ETH 的类型；value 指定发送金额，空字符串表示不附带调用数据。
        // call 返回 (是否成功, 返回数据)，这里只保留布尔值，忽略第二个返回值。
        (bool success,) =payable(owner()).call{value:balance}("");
        if(!success){
            revert EthTransferFailed(owner(),balance);
        }
    }

    /**
     * @notice 将 LUM 卖回 Vendor，并按固定汇率接收 ETH。
     * @param amount 卖回的代币最小单位数量；例如卖回 1 LUM，应传入 10**18。
     * @dev 用户需要先在 Lumen 上调用 approve(Vendor地址, amount)，允许 Vendor 扣取代币。
     * 执行顺序：校验数量及储备 → 扣取代币 → 支付 ETH → 发出事件。
     */
    function sellTokens(uint256 amount) public {
        // 拒绝零数量卖回。
        if(amount ==0){
            revert InvalidTokenAmount();

        }

        // 此时 msg.sender 是卖家，检查他是否持有足够的 LUM。
        if(amount>lumen.balanceOf(msg.sender)){
            revert InvalidTokenAmount();
        }

        // requireAmount 为应付 ETH，remainAmount 为 Vendor 当前 ETH 储备，单位均为 wei。
        // Solidity 整数除法舍弃余数；当前兑换比例为 1，因此这里没有除法精度损失。
        uint256 requireAmount= amount / tokensPerEth;
        uint256 remainAmount =address(this).balance;
        if( remainAmount< requireAmount ){
            revert InsufficientVendorEthBalance(remainAmount,requireAmount);
        }

        // Vendor 调用代币合约，从卖家钱包扣币并存入 Vendor，所以使用 transferFrom。
        // Lumen 会检查用户余额及用户给 Vendor 的 allowance；授权不足时自动 revert。
        bool success= lumen.transferFrom(msg.sender,address(this),amount);

        if(!success){
            revert TransferTokenFailed(address(this),amount);
        }

        // 扣币成功后向卖家支付 ETH。res 是本次 ETH 调用结果，与上面的代币转账 success 不同。
        // call 可能执行接收方合约的接收逻辑；本合约目前没有添加重入保护。
        (bool res,)= payable(msg.sender).call{value:requireAmount}("");
        if(!res){
            // revert 撤销整笔卖回交易，包含刚才的扣币及授权额度变化，避免用户交币后收不到 ETH。
            revert EthTransferFailed(msg.sender,requireAmount);
        }

        // 只有扣币和 ETH 支付都成功，才记录卖回事件。
        emit SellTokens(msg.sender, amount, requireAmount);
    }
}
