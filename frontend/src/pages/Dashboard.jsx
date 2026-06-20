import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Spin, Empty } from 'antd';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RiseOutlined, UsergroupAddOutlined, TrophyOutlined, LoadingOutlined } from '@ant-design/icons';
import { ethers } from 'ethers';
import { CROWDFUND_ADDRESS } from '../constants';
import CrowdFundABI from '../assets/abis/CrowdFund.json';

const { Title, Text } = Typography;

export default function Dashboard() {
  // 页面状态定义
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]); // 存储图表数据
  const [stats, setStats] = useState({ total: "0", count: "0", avg: "0" }); // 存储顶部统计卡片数据

  useEffect(() => {
    /**
     * 从区块链抓取实时与历史数据
     */
    const fetchData = async () => {
      if (!window.ethereum) return;
      try {
        setLoading(true);
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CROWDFUND_ADDRESS, CrowdFundABI.abi, provider);

        // 1. 并发获取合约的基础静态数据
        const [total, count] = await Promise.all([
          contract.totalRaised(),
          contract.investorCount()
        ]);

        const totalEth = parseFloat(ethers.formatEther(total));
        const countNum = parseInt(count.toString());

        // 2. 抓取链上历史“投资事件(Funded Event)”以还原增长曲线
        // queryFilter(filter, startBlock, endBlock) 可抓取指定范围内的所有记录
        const filter = contract.filters.Funded();
        const events = await contract.queryFilter(filter, 0, 'latest');

        let cumulative = 0; // 累计资金，用于计算 AreaChart 面积
        const history = events.map((event, i) => {
          cumulative += parseFloat(ethers.formatEther(event.args[1]));
          return { 
            day: `第 ${i + 1} 笔`, 
            amount: cumulative.toFixed(4) 
          };
        });

        // 3. 更新状态，触发页面渲染
        setChartData(history);
        setStats({
          total: totalEth.toFixed(4),
          count: countNum.toString(),
          avg: countNum > 0 ? (totalEth / countNum).toFixed(4) : "0"
        });
      } catch (e) {
        console.error("看板数据加载失败:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 加载中的转圈效果
  if (loading) return (
    <div style={{ textAlign: 'center', padding: '100px' }}>
      <Spin indicator={<LoadingOutlined spin />} size="large" tip="正在从区块链抓取历史数据..." />
    </div>
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2} className="neon-gradient-text" style={{ marginBottom: '30px' }}>
        <RiseOutlined /> 项目数据实时看板
      </Title>

      {/* 顶部三个统计指标卡片 */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        {[
          { title: '累计筹集资金(ETH)', val: stats.total, icon: <RiseOutlined />, color: '#00f2ff' },
          { title: '总参与人数', val: stats.count, icon: <UsergroupAddOutlined />, color: '#8b5cf6' },
          { title: '平均投资额(ETH)', val: stats.avg, icon: <TrophyOutlined />, color: '#ffcc00' },
        ].map((item, i) => (
          <Col span={8} key={i}>
            <Card className="cyber-card" bordered={false} hoverable>
              <Statistic title={item.title} value={item.val} valueStyle={{ color: item.color }} prefix={item.icon} />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 增长曲线图表 */}
      <Card className="cyber-card" title="资金筹集增长曲线 (按交易笔数)" bordered={false}>
        {chartData.length > 0 ? (
          <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
                <XAxis dataKey="day" stroke="#888" />
                <YAxis stroke="#888" suffix=" ETH" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#fff' }}
                  itemStyle={{ color: '#00f2ff' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#00f2ff" fill="rgba(0, 242, 255, 0.2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <Empty description="暂无投资数据" />
        )}
      </Card>
    </div>
  );
}