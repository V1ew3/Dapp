// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title 项目众筹代币 (ProjectToken)
 * @dev 标准ERC-20代币，仅允许众筹合约铸造。无流通限制，仅供商城兑换。
 */
contract ProjectToken is ERC20, Ownable {
    
    // 众筹合约地址（拥有铸造权限）
    address public crowdFundContract;

    /**
     * @param _crowdFund 众筹合约地址
     * @param _name 代币名称（例如 "CrowdFund Coin"）
     * @param _symbol 代币符号（例如 "CFC"）
     */
    constructor(
        address _crowdFund,
        string memory _name,
        string memory _symbol
    ) ERC20(_name, _symbol) Ownable(msg.sender) {
        crowdFundContract = _crowdFund;
    }

    /**
     * @dev 仅允许众筹合约调用铸造代币
     * @param to 接收代币的地址
     * @param amount 铸造数量
     */
    function mint(address to, uint256 amount) external {
        require(msg.sender == crowdFundContract, "ProjectToken: only crowdFund contract can mint");
        _mint(to, amount);
    }

    /**
     * @dev 更新众筹合约地址（安全措施，仅Owner）
     */
    function setCrowdFundContract(address _newCrowdFund) external onlyOwner {
        crowdFundContract = _newCrowdFund;
    }
}