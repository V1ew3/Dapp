import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import {  App as AntdApp, Layout, Menu, Button, ConfigProvider } from 'antd';
import { RocketOutlined, ShopOutlined, UserOutlined, BarChartOutlined, WalletOutlined } from '@ant-design/icons';
import { ethers } from 'ethers'; // 引入 ethers

// 导入我们刚才创建的页面
import Crowdfunding from './pages/Crowdfunding';
import Store from './pages/Store';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';

const { Header, Content, Footer } = Layout;

const App = () => {
  const location = window.location.pathname; 
  const [currentKey, setCurrentKey] = useState(location === '/' ? '/' : location);
  const [account, setAccount] = useState(null); // 存储钱包地址

  // 连接钱包的函数
  const connectWallet = async () => {
  if (window.ethereum) {
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      // Sepolia 的 Chain ID 是 0xaa36a7 (即 11155111)
      if (chainId !== '0xaa36a7') {
        alert('请切换到 Sepolia 测试网络！');
        // 甚至可以尝试自动帮用户切换网络（可选高级功能）
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xaa36a7' }],
        });
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
    } catch (error) {
      console.error("连接失败", error);
    }
  }
};

  // 检查是否已经连接过（刷新页面不丢失状态）
useEffect(() => {
  if (window.ethereum) {
    // 1. 定义处理账号变化的函数
    const handleAccountChange = async (accounts) => {
      console.log("检测到账号变化:", accounts);
      if (accounts.length > 0) {
        // 只要账号一变，我们直接重新获取一下，确保万无一失
        setAccount(accounts[0]);
      } else {
        setAccount(null);
      }
    };

    // 2. 绑定监听
    window.ethereum.on('accountsChanged', handleAccountChange);
    window.ethereum.on('chainChanged', () => window.location.reload());

    // 3. 初始检查（防止刷新后状态丢失）
    window.ethereum.request({ method: 'eth_accounts' })
      .then(handleAccountChange);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountChange);
    };
  }
}, []);

  // 导航菜单配置 
  const menuItems = [
    { key: '/', icon: <RocketOutlined />, label: <Link to="/">众筹主页</Link> },
    { key: '/store', icon: <ShopOutlined />, label: <Link to="/store">积分商城</Link> },
    { key: '/profile', icon: <UserOutlined />, label: <Link to="/profile">个人中心</Link> },
    { key: '/dashboard', icon: <BarChartOutlined />, label: <Link to="/dashboard">数据看板</Link> },
  ];

  return (
    <ConfigProvider 
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8, // 圆角稍微圆润一点
        },
        components: {
          Card: {
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)', // 给所有卡片加微弱阴影
          },
        },
      }}
      >
      <AntdApp>
        <Router>
          <Layout style={{ minHeight: '100vh' }}>
            <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#001529' }}>
              <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginRight: '20px' }}>
                🚀 Web3 Crowdfund
              </div>
              
              <Menu 
                theme="dark" 
                mode="horizontal" 
                selectedKeys={[currentKey]} 
                onClick={(e) => setCurrentKey(e.key)}
                items={menuItems} 
                style={{ flex: 1, minWidth: 0 }}
              />

              <div>
                <Button 
                  size="small" 
                  type="dashed" 
                  danger 
                  onClick={() => { localStorage.clear(); window.location.reload(); }}>
                  重置数据
                </Button>
                {/* 动态显示：如果没连接显示“连接钱包”，连接了显示缩短的地址 */}
                {account ? (
                  <Button type="default" ghost style={{ color: '#52c41a', borderColor: '#52c41a' }}>
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </Button>
                ) : (
                  <Button type="primary" icon={<WalletOutlined />} onClick={connectWallet}>
                    连接钱包
                  </Button>
                )}
              </div>
            </Header>

            <Content style={{ padding: '24px', background: '#f5f5f5' }}>
              <div style={{ background: '#fff', padding: '24px', minHeight: '380px', borderRadius: '8px' }}>
                <Routes>
                  <Route path="/" element={<Crowdfunding />} />
                  <Route path="/store" element={<Store />} />
                  <Route path="/profile" element={<Profile userAccount={account} />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                </Routes>
              </div>
            </Content>

            <Footer style={{ textAlign: 'center' }}>
              Blockchain DApp Project ©2026 Created by V1ew3 Team
            </Footer>
          </Layout>
        </Router>
      </AntdApp>
    </ConfigProvider>
  );
};

export default App;