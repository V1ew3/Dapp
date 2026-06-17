import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Typography, Avatar, Divider, Empty, Button  } from 'antd';
import { UserOutlined, WalletOutlined, DollarOutlined, HistoryOutlined } from '@ant-design/icons';
import { ethers } from 'ethers';
import { TOKEN_ADDRESS } from '../constants';
import ProjectTokenABI from '../assets/abis/ProjectToken.json';

const { Title, Text } = Typography;

export default function Profile({ userAccount }) {
  const [orderHistory, setOrderHistory] = useState([]);
  const [ethBalance, setEthBalance] = useState('0.0');
  const [tokenBalance, setTokenBalance] = useState('0');

  const columns = [
    { title: '订单编号', dataIndex: 'id', key: 'id' },
    { title: '兑换商品', dataIndex: 'item', key: 'item' },
    { title: '消耗代币', dataIndex: 'cost', key: 'cost', render: (text) => <Text strong>{text} CFC</Text> },
    { title: '日期', dataIndex: 'date', key: 'date' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status) => (
        <Tag color={status === '已发货' ? 'green' : 'blue'}>{status}</Tag>
      )
    },
  ];

  // 获取链上真实余额
  useEffect(() => {
    const fetchBalances = async () => {
      if (!userAccount || !window.ethereum) return;

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        
        // 1. 获取 ETH 余额
        const balance = await provider.getBalance(userAccount);
        setEthBalance(Number(ethers.formatEther(balance)).toFixed(4));
        const cleanTokenAddress = ethers.getAddress(TOKEN_ADDRESS);
        console.log("正在查询代币余额，清洗后的地址:", cleanTokenAddress);
        
        const tokenContract = new ethers.Contract(cleanTokenAddress, ProjectTokenABI.abi, provider);
        
        const cleanUserAddress = ethers.getAddress(userAccount);
        const tBalance = await tokenContract.balanceOf(cleanUserAddress);
        
        // 直接转字符串显示
        setTokenBalance(tBalance.toString()); 

        // 3. 读取本地订单
        const orders = JSON.parse(localStorage.getItem('myOrders') || '[]');
        setOrderHistory(orders);

      } catch (error) {
        console.error("获取链上数据失败，错误详情:", error);
      }
    };

    fetchBalances();
  }, [userAccount]); 

  // 未连接钱包的空状态
  if (!userAccount) {
    return (
      <div style={{ padding: '100px 0', textAlign: 'center' }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<span style={{ color: '#999' }}>检测到钱包未连接，请先连接钱包</span>}
        >
          <Button type="primary" onClick={() => window.ethereum.request({ method: 'eth_requestAccounts' })}>
            立即连接
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* 用户信息头部 */}
      <Card bordered={false} style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #1677ff 0%, #003eb3 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar size={80} icon={<UserOutlined />} style={{ backgroundColor: '#fff', color: '#1677ff' }} />
          <div style={{ marginLeft: '24px' }}>
            <Title level={3} style={{ color: '#fff', marginBottom: '4px' }}>我的账户</Title>
            <Text 
              style={{ color: 'rgba(255,255,255,0.85)', fontSize: '16px' }}
              copyable={{ text: userAccount }}
            >
              {userAccount}
            </Text>
          </div>
        </div>
      </Card>

      <Row gutter={24}>
        {/* 资产统计 */}
        <Col span={12}>
          <Card title={<span><WalletOutlined /> 我的资产</span>} bordered={false}>
            <Row>
              <Col span={12}>
                <Statistic title="ETH 余额" value={ethBalance} suffix="ETH" />
              </Col>
              <Col span={12}>
                <Statistic title="项目代币" value={tokenBalance} prefix={<DollarOutlined />} suffix="CFC" />
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 快捷说明 */}
        <Col span={12}>
          <Card title="温馨提示" bordered={false}>
            <Text type="secondary">
              代币由众筹合约自动发放。1 ETH = 10000 CFC。代币仅限本项目商城使用。
            </Text>
          </Card>
        </Col>
      </Row>

      <Divider orientation="left" orientationMargin="0"><HistoryOutlined /> 兑换记录</Divider>

      {/* 订单表格 */}
      <Table 
        columns={columns} 
        dataSource={orderHistory} 
        pagination={false} 
        bordered={false}
      />
    </div>
  );
}