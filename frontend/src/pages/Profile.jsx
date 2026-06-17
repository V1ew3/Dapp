import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Typography, Avatar, Divider, Empty, Button  } from 'antd';
import { UserOutlined, WalletOutlined, DollarOutlined, HistoryOutlined } from '@ant-design/icons';
import { ethers } from 'ethers';

const { Title, Text } = Typography;

// 注意：这里接收从 App.js 传下来的 userAccount
export default function Profile({ userAccount }) {
  const [orderHistory, setOrderHistory] = useState([]);
  const [ethBalance, setEthBalance] = useState('0.0');
  const [tokenBalance, setTokenBalance] = useState('0'); // 项目代币余额

  const columns = [
    { title: '订单编号', dataIndex: 'id', key: 'id' },
    { title: '兑换商品', dataIndex: 'item', key: 'item' },
    { title: '消耗代币', dataIndex: 'cost', key: 'cost', render: (text) => <Text strong>{text} TOKEN</Text> },
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

  // 核心逻辑：监听 userAccount 的变化
  useEffect(() => {
    const getBalance = async () => {
      // 1. 如果没有传进来账号，就清空余额
      if (!userAccount) {
        setEthBalance('0.0');
        return;
      }

      // 2. 如果有账号，去链上查余额
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const balance = await provider.getBalance(userAccount);
        // 转换单位并保留 4 位小数
        setEthBalance(Number(ethers.formatEther(balance)).toFixed(4));
        console.log(`账号 ${userAccount} 的余额已更新`);
      } catch (error) {
        console.error("获取余额失败:", error);
        setEthBalance('0.0');
      }
    };

    getBalance();
    const rawTokens = localStorage.getItem('myTokenBalance');
    // 如果没有值，设为数字 0
    const tokenNum = rawTokens ? Number(rawTokens) : 0;
    // 确保显示的是数字字符串
    setTokenBalance(tokenNum.toString());
    const orders = JSON.parse(localStorage.getItem('myOrders') || '[]');
    setOrderHistory(orders);
  }, [userAccount]); 

  if (!userAccount) {
    return (
      <div style={{ padding: '100px 0', textAlign: 'center' }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span style={{ color: '#999' }}>
              检测到钱包未连接，请先点击右上角按钮连接钱包
            </span>
          }
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
              {userAccount ? userAccount : "未连接钱包"}
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
                <Statistic title="项目代币" value={tokenBalance} prefix={<DollarOutlined />} suffix="TOKEN" />
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 快捷说明 */}
        <Col span={12}>
          <Card title="温馨提示" bordered={false}>
            <Text type="secondary">
              代币仅限本项目商城使用，不具备流通属性。众筹成功后，代币将自动发放至您的钱包。
            </Text>
          </Card>
        </Col>
      </Row>

      <Divider orientation="left" orientationMargin="0">兑换记录</Divider>

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