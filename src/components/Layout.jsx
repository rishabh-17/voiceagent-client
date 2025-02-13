import { Layout as AntLayout, Menu } from "antd";
import { useNavigate } from "react-router-dom";
import {
  DashboardOutlined,
  RobotOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";

const { Header, Sider, Content } = AntLayout;

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const menuItems = [
    {
      key: "dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
      onClick: () => navigate("/dashboard"),
    },
    {
      key: "bots",
      icon: <RobotOutlined />,
      label: "My Bots",
      onClick: () => navigate("/bots"),
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      onClick: logout,
    },
  ];

  return (
    <AntLayout className="min-h-screen">
      <Sider theme="light" className="shadow-lg">
        <div className="p-4 text-xl font-bold text-center text-blue-600">
          JustTalk
        </div>
        <Menu mode="inline" items={menuItems} />
      </Sider>
      <AntLayout>
        <Header className="bg-white shadow px-8 flex items-center">
          <h1 className="text-xl font-semibold text-gray-800">Welcome!</h1>
        </Header>
        <Content className="m-6 p-6 bg-white rounded-lg">{children}</Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
