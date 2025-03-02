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
  const recognitionRef = useRef(null);
  const audioStoppedRef = useRef(false);
  const [onGoingMsg, setOnGoingMsg] = useState("");
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const mediaStreamSourceRef = useRef(null);
  const gainNodeRef = useRef(null);
  const monitoringRef = useRef(true);

  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to server");
      newSocket.emit("join", id);
    });

    newSocket.on("botMessage", (botMessage) => {
      if (
        botMessage?.question?.trim() === currentQuestionRef?.current?.trim() &&
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

        setAudioQueue((prevQueue) => [...prevQueue, botMessage.audio]);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [id]);

  useEffect(() => {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    audioContextRef.current = audioContext;
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 1;
    gainNode.connect(audioContext.destination);
    gainNodeRef.current = gainNode;
    return () => {
      audioContext.close();
    };
  }, []);

  useEffect(() => {
    if (!isPlaying && audioQueue.length > 0) {
      playAudio(audioQueue[0]);
      setAudioQueue((prevQueue) => prevQueue.slice(1));
    }
  }, [audioQueue, isPlaying]);

  const playAudio = async (audioData) => {
    setIsPlaying(true);
    try {
      const byteCharacters = atob(audioData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const audioBuffer = await audioContextRef.current.decodeAudioData(
        byteArray.buffer
      );
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(gainNodeRef.current);
      source.start(0);
      source.onended = () => {
        source.disconnect();
        setIsPlaying(false);
      };
    } catch (error) {
      console.error("Audio playback error:", error);
      setIsPlaying(false);
    }
  };

  const startListening = async () => {
    audioStoppedRef.current = false;
    if (!recognitionRef.current) {
      recognitionRef.current = new (window.SpeechRecognition ||
        window.webkitSpeechRecognition)();
    }
    const recognition = recognitionRef.current;
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1,
        },
      });
      const audioContext = audioContextRef.current;
      const mediaStreamSource = audioContext.createMediaStreamSource(stream);
      mediaStreamSourceRef.current = mediaStreamSource;
      const analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 256;
      mediaStreamSource.connect(analyserNode);
      recognition.onstart = () => setListening(true);
      recognition.onspeechstart = () => {}; // Remove stopAudio, handle via ducking
      recognition.onend = () => recognition.start();
      recognition.onerror = (event) =>
        console.error("Speech recognition error:", event.error);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        stopAudio();
        setOnGoingMsg(transcript);
        if (event.results[0].isFinal) {
          currentQuestionRef.current = transcript;
          setOnGoingMsg("");
          setMessages((prev) => [
            ...prev,
            { text: transcript, sender: "user" },
            { text: "", sender: "bot", question: transcript },
          ]);
          if (socket) socket.emit("userMessage", transcript);
        }
      };
      recognition.start();
      const monitorLevel = () => {
        if (!monitoringRef.current) return;
        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserNode.getByteTimeDomainData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += Math.abs(dataArray[i] - 128);
        }
        const level = sum / bufferLength;
        const threshold = 50; // Adjust based on testing
        if (level > threshold) {
          gainNodeRef.current.gain.setTargetAtTime(
            0.1,
            audioContext.currentTime,
            0.1
          );
        } else {
          gainNodeRef.current.gain.setTargetAtTime(
            1,
            audioContext.currentTime,
            0.1
          );
        }
        requestAnimationFrame(monitorLevel);
      };
      monitorLevel();
    } catch (error) {
      console.error("Media device error:", error);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
    }
    audioStoppedRef.current = true;
    monitoringRef.current = false;
    if (mediaStreamSourceRef.current) {
      mediaStreamSourceRef.current.disconnect();
    }
  };

  // const stopListening = () => {
  //   if (recognitionRef.current) {
  //     recognitionRef.current.stop();
  //     setListening(false);
  //   }
  //   audioStoppedRef.current = true;
  //   stopAudio();
  // };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
      setIsPlaying(false);
    }
  };

  return (
    <div className="flex flex-col h-screen border rounded-lg shadow-lg bg-white">
      <Layout>
        <h2 className="text-center mt-4 text-xl font-semibold">
          {localStorage.getItem("selectedBot") || "Chatbot"}
        </h2>
        <div className="flex-1 p-4 overflow-y-auto space-y-4 h-[65vh]">
          {(onGoingMsg
            ? [...messages, { text: onGoingMsg, sender: "user" }]
            : messages
          ).map((msg, index) => (
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
      </Layout>
    </div>
  );
};

export default ChatUI;
