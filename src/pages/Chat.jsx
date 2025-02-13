import { useState, useEffect } from "react";
import { Button, Avatar } from "antd";
import { AudioOutlined, StopOutlined } from "@ant-design/icons";
import Layout from "../components/Layout";
import io from "socket.io-client";
import { useParams } from "react-router-dom";

const ChatUI = () => {
  const { id } = useParams();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! How can I help you?", sender: "bot" },
  ]);
  const [listening, setListening] = useState(false);
  let recognition;

  useEffect(() => {
    const socket = io("https://voiceagent-server-5cvu.onrender.com");
    setSocket(socket);
    socket.onopen = () => {
      console.log("WebSocket connection established.");
    };
    socket.on("connect", () => {
      console.log("Connected to server");
      socket.emit("join", id);
    });

    socket.on("botMessage", (botMessage) => {
      console.log(botMessage);
      setMessages((prev) => [
        ...prev,
        { id: prev.length + 1, text: botMessage?.botMessage, sender: "bot" },
      ]);
      var snd = new Audio("data:audio/wav;base64," + botMessage.audio);
      snd.play();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket) socket.emit("join", id);
  }, [socket]);

  const startListening = () => {
    recognition = new (window.SpeechRecognition ||
      window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = (event) =>
      console.error("Speech recognition error:", event);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const newMessage = {
        id: messages.length + 1,
        text: transcript,
        sender: "user",
      };
      setMessages((prev) => [...prev, newMessage]);
      console.log(`User said: ${transcript}`);
      // Send user message to server
      socket.emit("userMessage", transcript);
    };

    recognition.start();
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setListening(false);
    }
  };

  return (
    <div className="flex flex-col h-screen border rounded-lg shadow-lg bg-white">
      <Layout>
        <h2 className="text-center mt-4 text-xl font-semibold">
          {localStorage.getItem("selectedBot")}
        </h2>

        <div className="flex-1 p-4 overflow-y-auto space-y-4 h-[65vh]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.sender === "bot" && (
                <Avatar className="mr-2 bg-blue-600">B</Avatar>
              )}
              <div
                className={`p-3 rounded-lg max-w-xs text-white ${
                  msg.sender === "user" ? "bg-blue-500" : "bg-gray-700"
                }`}
              >
                {msg.text}
              </div>
              {msg.sender === "user" && (
                <Avatar className="ml-2 bg-green-500">U</Avatar>
              )}
            </div>
          ))}
        </div>

        <div className="p-3 mb-4 border-t flex w-full items-center space-x-2 bg-white">
          <div>
            <Button
              type="primary"
              icon={<AudioOutlined />}
              onClick={startListening}
              disabled={listening}
            >
              Start
            </Button>
            <Button
              type="danger"
              icon={<StopOutlined />}
              onClick={stopListening}
              disabled={!listening}
            >
              Stop
            </Button>
          </div>
        </div>
      </Layout>
    </div>
  );
};

export default ChatUI;
