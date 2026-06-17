import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Spin, Empty } from 'antd';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { RiseOutlined, UsergroupAddOutlined, TrophyOutlined, LoadingOutlined } from '@ant-design/icons';
import { ethers } from 'ethers';
import { CROWDFUND_ADDRESS } from '../constants';
import CrowdFundABI from '../assets/abis/CrowdFund.json';

const { Title, Text } = Typography;

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState({
    total: "0",
    count: "0",
    avg: "0"
  });

  useEffect(() => {
    const fetchHistory = async () => {
      if (!window.ethereum) return;
      try {
        setLoading(true);
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CROWDFUND_ADDRESS, CrowdFundABI.abi, provider);

        // 1. 获取当前基础统计数据
        const total = await contract.totalRaised();
        const count = await contract.investorCount();
        const totalEth = parseFloat(ethers.formatEther(total));
        const countNum = parseInt(count.toString());

        // 2. 抓取所有历史投资事件来构建曲线
        const filter = contract.filters.Funded();
        const events = await contract.queryFilter(filter, 0, 'latest');

        let cumulativeAmount = 0;
        const history = [];

        // 遍历事件，构建增长坐标
        for (let i = 0; i < events.length; i++) {
          const event = events[i];
          const amount = parseFloat(ethers.formatEther(event.args[1]));
          cumulativeAmount += amount;
          
          // 获取该交易所在区块的时间戳（可选，如果觉得慢可以只用索引）
          // const block = await provider.getBlock(event.blockNumber);
          // const date = new Date(block.timestamp * 1000).toLocaleDateString();

          history.push({
            index: i + 1,
            day: `第 ${i + 1} 笔`, // 简单处理，显示笔数
            amount: cumulativeAmount.toFixed(4),
          });
        }

        setChartData(history);
        setStats({
          total: totalEth.toFixed(4),
          count: countNum.toString(),
          avg: countNum > 0 ? (totalEth / countNum).toFixed(4) : "0"
        });
      } catch (error) {
        console.error("获取看板数据失败:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} tip="正在从区块链抓取历史数据..." />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2} style={{ marginBottom: '30px' }}>
        <RiseOutlined /> 项目数据实时看板
      </Title>

      {/* 顶部核心指标 */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={8}>
          <Card bordered={false} hoverable>
            <Statistic
              title="累计筹集资金"
              value={stats.total}
              precision={4}
              valueStyle={{ color: '#3f8600' }}
              prefix={<RiseOutlined />}
              suffix="ETH"
            />
            <Text type="secondary">实时链上数据</Text>
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} hoverable>
            <Statistic
              title="总参与人数"
              value={stats.count}
              prefix={<UsergroupAddOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
            <Text type="secondary">独立钱包地址数</Text>
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} hoverable>
            <Statistic
              title="平均投资额"
              value={stats.avg}
              precision={4}
              prefix={<TrophyOutlined />}
              suffix="ETH"
            />
            <Text type="secondary">社区支持力度</Text>
          </Card>
        </Col>
      </Row>

      {/* 图表区 */}
      <Row gutter={16}>
        <Col span={24}>
          <Card title="资金筹集增长曲线 (按交易笔数)" bordered={false}>
            {chartData.length > 0 ? (
              <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1677ff" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#1677ff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" />
                    <YAxis suffix=" ETH" />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      name="累计金额(ETH)"
                      stroke="#1677ff" 
                      fillOpacity={1} 
                      fill="url(#colorAmt)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty description="暂无投资数据，曲线图将在有人投资后生成" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}