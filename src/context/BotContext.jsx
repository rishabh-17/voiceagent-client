import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
const BotContext = createContext(null);
import { useAuth } from "../context/AuthContext";

export const BotProvider = ({ children }) => {
  const [bots, setBots] = useState([]);
  const { token } = useAuth();
  const [ttsConfig, setTtsConfig] = useState({});

  const axiosInstance = axios.create({
    baseURL: "https://voiceagent-server-5cvu.onrender.com/api",
    headers: { Authorization: `Bearer ${token}` },
  });

  const addBot = (data) => {
    return axiosInstance.post("/bots/create-bot", data);
  };

  const updateBot = (id, updatedBot) => {};

  const deleteBot = (id) => {};

  const fetchTtsConfig = () => {
    return axiosInstance
      .get("/bots/tts-config")
      .then((res) => setTtsConfig(res.data));
  };

  const fetchUsersBots = () => {
    return axiosInstance.get("/bots/get-bots-by-user").then((res) => {
      console.log(res.data);
      setBots(res.data);
      return res;
    });
  };

  return (
    <BotContext.Provider
      value={{
        bots,
        addBot,
        updateBot,
        deleteBot,
        fetchTtsConfig,
        ttsConfig,
        fetchUsersBots,
      }}
    >
      {children}
    </BotContext.Provider>
  );
};

export const useBot = () => useContext(BotContext);
