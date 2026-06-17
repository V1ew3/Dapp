import React, { useState, useEffect } from 'react';
import { List, Card, Button, Typography, Tag, message, Modal } from 'antd';
import { ShopOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { ethers } from 'ethers';
import { TOKEN_ADDRESS, CROWDFUND_ADDRESS } from '../constants';
import ProjectTokenABI from '../assets/abis/ProjectToken.json';

const { Title, Text } = Typography;

// 初始商品数据
const INITIAL_PRODUCTS = [
  { id: 1, 
    name: "Web3 极客贴纸套装", 
    price: 50, 
    stock: 50, 
    image: "https://cdn-icons-png.flaticon.com/512/6895/6895301.png", 
    description: "包含以太坊、Solidity等5款精美贴纸" },
  { id: 2, 
    name: "项目纪念 T 恤", 
    price: 200, 
    stock: 20, 
    image: "https://cdn-icons-png.flaticon.com/512/2503/2503380.png", 
    description: "纯棉材质，印有项目专属 Logo" },
  { id: 3, 
    name: "极客帆布包", 
    price: 150, 
    stock: 15, 
    image: "https://cdn-icons-png.flaticon.com/512/2905/2905138.png", 
    description: "大容量，适合装下你的 MacBook" }
];

export default function Store() {
  const [products, setProducts] = useState([]);
  const [myTokens, setMyTokens] = useState(0);
  const [account, setAccount] = useState(null);

  // 获取链上真实代币余额
  const fetchRealTokenBalance = async (userAddress) => {
    if (!window.ethereum || !userAddress) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const tokenContract = new ethers.Contract(TOKEN_ADDRESS, ProjectTokenABI.abi, provider);
      const balance = await tokenContract.balanceOf(userAddress);
      setMyTokens(Number(balance)); // 更新状态
    } catch (error) {
      console.error("商城读取代币失败:", error);
    }
  };

  useEffect(() => {
    // 1. 初始化账号并获取余额
    const init = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          fetchRealTokenBalance(accounts[0]);
        }
      }
    };
    init();

    // 2. 读取本地库存
    const savedProducts = localStorage.getItem('mall_products');
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    } else {
      setProducts(INITIAL_PRODUCTS);
      localStorage.setItem('mall_products', JSON.stringify(INITIAL_PRODUCTS));
    }
  }, []);

  // 兑换逻辑
  const handleExchange = async (product) => {
    if (!account) {
      message.warning("请先连接钱包");
      return;
    }

    Modal.confirm({
      title: '确认兑换',
      content: `确定要花费 ${product.price} CFC 兑换 ${product.name} 吗？(此操作将发起链上转账)`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        const hide = message.loading('正在发起代币转账...', 0);
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          
          // 1. 初始化代币合约 (需要 signer 才能发起转账)
          const tokenContract = new ethers.Contract(TOKEN_ADDRESS, ProjectTokenABI.abi, signer);

          // 2. 发起真实转账
          // 这里我们将代币转给众筹合约地址，作为代币的回收方
          const recipient = CROWDFUND_ADDRESS; 
          
          // 调用 ERC20 标准的 transfer 函数
          const tx = await tokenContract.transfer(recipient, product.price);
          
          message.loading({ content: '等待区块链确认交易...', key: 'updatable' });
          
          // 3. 等待交易成功
          await tx.wait(); 

          // 4. 只有链上转账成功了，才更新本地的库存和订单
          const newProducts = products.map(p => 
            p.id === product.id ? { ...p, stock: p.stock - 1 } : p
          );
          setProducts(newProducts);
          localStorage.setItem('mall_products', JSON.stringify(newProducts));

          const newOrder = {
            key: Date.now(),
            id: `ORD${Math.floor(Math.random()*1000)}`,
            item: product.name,
            cost: product.price,
            date: new Date().toLocaleDateString(),
            status: '已完成',
            hash: tx.hash // 存入真实的交易哈希，以后可以在个人中心点击查看
          };
          const savedOrders = JSON.parse(localStorage.getItem('myOrders') || '[]');
          localStorage.setItem('myOrders', JSON.stringify([newOrder, ...savedOrders]));

          hide();
          message.success({ content: `兑换成功！代币已扣除`, key: 'updatable' });
          
          // 5. 刷新本页显示的代币余额
          fetchRealTokenBalance(account);

        } catch (error) {
          hide();
          console.error("兑换失败:", error);
          // 处理用户拒绝签名的情况
          if (error.code === 'ACTION_REJECTED') {
            message.error("用户取消了支付");
          } else {
            message.error("交易失败，请确保你有足够的 CFC 和少量 ETH 作为手续费");
          }
        }
      }
    });
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <Title level={2}><ShopOutlined /> 积分兑换商城</Title>
        <Text type="secondary">
          当前可用代币 (来自链上): <Text strong type="danger" style={{ fontSize: '18px' }}>{myTokens}</Text> CFC
        </Text>
      </div>

      <List
        grid={{ gutter: 16, column: 3 }}
        dataSource={products}
        renderItem={(item) => (
          <List.Item>
            <Card
              hoverable
              cover={<img alt={item.name} src={item.image} style={{ height: 150, objectFit: 'contain', padding: 20 }} />}
              actions={[
                <Button 
                  type="primary" 
                  icon={<ShoppingCartOutlined />} 
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