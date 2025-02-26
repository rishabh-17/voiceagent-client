import { useState, useEffect, useRef } from "react";
import { Button, Avatar } from "antd";
import { AudioOutlined, StopOutlined } from "@ant-design/icons";
import Layout from "../components/Layout";
import io from "socket.io-client";
import { useParams } from "react-router-dom";

const ChatUI = () => {
  const { id } = useParams();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([
    { text: "Hello! How can I help you?", sender: "bot", question: "" },
  ]);
  const [listening, setListening] = useState(false);
  const [audioQueue, setAudioQueue] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const currentQuestionRef = useRef("");
  const audioRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioStoppedRef = useRef(false); // Track if user clicked "Stop"

  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to server");
      newSocket.emit("join", id);
    });

    newSocket.on("botMessage", (botMessage) => {
      if (
        botMessage.question.trim() === currentQuestionRef.current.trim() &&
        botMessage.audio &&
        !audioStoppedRef.current
      ) {
        setMessages((prev) => {
          const existingMessage = prev.find(
            (m) => m.question === botMessage.question
          );
          if (!existingMessage) {
            return [
              ...prev,
              {
                text: botMessage.botMessage,
                sender: "bot",
                question: botMessage.question,
              },
            ];
          }
          return prev.map((m) =>
            m.question === botMessage.question
              ? { ...m, text: m.text + `\n${botMessage.botMessage}` }
              : m
          );
        });

        // **Only play audio if audioStoppedRef is false**
        if (botMessage.audio && !audioStoppedRef.current) {
          setAudioQueue((prevQueue) => [...prevQueue, botMessage.audio]);
        }
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [id]);

  useEffect(() => {
    if (!isPlaying && audioQueue.length > 0) {
      playAudio(audioQueue[0]);
      setAudioQueue((prevQueue) => prevQueue.slice(1));
    }
  }, [audioQueue, isPlaying]);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.onended = null;

      if (audioRef.current.src.startsWith("blob:")) {
        URL.revokeObjectURL(audioRef.current.src);
      }

      audioRef.current.src = "";
      audioRef.current.load();
      audioRef.current = null;
    }

    setAudioQueue([]); // **Clear all queued audio**
    setIsPlaying(false);
  };

  const playAudio = async (audioData) => {
    setIsPlaying(true);
    try {
      const byteCharacters = atob(audioData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const audioBlob = new Blob([byteArray], { type: "audio/wav" });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audioRef.current = audio;
      audio
        .play()
        .then(() => {
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            setIsPlaying(false);
          };
        })
        .catch((error) => {
          console.error("Audio playback error:", error);
          setIsPlaying(false);
        });

      audio.onerror = () => {
        console.error("Error playing audio:", audioData);
        setIsPlaying(false);
      };
    } catch (error) {
      console.error("Audio processing error:", error);
      setIsPlaying(false);
    }
  };

  const startListening = () => {
    stopAudio(); // Ensure previous audio is stopped
    audioStoppedRef.current = false; // **Allow new audio to play**

    if (!recognitionRef.current) {
      recognitionRef.current = new (window.SpeechRecognition ||
        window.webkitSpeechRecognition)();
    }
    const recognition = recognitionRef.current;

    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
    };
    recognition.onend = () => {
      recognition.start();
    };
    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript || "hi how are you";
      currentQuestionRef.current = transcript;

      stopAudio();

      setMessages((prev) => [
        ...prev,
        { text: transcript, sender: "user", question: null },
        { text: "", sender: "bot", question: transcript },
      ]);
      if (socket) socket.emit("userMessage", transcript);
    };

    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null; // Prevent restarting
      recognitionRef.current.stop();
      setListening(false);
    }

    audioStoppedRef.current = true; // **Block future audio messages**
    stopAudio(); // **Immediately stop any ongoing audio**
  };

  return (
    <div className="flex flex-col h-screen border rounded-lg shadow-lg bg-white">
      <Layout>
        <h2 className="text-center mt-4 text-xl font-semibold">
          {localStorage.getItem("selectedBot") || "Chatbot"}
        </h2>

        <div className="flex-1 p-4 overflow-y-auto space-y-4 h-[65vh]">
          {messages.map((msg, index) => (
            <div
              key={index}
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
