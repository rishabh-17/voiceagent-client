import React, { useState, useEffect, useRef } from "react";

const SpeechRecognitionComponent = () => {
  const [isListening, setIsListening] = useState(false);
  const [text, setText] = useState("");
  const recognitionRef = useRef(null);
  const silenceTimer = useRef(null);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Your browser does not support speech recognition.");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => console.log("Listening started...");
    recognition.onerror = (event) => console.error("Error:", event.error);
    recognition.onend = () => {
      if (isListening) {
        recognition.start();
      }
    };

    recognition.onresult = (event) => {
      clearTimeout(silenceTimer.current); 
      let newText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        newText += event.results[i][0].transcript + " ";
      }
      setText(newText.trim());

      silenceTimer.current = setTimeout(() => stopListening(), 1000);
    };

    recognitionRef.current = recognition;
  }, [isListening]);

  const startListening = () => {
    if (recognitionRef.current) {
      setText("");
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      setIsListening(false);
      recognitionRef.current.stop();
      clearTimeout(silenceTimer.current);
    }
  };

  return (
    <div className="p-4 text-center">
      <button
        onClick={startListening}
        disabled={isListening}
        className="bg-green-500 text-white px-4 py-2 rounded mr-2"
      >
        Start
      </button>
      <button
        onClick={stopListening}
        disabled={!isListening}
        className="bg-red-500 text-white px-4 py-2 rounded"
      >
        Stop
      </button>
      <div className="mt-4 p-2 border border-gray-300 rounded">
        <strong>Transcribed Text:</strong>
        <p className="text-gray-700">{text || "Start speaking..."}</p>
      </div>
    </div>
  );
};

export default SpeechRecognitionComponent;
