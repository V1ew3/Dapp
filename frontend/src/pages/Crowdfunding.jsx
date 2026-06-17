import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Progress, Button, InputNumber, Typography, Space, Divider, message, List, Avatar } from 'antd';
import { RocketOutlined, UserOutlined, ClockCircleOutlined, FireOutlined } from '@ant-design/icons';
import { ethers } from 'ethers';
import { CROWDFUND_ADDRESS } from '../constants';
import CrowdFundABI from '../assets/abis/CrowdFund.json';

const { Title, Text } = Typography;
const { Countdown } = Statistic;

export default function Crowdfunding() {
  const [investAmount, setInvestAmount] = useState(0.01);
  const [loading, setLoading] = useState(false);

  // 1. 定义存放合约真实数据的状态
  const [contractData, setContractData] = useState({
    raised: "0",
    goal: "0",
    investors: "0",
    deadline: 0,
    recentInvests: [] // 初始为空
  });

  // 3. 从链上获取真实数据的函数
  const fetchContractData = async () => {
    if (!window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CROWDFUND_ADDRESS, CrowdFundABI.abi, provider);
    
      // --- A. 读取基础状态变量 ---
      const [raised, goal, count, deadline] = await Promise.all([
        contract.totalRaised(),
        contract.goal(),
        contract.investorCount(),
        contract.deadline()
      ]);

      // --- B. 抓取真实的“投资事件”记录 ---
      // 查找从合约部署到现在所有的 Funded 事件
      const filter = contract.filters.Funded();
      const events = await contract.queryFilter(filter, 0, 'latest'); 

      // 解析事件数据
      const realInvests = events.map(event => {
        return {
          address: event.args[0],
          amount: ethers.formatEther(event.args[1]),
          time: "已确认" 
        };
      }).reverse(); // 最新的投资排在最上面

      // --- C. 更新状态 ---
      setContractData({
        raised: ethers.formatEther(raised),
        goal: ethers.formatEther(goal),
        investors: count.toString(),
        deadline: Number(deadline) * 1000,
        recentInvests: realInvests 
      });

    } catch (error) {
      console.error("获取合约真实数据失败:", error);
    }
  };

  // 4. 页面加载时读取一次
  useEffect(() => {
    fetchContractData();
  }, []);

  // 5. 核心投资函数：调用合约的 fund 方法
  const handleInvest = async () => {
    if (!window.ethereum) {
      message.error("请先安装 MetaMask");
      return;
    }
    setLoading(true);
    const hide = message.loading('正在发起交易，请在 MetaMask 中确认...', 0);
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CROWDFUND_ADDRESS, CrowdFundABI.abi, signer);

      // 调用合约 fund 函数并发送 ETH
      const tx = await contract.fund({
        value: ethers.parseEther(investAmount.toString())
      });

      message.loading({ content: '交易已提交，等待区块确认...', key: 'updatable' });
      await tx.wait();

      hide();
      message.success({ content: '投资成功！代币已由合约自动发放', key: 'updatable', duration: 3 });
      
      // 投资成功后刷新页面数据
      fetchContractData(); 
      
    } catch (error) {
      hide();
      console.error("交易失败:", error);
      if (error.code === 'ACTION_REJECTED') {
        message.error('用户取消了交易');
      } else {
        message.error('交易执行出错');
      }
    } finally {
      setLoading(false);
    }
  };

  // 计算进度百分比
  const progressPercent = contractData.goal > 0 
    ? (Number(contractData.raised) / Number(contractData.goal) * 100).toFixed(1) 
    : 0;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* 项目标题区 */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <Title level={2}><RocketOutlined /> Web3 极客纪念币众筹</Title>
        <Text type="secondary" style={{ fontSize: '16px' }}>
          参与众筹，获得独家项目代币，可在商城兑换限量版周边！
        </Text>
      </div>

      <Row gutter={24}>
        {/* 左侧：进度与统计 */}
        <Col span={16}>
          <Card bordered={false}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic 
                  title="已筹集" 
                  value={contractData.raised} 
                  precision={2} 
                  prefix={<FireOutlined style={{ color: '#ff4d4f' }} />} 
                  suffix="ETH" 
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="目标金额" 
                  value={contractData.goal} 
                  suffix="ETH" 
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="参与人数" 
                  value={contractData.investors} 
                  prefix={<UserOutlined />} 
                />
              </Col>
            </Row>

            <Divider />

            <div style={{ marginBottom: '20px' }}>
              <Text strong>众筹进度: {progressPercent}%</Text>
              <Progress 
                percent={progressPercent} 
                status="active" 
                strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                strokeWidth={15}
              />
            </div>
          </Card>

          <Card title="最近投资动态" style={{ marginTop: '20px' }} bordered={false}>
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
        </Col>

        {/* 右侧：操作区 */}
        <Col span={8}>
          <Card title="立即参与" bordered={false}>
            <Countdown 
              title="距离结束还剩" 
              value={contractData.deadline} 
              format="D 天 H 时 m 分 s 秒" 
              prefix={<ClockCircleOutlined />}
            />
            
            <Divider />
            
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">输入投资金额 (ETH):</Text>
              <InputNumber 
                min={0.001} 
                value={investAmount} 
                onChange={setInvestAmount}
                style={{ width: '100%' }} 
                size="large"
              />
              <Button 
                type="primary" 
                size="large" 
                block 
                icon={<RocketOutlined />}
                loading={loading}
                onClick={handleInvest}
              >
                支持项目
              </Button>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                * 1 ETH = 10000 代币 (含早鸟奖励)
              </Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}