import { Form, Input, Button, Card, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const onFinish = (values) => {
    // Simulate login - In real app, make API call here
    login(values).then(() => {
      message.success("Login successful!");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-8">
          Login to Bot Dashboard
        </h1>
        <Form name="login" onFinish={onFinish} layout="vertical" size="large">
          <Form.Item
            name="email"
            rules={[{ required: true, message: "Please input your email!" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Email" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              className="bg-blue-600"
            >
              Log in
            </Button>
          </Form.Item>
          <div className="text-center">
            Don't have an account?{" "}
            <Link to="/signup" className="text-blue-600">
              Sign up
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
