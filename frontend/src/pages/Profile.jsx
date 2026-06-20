import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Typography, Avatar, Divider, Empty, Button } from 'antd';
import { UserOutlined, WalletOutlined, DollarOutlined, HistoryOutlined } from '@ant-design/icons';
import { ethers } from 'ethers';

// 导入合约常量与ABI
import { TOKEN_ADDRESS } from '../constants';
import ProjectTokenABI from '../assets/abis/ProjectToken.json';
import avatarImg from '../assets/avatar.png';

const { Title, Text } = Typography;

export default function Profile({ userAccount }) {
  const [orderHistory, setOrderHistory] = useState([]);
  const [ethBalance, setEthBalance] = useState('0.0');
  const [tokenBalance, setTokenBalance] = useState('0');

  // 配置表格列定义
  const columns = [
    { title: '订单编号', dataIndex: 'id', key: 'id' },
    { title: '兑换商品', dataIndex: 'item', key: 'item' },
    { title: '消耗代币', dataIndex: 'cost', key: 'cost', render: (text) => <Text strong>{text} CFC</Text> },
    { title: '日期', dataIndex: 'date', key: 'date' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status) => <Tag color={status === '已发货' ? 'green' : 'blue'}>{status}</Tag>
    },
  ];

  // 监听账号变化，同步获取链上资产与本地订单
  useEffect(() => {
    const fetchData = async () => {
      if (!userAccount || !window.ethereum) return;

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        
        // 1. 获取 ETH 余额 (链上实时)
        const balance = await provider.getBalance(userAccount);
        setEthBalance(Number(ethers.formatEther(balance)).toFixed(4));

        // 2. 获取 CFC 代币余额 (合约交互)
        const cleanTokenAddress = ethers.getAddress(TOKEN_ADDRESS);
        const tokenContract = new ethers.Contract(cleanTokenAddress, ProjectTokenABI.abi, provider);
        const tBalance = await tokenContract.balanceOf(ethers.getAddress(userAccount));
        
        setTokenBalance(tBalance.toString()); 

        // 3. 读取本地订单记录 (符合链下管理要求)
        const orders = JSON.parse(localStorage.getItem('myOrders') || '[]');
        setOrderHistory(orders);

      } catch (error) {
        console.error("加载账户数据失败:", error);
      }
    };

    fetchData();
  }, [userAccount]); 

  // --- 空状态处理 ---
  if (!userAccount) {
    return (
      <div style={{ padding: '100px 0', textAlign: 'center' }}>
        <Empty description={<span style={{ color: '#999' }}>检测到钱包未连接，请先连接钱包</span>}>
          <Button type="primary" onClick={() => window.ethereum.request({ method: 'eth_requestAccounts' })}>
            立即连接
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* 账户头部卡片 */}
      <Card className="cyber-card" bordered={false} style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #1677ff 0%, #003eb3 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar size={80} src={avatarImg} style={{ backgroundColor: '#fff' }} />
          <div style={{ marginLeft: '24px' }}>
            <Title level={3} className="identity-gradient-text" style={{ marginBottom: '4px' }}>MY</Title>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Text className="address-code-box" copyable={{ text: userAccount }}>
                {userAccount}
              </Text>
              <Tag color="cyan">Sepolia Testnet</Tag>
            </div>
          </div>
        </div>
      </Card>

      {/* 资产统计栏 */}
      <Row gutter={24}>
        <Col span={12}>
          <Card className="cyber-card" title={<span><WalletOutlined /> 我的资产</span>} bordered={false}>
            <Row>
              <Col span={12}>
                <Statistic title="ETH 余额" value={ethBalance} suffix="ETH" valueStyle={{ color: '#00f2ff' }} />
              </Col>
              <Col span={12}>
                <Statistic title="项目代币" value={tokenBalance} prefix={<DollarOutlined />} suffix="CFC" valueStyle={{ color: '#722ed1' }} />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col span={12}>
          <Card className="cyber-card" title="关于 CFC 代币" bordered={false}>
            <Text type="secondary">
              代币由众筹合约自动发放。1 ETH = 10000 CFC。代币仅限本项目商城使用，不具备流通属性。
            </Text>
          </Card>
        </Col>
      </Row>

      {/* 兑换历史表 */}
      <Divider orientation="left" orientationMargin="0" style={{ color: '#fff' }}>
        <HistoryOutlined /> 兑换记录
      </Divider>

      <Table 
        columns={columns} 
        dataSource={orderHistory} 
        pagination={false} 
        bordered={false}
        className="cyber-card"
      />
    </div>
  );
}