// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// 继承 OpenZeppelin 的 ERC20 和 Ownable 协议
contract CrowdsaleToken is ERC20, Ownable {
    // 构造函数：设置代币名称 "ProjectToken" 和符号 "PTK"
    // 初始化 Ownable，将部署者设为初始管理员
    constructor() ERC20("ProjectToken", "PTK") Ownable(msg.sender) {}

    // 铸造函数：只有管理员（未来的众筹合约）可以调用
    // 这里的 amount 是以最小单位 wei 计算的
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}