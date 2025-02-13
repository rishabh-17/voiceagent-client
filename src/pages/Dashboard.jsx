import { useState, useEffect } from "react";
import { Card, Row, Col, Statistic } from "antd";
import {
  RobotOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import Layout from "../components/Layout";
import { useBot } from "../context/BotContext";

const Dashboard = () => {
  const { bots, fetchUsersBots } = useBot();

  useEffect(() => {
    fetchUsersBots();
  }, []);

  const stats = [
    {
      title: "Total Bots",
      value: bots?.length,
      icon: <RobotOutlined className="text-blue-500 text-2xl" />,
    },
    {
      title: "Active Bots",
      value: bots?.filter((bot) => bot.status === "active").length,
      icon: <ThunderboltOutlined className="text-green-500 text-2xl" />,
    },
    {
      title: "Completed Chats",
      value: 1234,
      icon: <CheckCircleOutlined className="text-purple-500 text-2xl" />,
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold mb-6">Dashboard Overview</h2>
        <Row gutter={[16, 16]}>
          {stats.map((stat, index) => (
            <Col xs={24} sm={8} key={index}>
              <Card className="hover:shadow-lg transition-shadow">
                <div className="flex items-center space-x-4">
                  {stat.icon}
                  <Statistic title={stat.title} value={stat.value} />
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </Layout>
  );
};

export default Dashboard;
