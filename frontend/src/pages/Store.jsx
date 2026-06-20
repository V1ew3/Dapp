import React, { useState, useEffect } from 'react';
import { List, Card, Button, Typography, Tag, message, Modal } from 'antd';
import { GiftOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { ethers } from 'ethers';

// 导入常量与 ABI
import { TOKEN_ADDRESS, CROWDFUND_ADDRESS } from '../constants';
import ProjectTokenABI from '../assets/abis/ProjectToken.json';

// 导入商品图片
import stickerImg from '../assets/sticker.png';
import tshirtImg from '../assets/tshirt_black.png';
import bagImg from '../assets/bag.png';

const { Title, Text } = Typography;

// 1. 初始商品数据 (作为本地持久化数据的基准)
const INITIAL_PRODUCTS = [
  { id: 1, name: "Web3 极客贴纸套装", price: 50, stock: 50, image: stickerImg, description: "CFC NEXUS特制精美贴纸,专为极客硬件装备设计" },
  { id: 2, name: "CFC 创世纪元T恤", price: 2000, stock: 20, image: tshirtImg, description: "限量版赛博风格纯棉T恤,赛博霓虹印花" },
  { id: 3, name: "极客帆布包", price: 1500, stock: 15, image: bagImg, description: "CFC 极简帆布包,轻松容纳你的工作站与想象" }
];

export default function Store() {
  const [products, setProducts] = useState([]);
  const [myTokens, setMyTokens] = useState(0);
  const [account, setAccount] = useState(null);

  // ==========================================
  // 1. 数据初始化与状态同步
  // ==========================================
  useEffect(() => {
    const init = async () => {
      // 连接钱包并读取余额
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          fetchRealTokenBalance(accounts[0]);
        }
      }
    };
    init();

    // 读取本地库存配置
    const savedProducts = localStorage.getItem('mall_products');
    setProducts(savedProducts ? JSON.parse(savedProducts) : INITIAL_PRODUCTS);
  }, []);

  // 从链上获取真实代币余额
  const fetchRealTokenBalance = async (userAddress) => {
    if (!window.ethereum || !userAddress) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const tokenContract = new ethers.Contract(TOKEN_ADDRESS, ProjectTokenABI.abi, provider);
      const balance = await tokenContract.balanceOf(userAddress);
      setMyTokens(Number(balance));
    } catch (error) {
      console.error("商城读取代币失败:", error);
    }
  };

  // ==========================================
  // 2. 兑换业务逻辑 (链上支付 + 链下库存管理)
  // ==========================================
  const handleExchange = async (product) => {
    if (!account) {
      message.warning("请先连接钱包");
      return;
    }

    Modal.confirm({
      title: '确认兑换',
      content: `确定要花费 ${product.price} CFC 兑换 ${product.name} 吗？`,
      onOk: async () => {
        const hide = message.loading('正在发起代币转账...', 0);
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const tokenContract = new ethers.Contract(TOKEN_ADDRESS, ProjectTokenABI.abi, signer);
          
          // 发起真实 ERC20 转账
          const tx = await tokenContract.transfer(CROWDFUND_ADDRESS, product.price);
          message.loading({ content: '交易已提交，等待区块链确认...', key: 'updatable' });
          await tx.wait(); 

          // 更新本地库存状态
          const newProducts = products.map(p => p.id === product.id ? { ...p, stock: p.stock - 1 } : p);
          setProducts(newProducts);
          localStorage.setItem('mall_products', JSON.stringify(newProducts));

          // 记录本地订单
          const newOrder = {
            key: Date.now(),
            id: `ORD${Math.floor(Math.random()*1000)}`,
            item: product.name,
            cost: product.price,
            date: new Date().toLocaleDateString(),
            status: '已完成',
            hash: tx.hash
          };
          const savedOrders = JSON.parse(localStorage.getItem('myOrders') || '[]');
          localStorage.setItem('myOrders', JSON.stringify([newOrder, ...savedOrders]));

          hide();
          message.success('兑换成功！');
          fetchRealTokenBalance(account); // 刷新显示余额

        } catch (error) {
          hide();
          message.error("交易失败，请确保余额充足");
        }
      }
    });
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <Title level={2} className="neon-gradient-text"><GiftOutlined /> 积分兑换商城</Title>
        <Text type="secondary">当前可用余额: <Text strong type="danger" style={{ fontSize: '18px' }}>{myTokens}</Text> CFC</Text>
      </div>

      <List
        grid={{ gutter: 16, column: 3 }}
        dataSource={products}
        renderItem={(item) => (
          <List.Item>
            <Card
              className="cyber-card"
              hoverable
              cover={<img alt={item.name} src={item.image} style={{ height: 280, width: '100%', objectFit: 'contain', padding: '20px' }} />}
              actions={[
                <Button 
                  className="neon-button"
                  type="primary" 
                  onClick={() => handleExchange(item)}
                  disabled={item.stock <= 0}
                >
                  {item.stock <= 0 ? '已售罄' : '立即兑换'}
                </Button>
              ]}
            >
              <Card.Meta
                title={item.name}
                description={
                  <div>
                    <div style={{ marginBottom: '10px', height: '40px', overflow: 'hidden' }}>{item.description}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text type="danger" strong>{item.price} CFC</Text>
                      <Tag color="blue">库存: {item.stock}</Tag>
                    </div>
                  </div>
                }
              />
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
}