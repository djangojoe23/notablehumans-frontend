import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const API_USERNAME = process.env.REACT_APP_API_USERNAME;
  const API_PASSWORD = process.env.REACT_APP_API_PASSWORD;

  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await axios.post(`${API_BASE_URL}/auth-token/`, {
          username: API_USERNAME,
          password: API_PASSWORD,
        });
        setToken(response.data.token);
      } catch (error) {
        console.error("Authentication failed", error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, [API_BASE_URL, API_USERNAME, API_PASSWORD]);

  return (
    <AuthContext.Provider value={{ token, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
