import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MapComponent from './components/MapComponent';


const App = () => {
  const username = process.env.REACT_APP_API_USERNAME;
  const password = process.env.REACT_APP_API_PASSWORD;
  const [notableHumans, setNotableHumans] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('auth_token'));  // Token stored in localStorage
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Use useEffect to fetch data from the API after the component mounts
  useEffect(() => {
    if (token) {
      // Attempt to fetch the data if the token exists
      axios
        .get("http://127.0.0.1:8000/api/notablehumans/", {
          headers: {
            Authorization: `Token ${token}`,
          },
        })
        .then((response) => {
          // console.log("Data received from API:", response.data);
          setNotableHumans(response.data);
          setIsAuthenticated(true);
        })
        .catch((error) => {
          console.error("Authentication failed:", error);
          setIsAuthenticated(false);
        });
    }
  }, [token]); // Dependency on token, to re-run when it changes

  const handleLogin = (username, password) => {
    // Handle login (you would have an endpoint that returns a token)
    axios
      .post("http://127.0.0.1:8000/api/auth-token/", {
        username: username,
        password: password,
      })
      .then((response) => {
        const { token } = response.data;
        setToken(token);  // Save token in state and localStorage
        localStorage.setItem('auth_token', token);  // Persist token in localStorage
      })
      .catch((error) => {
        console.error("Login failed:", error);
      });
  };

  return (
    <div>
      {!isAuthenticated ? (
        <div>
          <h2>Login</h2>
          <button onClick={() => handleLogin(username, password)}>
            Login
          </button>
        </div>
      ) : (
        <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
          <header style={{ background: "#fff", padding: "10px", zIndex: 1 }}>
            <h1>Notable Humans Map</h1>
          </header>

          {/* MapComponent takes the remaining space in the viewport */}
          <MapComponent notableHumans={notableHumans} />
        </div>
      )}
    </div>
  );
};

export default App;
