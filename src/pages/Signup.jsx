import { Form, Input, Button, Card, message } from "antd";
import { UserOutlined, LockOutlined, MailOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const onFinish = (values) => {
    console.log("Received values:", values);
    // Simulate signup - In real app, make API call here
    signup(values).then(() => {
      message.success("Account created successfully!");
      navigate("/login");
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-8">
          Create an Account
        </h1>
        <Form name="signup" onFinish={onFinish} layout="vertical" size="large">
          <Form.Item
            name="username"
            rules={[{ required: true, message: "Please input your username!" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Username" />
          </Form.Item>
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Please input your email!" },
              { type: "email", message: "Please enter a valid email!" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Please confirm your password!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject("Passwords do not match!");
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm Password"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              className="bg-blue-600"
            >
              Sign up
            </Button>
          </Form.Item>
          <div className="text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600">
              Log in
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Signup;
