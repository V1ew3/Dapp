import React from 'react';
import { Card, Row, Col, Statistic, Typography } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { RiseOutlined, UsergroupAddOutlined, TrophyOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

// 模拟众筹增长数据
const data = [
  { day: '03-15', amount: 0.5, participants: 5 },
  { day: '03-16', amount: 1.2, participants: 12 },
  { day: '03-17', amount: 2.8, participants: 25 },
  { day: '03-18', amount: 4.5, participants: 48 },
  { day: '03-19', amount: 5.9, participants: 86 },
  { day: '03-20', amount: 6.5, participants: 128 },
];

export default function Dashboard() {
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
              value={6.5}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix={<RiseOutlined />}
              suffix="ETH"
            />
            <Text type="secondary">较昨日增长 12%</Text>
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} hoverable>
            <Statistic
              title="总参与人数"
              value={128}
              prefix={<UsergroupAddOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
            <Text type="secondary">活跃投资者占比 85%</Text>
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} hoverable>
            <Statistic
              title="平均投资额"
              value={0.05}
              precision={3}
              prefix={<TrophyOutlined />}
              suffix="ETH"
            />
            <Text type="secondary">社区支持力度：高</Text>
          </Card>
        </Col>
      </Row>

      {/* 图表区 */}
      <Row gutter={16}>
        <Col span={24}>
          <Card title="资金筹集增长曲线" bordered={false}>
            <div style={{ width: '100%', height: 400 }}>
              <ResponsiveContainer>
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1677ff" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#1677ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    name="筹集金额(ETH)"
                    stroke="#1677ff" 
                    fillOpacity={1} 
                    fill="url(#colorAmt)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}