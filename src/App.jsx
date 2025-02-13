import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider } from "antd";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Bots from "./pages/Bots";
import Chat from "./pages/Chat";
import { AuthProvider } from "./context/AuthContext";
import { BotProvider } from "./context/BotContext";
import { useAuth } from "./context/AuthContext";

const PrivateRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#2563eb",
        },
      }}
    >
      <BrowserRouter>
        <AuthProvider>
          <BotProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/bots"
                element={
                  <PrivateRoute>
                    <Bots />
                  </PrivateRoute>
                }
              />
              <Route
                path="/bot/:id"
                element={
                  <PrivateRoute>
                    <Chat />
                  </PrivateRoute>
                }
              />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </BotProvider>
        </AuthProvider>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
