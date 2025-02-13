import { createContext, useContext, useState } from "react";
import axios from "axios";
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));

  const axiosInstance = axios.create({
    baseURL: "https://voiceagent-server-5cvu.onrender.com/api",
    headers: { Authorization: `Bearer ${token}` },
  });

  const login = (userData) => {
    return axios
      .post(
        "https://voiceagent-server-5cvu.onrender.com/api/auth/login",
        userData
      )
      .then((res) => {
        localStorage.setItem("token", res.data.token);
        setToken(res.data.token);
        console.log(res.data);
        return res.data;
      })
      .catch((err) => console.log(err));
  };

  const signup = (userData) => {
    return axios
      .post(
        "https://voiceagent-server-5cvu.onrender.com/api/auth/signup",
        userData
      )
      .then((res) => {
        setToken(res.data.token);
        localStorage.setItem("token", res.data.token);

        console.log(res.data);
        return res.data;
      });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
