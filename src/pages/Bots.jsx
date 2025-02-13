import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  message,
  Typography,
  Alert,
} from "antd";
import { useNavigate } from "react-router-dom";
import {
  PlusOutlined,
  MessageOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import Layout from "../components/Layout";
import { useBot } from "../context/BotContext";
const { Title, Text } = Typography;
const Bots = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingBot, setEditingBot] = useState(null);
  const [provider, setProvider] = useState(null);
  const [error, setError] = useState(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const {
    bots,
    addBot,
    updateBot,
    deleteBot,
    fetchTtsConfig,
    ttsConfig,
    fetchUsersBots,
  } = useBot();

  useEffect(() => {
    fetchTtsConfig();
    fetchUsersBots();
  }, []);

  const showModal = (bot = null) => {
    setEditingBot(bot);
    if (bot) {
      form.setFieldsValue(bot);
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      console.log(values);
      if (editingBot) {
        updateBot(editingBot.id, values).then(() => {
          fetchUsersBots();
        });
        message.success("Bot updated successfully!");
      } else {
        addBot(values).then(() => {
          fetchUsersBots();
        });
        message.success("Bot added successfully!");
      }
      setIsModalVisible(false);
      form.resetFields();
    });
  };

  const handleDelete = (id) => {
    deleteBot(id);
    message.success("Bot deleted successfully!");
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Personality",
      dataIndex: "personality",
      key: "personality",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            icon={<MessageOutlined />}
            onClick={() => {
              localStorage.setItem("selectedBot", record.name);
              navigate("/bot/" + record._id);
            }}
            type="link"
          />
          <Button
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record._id)}
            type="link"
            danger
          />
        </Space>
      ),
    },
  ];
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">My Bots</h2>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal()}
            className="bg-blue-600"
          >
            Add Bot
          </Button>
        </div>
        {console.log(bots)}
        <Table
          columns={columns}
          dataSource={bots?.map((bot) => ({ ...bot, key: bot._id }))} // Ensure unique keys
          rowKey="_id"
          className="shadow-sm"
        />

        <Modal
          title={editingBot ? "Edit Bot" : "Add New Bot"}
          open={isModalVisible}
          onOk={handleSubmit}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
        >
          <div className="p-6 bg-white rounded-lg max-w-lg mx-auto">
            {error && (
              <Alert message={error} type="error" showIcon className="mb-4" />
            )}

            <Form form={form} layout="vertical">
              <Form.Item
                name="name"
                label="Agent Name"
                rules={[
                  { required: true, message: "Please input agent name!" },
                ]}
              >
                <Input placeholder="Enter agent name" />
              </Form.Item>

              <Form.Item name="description" label="Description">
                <Input.TextArea rows={2} placeholder="Enter description" />
              </Form.Item>

              <Form.Item
                name="personality"
                label="Personality"
                rules={[
                  {
                    required: true,
                    message: "Please describe the agent's personality!",
                  },
                ]}
              >
                <Input.TextArea
                  rows={4}
                  placeholder="Describe the agent's personality and behavior"
                />
              </Form.Item>

              <Form.Item
                name="provider"
                label="Provider"
                rules={[
                  { required: true, message: "Please select a provider!" },
                ]}
              >
                <Select
                  placeholder="Select a provider"
                  onChange={(e) => {
                    form.setFieldsValue({ voice: undefined });
                    console.log(e);
                    setProvider(e);
                  }} // Reset voice when provider changes
                >
                  {Object.keys(ttsConfig || {}).map((provider) => (
                    <Select.Option key={provider} value={provider}>
                      {provider}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              {provider && (
                <Form.Item
                  name="voice"
                  label="Voice"
                  rules={[
                    { required: true, message: "Please select a voice!" },
                  ]}
                >
                  <Select placeholder="Select a voice">
                    {ttsConfig?.[form.getFieldValue("provider")]?.voices?.map(
                      (voice) => (
                        <Select.Option key={voice.id} value={voice.id}>
                          {voice.name}
                        </Select.Option>
                      )
                    )}
                  </Select>
                </Form.Item>
              )}

              <div className="mt-4 flex gap-3 justify-end">
                <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
                <Button type="primary" onClick={handleSubmit}>
                  Create Agent
                </Button>
              </div>
            </Form>
          </div>
        </Modal>
      </div>
    </Layout>
  );
};

export default Bots;
