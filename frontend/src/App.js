import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { App as AntdApp, Layout, Menu, Button, ConfigProvider, Typography, theme } from 'antd';
import { RocketOutlined, ShopOutlined, UserOutlined, BarChartOutlined, WalletOutlined } from '@ant-design/icons';
import { ethers } from 'ethers';

// 导入页面组件
import Crowdfunding from './pages/Crowdfunding';
import Store from './pages/Store';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';

const { Text } = Typography;
const { Header, Content, Footer } = Layout;

const App = () => {
  // ==========================================
  // 1. 状态管理
  // ==========================================
  const location = window.location.pathname;
  const [currentKey, setCurrentKey] = useState(location === '/' ? '/' : location);
  const [account, setAccount] = useState(null);

  // ==========================================
  // 2. 钱包与区块链交互逻辑
  // ==========================================
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("请安装 MetaMask 插件！");
      return;
    }
    try {
      // 检查网络是否为 Sepolia
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== '0xaa36a7') {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xaa36a7' }],
        });
      }
      // 请求连接账号
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
    } catch (error) {
      console.error("连接钱包失败:", error);
    }
  };

  // 监听账号和网络变化
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountChange = (accounts) => {
        setAccount(accounts.length > 0 ? accounts[0] : null);
      };

      // 注册事件监听
      window.ethereum.on('accountsChanged', handleAccountChange);
      window.ethereum.on('chainChanged', () => window.location.reload());

      // 初始化检查
      window.ethereum.request({ method: 'eth_accounts' }).then(handleAccountChange);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountChange);
      };
    }
  }, []);

  // ==========================================
  // 3. 导航配置
  // ==========================================
  const menuItems = [
    { key: '/', icon: <RocketOutlined />, label: <Link to="/">众筹主页</Link> },
    { key: '/store', icon: <ShopOutlined />, label: <Link to="/store">积分商城</Link> },
    { key: '/profile', icon: <UserOutlined />, label: <Link to="/profile">个人中心</Link> },
    { key: '/dashboard', icon: <BarChartOutlined />, label: <Link to="/dashboard">数据看板</Link> },
  ];

  // ==========================================
  // 4. 渲染视图
  // ==========================================
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm, // 启用 Antd 深色主题
        token: { colorPrimary: '#00f2ff', borderRadius: 12, colorBgBase: '#0b0e14' },
      }}
    >
      <AntdApp>
        <Router>
          <Layout style={{ minHeight: '100vh', background: '#0b0e14' }}>
            <Header style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
              background: '#161b22', padding: '0 50px', borderBottom: 'none' 
            }}>
              <div style={{ color: '#00f2ff', fontSize: '22px', fontWeight: '800', letterSpacing: '2px' }}>
                CFC NEXUS
              </div>
              
              <Menu 
                theme="dark" mode="horizontal" selectedKeys={[currentKey]} 
                onClick={(e) => setCurrentKey(e.key)} items={menuItems} 
                style={{ flex: 1, justifyContent: 'center', background: 'transparent' }} 
              />

              {/* 钱包连接状态显示 */}
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.08)', padding: '4px 16px', 
                borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex', alignItems: 'center'
              }}>
                {account && (
                  <Text style={{ color: '#fff', fontSize: '14px', marginRight: '10px' }}>
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </Text>
                )}
                <Button type="primary" shape="round" onClick={connectWallet}>
                  {account ? '已连接' : '连接钱包'}
                </Button>
              </div>
            </Header>

            {/* 滚动通知条 */}
            <div className="marquee-container">
              <div className="marquee-content">
                &nbsp;&nbsp;◈ 众筹火热进行中... ◈ 目标 1.0 ETH ◈ CFC 创世纪元开启... ◈ 欢迎探索 Web3 极客世界... &nbsp;&nbsp;
              </div>
            </div>
            
            <Content style={{ padding: '24px 50px', background: '#0b0e14' }}>
              <div style={{ 
                  background: '#1c2128', padding: '30px', minHeight: '600px',
                  borderRadius: '16px', border: '1px solid #30363d'
                }}>
                <Routes>
                  <Route path="/" element={<Crowdfunding />} />
                  <Route path="/store" element={<Store />} />
                  <Route path="/profile" element={<Profile userAccount={account} />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                </Routes>
              </div>
            </Content>

            <Footer style={{ textAlign: 'center' }}>
              Blockchain DApp Project ©2026 Created by CFC NEXUS
            </Footer>
          </Layout>
        </Router>
      </AntdApp>
    </ConfigProvider>
  );
};

export default App;