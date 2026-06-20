import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Progress, Button, InputNumber, Typography, Space, Divider, message, List, Avatar, Skeleton, notification } from 'antd';
import { RocketOutlined, UserOutlined, ClockCircleOutlined, FireOutlined } from '@ant-design/icons';
import { ethers } from 'ethers';
import { CROWDFUND_ADDRESS } from '../constants';
import CrowdFundABI from '../assets/abis/CrowdFund.json';

const { Title, Text } = Typography;
const { Countdown } = Statistic;

export default function Crowdfunding() {
  // ==========================================
  // 1. 状态定义
  // ==========================================
  const [investAmount, setInvestAmount] = useState(0.01);
  const [loading, setLoading] = useState(false);
  const [contractData, setContractData] = useState({
    raised: "0",
    goal: "0",
    investors: "0",
    deadline: 0,
    recentInvests: []
  });

  // ==========================================
  // 2. 区块链交互逻辑
  // ==========================================
  
  /**
   * 从链上获取众筹实时状态与历史投资记录
   */
  const fetchContractData = async () => {
    if (!window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CROWDFUND_ADDRESS, CrowdFundABI.abi, provider);
    
      // 并发读取链上状态变量
      const [raised, goal, count, deadline] = await Promise.all([
        contract.totalRaised(),
        contract.goal(),
        contract.investorCount(),
        contract.deadline()
      ]);

      // 获取所有历史投资事件 (Funded)
      const events = await contract.queryFilter(contract.filters.Funded(), 0, 'latest');
      const realInvests = events.map(event => ({
        address: event.args[0],
        amount: ethers.formatEther(event.args[1]),
        time: "已确认" 
      })).reverse();

      setContractData({
        raised: ethers.formatEther(raised),
        goal: ethers.formatEther(goal),
        investors: count.toString(),
        deadline: Number(deadline) * 1000,
        recentInvests: realInvests 
      });
    } catch (error) {
      console.error("链上数据获取异常:", error);
    }
  };

  useEffect(() => {
    fetchContractData();
  }, []);

  /**
   * 发起投资交易
   */
  const handleInvest = async () => {
    if (!window.ethereum) {
      message.error("请先安装 MetaMask");
      return;
    }
    setLoading(true);
    const hide = message.loading('正在发起区块链交易...', 0);
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CROWDFUND_ADDRESS, CrowdFundABI.abi, signer);

      // 调用合约 fund() 函数
      const tx = await contract.fund({
        value: ethers.parseEther(investAmount.toString())
      });

      message.loading({ content: '交易已提交，等待区块确认...', key: 'updatable' });
      await tx.wait(); // 等待上链确认

      const earnedTokens = investAmount * 10000;
      hide();
      notification.success({
        message: '投资成功',
        description: `已获得 ${earnedTokens} CFC 代币，交易哈希: ${tx.hash.slice(0,10)}...`,
        placement: 'bottomRight',
      });
      
      fetchContractData(); // 成功后刷新面板
    } catch (error) {
      hide();
      console.error("交易失败:", error);
      message.error(error.code === 'ACTION_REJECTED' ? '用户取消了交易' : '交易执行出错');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 3. 页面渲染
  // ==========================================
  const progressPercent = contractData.goal > 0 
    ? (Number(contractData.raised) / Number(contractData.goal) * 100).toFixed(1) 
    : 0;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <Title level={2} className="neon-gradient-text">CFC Genesis Event</Title>
        <Text type="secondary" style={{ fontSize: '16px' }}>参与链上众筹，铸造专属代币，解锁专属限量周边！</Text>
      </div>

      <Row gutter={24}>
        <Col span={16}>
          <Skeleton loading={contractData.goal === "0"} active>
            <Card className="cyber-card neon-glow" bordered={false}>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic title="已筹集" value={contractData.raised} precision={2} prefix={<FireOutlined style={{ color: '#ff4d4f' }} />} suffix="ETH" />
                </Col>
                <Col span={8}>
                  <Statistic title="目标金额" value={contractData.goal} suffix="ETH" />
                </Col>
                <Col span={8}>
                  <Statistic title="参与人数" value={contractData.investors} prefix={<UserOutlined />} />
                </Col>
              </Row>
              <Divider />
              <div style={{ marginBottom: '20px' }}>
                <Text strong>众筹进度: {progressPercent}%</Text>
                <Progress percent={Number(progressPercent)} status="active" strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }} strokeWidth={15} />
              </div>
            </Card>

            <Card title="最近投资动态" style={{ marginTop: '20px' }} className="cyber-card" bordered={false}>
              <List
                itemLayout="horizontal"
                dataSource={contractData.recentInvests}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar src={`https://api.dicebear.com/7.x/identicon/svg?seed=${item.address}`} />}
                      title={<span>{item.address.slice(0,6)}...{item.address.slice(-4)} 投资了 {item.amount} ETH</span>}
                      description={item.time}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Skeleton>
        </Col>

        <Col span={8}>
          <Card title="立即参与" className="cyber-card" bordered={false}>
            <Countdown title="距离结束还剩" value={contractData.deadline} format="D 天 H 时 m 分 s 秒" prefix={<ClockCircleOutlined />} />
            <Divider />
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">输入投资金额 (ETH):</Text>
              <InputNumber min={0.001} value={investAmount} onChange={setInvestAmount} style={{ width: '100%' }} size="large" />
              <Button className="neon-button" type="primary" size="large" block icon={<RocketOutlined />} loading={loading} onClick={handleInvest}>
                支持项目
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}