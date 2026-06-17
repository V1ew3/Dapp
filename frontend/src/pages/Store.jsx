import React, { useState, useEffect } from 'react';
import { List, Card, Button, Typography, Tag, message, Modal } from 'antd';
import { ShopOutlined, ShoppingCartOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

// 模拟商品数据
const INITIAL_PRODUCTS = [
  {
    id: 1,
    name: "Web3 极客贴纸套装",
    price: 50,
    image: "https://img.icons8.com/fluency/240/ethereum.png",
    description: "包含以太坊、Solidity等5款精美贴纸",
    stock: 50
  },
  {
    id: 2,
    name: "项目纪念 T 恤",
    price: 2000,
    image: "https://img.icons8.com/fluency/240/ethereum.png",
    description: "纯棉材质，印有项目专属 Logo",
    stock: 20
  },
  {
    id: 3,
    name: "极客帆布包",
    price: 1500,
    image: "https://img.icons8.com/fluency/240/ethereum.png",
    description: "大容量，适合装下你的 MacBook",
    stock: 15
  }
];

export default function Store() {
  const [products, setProducts] = useState([]);
  const [myTokens, setMyTokens] = useState(0);

  useEffect(() => {
    // 读取代币余额
    const tokens = Number(localStorage.getItem('myTokenBalance') || 0);
    setMyTokens(tokens);

    // 读取库存，如果没有则使用初始数据
    const savedProducts = localStorage.getItem('mall_products');
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    } else {
      setProducts(INITIAL_PRODUCTS); 
      localStorage.setItem('mall_products', JSON.stringify(INITIAL_PRODUCTS));
    }
  }, []);
  // 兑换处理函数
  const handleExchange = (product) => {
    // 1. 先弹出确认框
    Modal.confirm({
      title: '确认兑换',
      content: `确定要花费 ${product.price} 代币兑换 ${product.name} 吗？`,
      onOk: () => {
        const tokens = Number(localStorage.getItem('myTokenBalance') || 0);
        if (tokens < product.price) {
          message.error("代币不足！");
          return;
        }

        // 1. 扣除代币
        const newBalance = tokens - product.price;
        setMyTokens(newBalance);
        localStorage.setItem('myTokenBalance', newBalance);

        // 2. 减少库存 (关键修复)
        const newProducts = products.map(p => 
          p.id === product.id ? { ...p, stock: p.stock - 1 } : p
        );
        setProducts(newProducts);
        localStorage.setItem('mall_products', JSON.stringify(newProducts));

        // 3. 生成订单 (字段名必须是 item 和 cost，对应 Profile 页面)
        const newOrder = {
          key: Date.now(),
          id: `ORD${Math.floor(Math.random()*1000)}`,
          item: product.name, // 必须叫 item
          cost: product.price, // 必须叫 cost
          date: new Date().toLocaleDateString(),
          status: '处理中'
        };
        const savedOrders = JSON.parse(localStorage.getItem('myOrders') || '[]');
        localStorage.setItem('myOrders', JSON.stringify([newOrder, ...savedOrders]));

        message.success(`成功兑换 ${product.name}！`);
      }
    });
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <Title level={2}><ShopOutlined /> 积分兑换商城</Title>
        <Text type="secondary">使用众筹获得的代币，兑换精美周边礼品</Text>
      </div>

      <List
        grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3 }}
        dataSource={products}
        renderItem={(item) => (
          <List.Item>
            <Card
              hoverable
              cover={<img alt="example" src={item.image} style={{ height: 200, objectFit: 'contain', padding: 20 }} />}
              actions={[
                <Button 
                  type="primary" 
                  icon={<ShoppingCartOutlined />} 
                  onClick={() => handleExchange(item)}
                >
                  立即兑换
                </Button>
              ]}
            >
              <Card.Meta
                title={item.name}
                description={
                  <div>
                    <div style={{ marginBottom: '10px' }}>{item.description}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text type="danger" strong style={{ fontSize: '18px' }}>
                        {item.price} <span style={{ fontSize: '12px' }}>代币</span>
                      </Text>
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