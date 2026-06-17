import React, { useState } from 'react';
import { Row, Col, Card, Statistic, Progress, Button, InputNumber, Typography, Space, Divider, message, List, Avatar } from 'antd';
import { RocketOutlined, UserOutlined, ClockCircleOutlined, FireOutlined } from '@ant-design/icons';
import { ethers } from 'ethers';
import { MOCK_RECEIVER_ADDRESS } from '../constants';

const { Title, Text } = Typography;
const { Countdown } = Statistic;

// 模拟一些数据
const mockData = {
  title: "Web3 极客纪念币众筹",
  description: "参与众筹，获得独家项目代币，可在商城兑换限量版 T 恤和帆布包！",
  goal: 10, // 目标 10 ETH
  raised: 6.5, // 已筹 6.5 ETH
  investors: 128,
  deadline: Date.now() + 1000 * 60 * 60 * 24 * 3, // 3天后截止
};

export default function Crowdfunding() {
  const [investAmount, setInvestAmount] = useState(0.01);
  const [loading, setLoading] = useState(false);

  const recentInvests = [
  { address: "0x165D632b3B34762B1d1B254b0AFaDb41561E113f", amount: "0.5", time: "2分钟前" },
  { address: "0x041BFee980a72f7fa59ad07c5e9059f58c5be46b", amount: "0.1", time: "10分钟前" },
  { address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F", amount: "1.2", time: "1小时前" },
  ];
  // 核心：模拟投资转账函数
  const handleInvest = async () => {
    if (!window.ethereum) {
      message.error("请先安装 MetaMask");
      return;
    }
    setLoading(true);
    // 使用 antd 的 message.loading 创建一个可以手动销毁的提示
    const hide = message.loading('正在发起交易，请在 MetaMask 中确认...', 0);
    try {
      // 1. 初始化 Provider 和 Signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // 2. 发起真实的转账交易 (模拟向合约投钱)
      const tx = await signer.sendTransaction({
        to: MOCK_RECEIVER_ADDRESS,
        value: ethers.parseEther(investAmount.toString())
      });

      console.log("交易已发出，哈希值:", tx.hash);
      message.loading({ content: '交易已提交，等待区块确认...', key: 'updatable', duration: 0 });

      // 3. 等待矿工打包确认
      await tx.wait();

      const rewardRatio = 10000; // 1 ETH = 10000 代币
      const earnedTokens = investAmount * rewardRatio;

      // 更新本地代币余额
      const currentTokens = Number(localStorage.getItem('myTokenBalance') || 0);
      localStorage.setItem('myTokenBalance', currentTokens + earnedTokens);

      hide(); // 关闭加载提示
      message.success({ 
        content: `投资成功！已获得 ${earnedTokens} 代币，钱已转入模拟地址`, 
        key: 'updatable', 
        duration: 4 
      });
      
      // 这里以后可以写：刷新页面余额的逻辑
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

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* 项目标题区 */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <Title level={2}><RocketOutlined /> {mockData.title}</Title>
        <Text type="secondary" style={{ fontSize: '16px' }}>{mockData.description}</Text>
      </div>

      <Row gutter={24}>
        {/* 左侧：进度与统计 */}
        <Col span={16}>
          <Card bordered={false} className="shadow-card">
            <Row gutter={16}>
              <Col span={8}>
                <Statistic 
                  title="已筹集" 
                  value={mockData.raised} 
                  precision={2} 
                  prefix={<FireOutlined style={{ color: '#ff4d4f' }} />} 
                  suffix="ETH" 
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="目标金额" 
                  value={mockData.goal} 
                  suffix="ETH" 
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="参与人数" 
                  value={mockData.investors} 
                  prefix={<UserOutlined />} 
                />
              </Col>
            </Row>

            <Divider />

            <div style={{ marginBottom: '20px' }}>
              <Text strong>众筹进度: {((mockData.raised / mockData.goal) * 100).toFixed(1)}%</Text>
              <Progress 
                percent={(mockData.raised / mockData.goal) * 100} 
                status="active" 
                strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                strokeWidth={15}
              />
            </div>
          </Card>

          <Card title="最近投资动态" style={{ marginTop: '20px' }}>
            <List
                itemLayout="horizontal"
                dataSource={recentInvests}
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
              value={mockData.deadline} 
              format="D 天 H 时 m 分 s 秒" 
              prefix={<ClockCircleOutlined />}
            />
            
            <Divider />
            
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">输入投资金额 (ETH):</Text>
              <InputNumber 
                min={0.01} 
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
                loading={loading} //绑定加载状态
                onClick={handleInvest}
              >
                支持项目
              </Button>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                * 预计获得: 1000 代币
              </Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}