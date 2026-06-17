// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ProjectToken.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title 众筹合约 (CrowdFund)
 * @dev 实现ETH众筹、动态铸造代币、早鸟奖励、冷静期退款
 */
contract CrowdFund is ReentrancyGuard {
    // ------ 项目基础信息 ------
    address public immutable owner;           // 项目发起人
    uint256 public immutable goal;            // 众筹目标 (单位: wei)
    uint256 public immutable deadline;        // 截止时间戳
    uint256 public constant EXCHANGE_RATE = 10000; // 1 ETH = 10000 代币

    // ------ 状态变量 ------
    uint256 public totalRaised;               // 已筹总额
    uint256 public investorCount;             // 参与人数
    bool public isRefundPhase;                // 是否进入冷静期/退款窗口
    uint256 public refundDeadline;            // 冷静期截止时间

    // ------ 早鸟参数 ------
    uint256 public constant EARLY_BIRD_LIMIT = 10;   // 前10名投资者
    uint256 public constant EARLY_BIRD_BONUS = 200; // 额外奖励200代币

    // ------ 数据结构 ------
    mapping(address => uint256) public contributions; // 地址 => 投入金额
    mapping(address => bool) public hasRefunded;      // 是否已退款

    // ------ 代币合约 ------
    ProjectToken public token;

    // ------ 事件 ------
    event Funded(address indexed backer, uint256 amount, uint256 tokensMinted);
    event Refunded(address indexed backer, uint256 amount);
    event GoalReached(uint256 totalRaised);
    event Withdrawn(address indexed owner, uint256 amount);

    // ------ 修饰器 ------
    modifier onlyOwner() {
        require(msg.sender == owner, "CrowdFund: not owner");
        _;
    }

    modifier notEnded() {
        require(block.timestamp <= deadline, "CrowdFund: fundraising ended");
        _;
    }

    modifier ended() {
        require(block.timestamp > deadline, "CrowdFund: fundraising not ended");
        _;
    }

    /**
     * @param _goal 目标金额 (单位: wei)
     * @param _durationSeconds 众筹持续时间 (秒)
     * @param _tokenName 代币名称
     * @param _tokenSymbol 代币符号
     */
    constructor(
        uint256 _goal,
        uint256 _durationSeconds,
        string memory _tokenName,
        string memory _tokenSymbol
    ) {
        owner = msg.sender;
        goal = _goal;
        deadline = block.timestamp + _durationSeconds;

        // 部署代币合约，并将众筹合约地址设置为铸造权限
        token = new ProjectToken(address(this), _tokenName, _tokenSymbol);
    }

    // ------ 核心投资函数 ------
    function fund() external payable notEnded nonReentrant {
        require(msg.value > 0, "CrowdFund: must send ETH");

        uint256 contribution = msg.value;
        uint256 tokensToMint = (contribution / 1 ether) * EXCHANGE_RATE; // 仅按整数ETH计算（简化）
        // 注意：如果投入0.1 ETH，则 tokensToMint = 0，为避免浪费，改进为按比例：
        // 更精确： tokensToMint = (contribution * EXCHANGE_RATE) / 1 ether;
        tokensToMint = (contribution * EXCHANGE_RATE) / 1 ether;
        require(tokensToMint > 0, "CrowdFund: contribution too small");

        // 记录贡献
        if (contributions[msg.sender] == 0) {
            investorCount++;
        }
        contributions[msg.sender] += contribution;
        totalRaised += contribution;

        // ---- 早鸟奖励 (前N名投资者) ----
        uint256 bonus = 0;
        if (investorCount <= EARLY_BIRD_LIMIT) {
            bonus = EARLY_BIRD_BONUS;
        }

        // 铸造代币 (常规 + 奖励)
        uint256 totalMint = tokensToMint + bonus;
        token.mint(msg.sender, totalMint);

        emit Funded(msg.sender, contribution, totalMint);

        // 自动检查是否达成目标
        if (totalRaised >= goal) {
            emit GoalReached(totalRaised);
        }
    }

    // ------ 众筹结束后取款 (成功) ------
    function withdrawFunds() external onlyOwner ended nonReentrant {
        require(totalRaised >= goal, "CrowdFund: goal not reached");
        require(!isRefundPhase, "CrowdFund: in refund phase, use claimRefund");

        uint256 balance = address(this).balance;
        require(balance > 0, "CrowdFund: no balance");

        (bool sent, ) = owner.call{value: balance}("");
        require(sent, "CrowdFund: failed to send ETH");
        emit Withdrawn(owner, balance);
    }

    // ------ 冷静期/退款功能 (拓展功能) ------
    /**
     * @dev 发起人调用，开启冷静期退款窗口 (仅在众筹结束后且未达标时)
     * 或者即使达标，也可以开启？任务书要求"众筹结束后设定退款窗口"，我们设定为：未达标自动开启，达标则不可退款。
     * 但拓展功能提到"冷静期/保险期"，这里实现为：如果未达标，任何参与者可调用claimRefund。
     * 无需额外开启，直接判断即可。
     */
    function claimRefund() external ended nonReentrant {
        // 众筹成功则不允许退款
        require(totalRaised < goal, "CrowdFund: goal reached, no refund");
        
        uint256 amount = contributions[msg.sender];
        require(amount > 0, "CrowdFund: no contribution");
        require(!hasRefunded[msg.sender], "CrowdFund: already refunded");

        // 标记已退款
        hasRefunded[msg.sender] = true;
        contributions[msg.sender] = 0;

        // 退还ETH
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "CrowdFund: refund failed");

        emit Refunded(msg.sender, amount);
    }

    // ------ 查询当前已筹金额 (前端展示用) ------
    function getTotalRaised() external view returns (uint256) {
        return totalRaised;
    }

    // ------ 查询剩余时间 (前端展示用) ------
    function getRemainingTime() external view returns (uint256) {
        if (block.timestamp >= deadline) return 0;
        return deadline - block.timestamp;
    }

    // 允许合约接收ETH (但仅通过fund函数)
    receive() external payable {
        revert("CrowdFund: use fund() to contribute");
    }
}