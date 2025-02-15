import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import MapComponent from './components/MapComponent';


const App = () => {
  const username = process.env.REACT_APP_API_USERNAME;
  const password = process.env.REACT_APP_API_PASSWORD;
  const api_base_url = process.env.REACT_APP_API_BASE_URL;

  const [token, setToken] = useState(localStorage.getItem('auth_token'));  // Token stored in localStorage
  const [notableHumans, setNotableHumans] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingPage, setLoadingPage] = useState(1); // Loading state

  // Auto-login function
  const autoAuthenticate = useCallback (() => {
    console.log("Attempting auto-login...");

    if(!token){
      // If there's no token, attempt login using username/password
      axios.post(`${api_base_url}/auth-token/`, {
          username: username,
          password: password,
        }).then((response) => {
        const { token } = response.data;
        setToken(token);
        localStorage.setItem('auth_token', token);
        setIsAuthenticated(true);  // Set authenticated state to true
      })
      .catch((error) => {
        console.error("Login failed:", error);
        setIsAuthenticated(false);  // Set authenticated state to true
      });
    } else {
      // If a token exists, validate it
      axios
        .post(`${api_base_url}/auth-token/verify/`, { token })
        .then((response) => {
          console.log("Token valid, user authenticated.");
          setIsAuthenticated(true);  // Token is valid, authenticated
        })
        .catch((error) => {
          console.error("Token invalid or expired, re-authenticating...");
          // If token validation fails, try to re-login
          axios
            .post(`${api_base_url}/auth-token/`, {
              username: username,
              password: password,
            })
            .then((response) => {
              const { token } = response.data;
              setToken(token);
              localStorage.setItem('auth_token', token);
              setIsAuthenticated(true);  // Successfully authenticated
            })
            .catch((error) => {
              console.error("Re-login failed:", error);
              setIsAuthenticated(false);  // Authentication failed, not authenticated
            });
        });
    }
  }, [api_base_url, username, password, token]);

  // Fetch paginated notable humans
  const fetchNotableHumans = useCallback (() => {
    console.log("Fetching notable humans...");

    if (!token) {
      console.error("No token found, skipping API request.");
      return;
    }

    // Delay between API calls to avoid overwhelming the server (e.g., 1 second)
    const delay = 1000; // 1000ms = 1 second

    axios.get(`${api_base_url}/notablehumans?page=${loadingPage}`, {
      headers: { Authorization: `Token ${token}` },
    }).then((response) => {
      setNotableHumans((prevData) => [
        ...prevData,
        ...response.data.results,
      ]);
      if (response.data.next) {
        setTimeout(() => {
          setLoadingPage((prevPage) => prevPage + 1);
        }, delay);  // Introducing delay before requesting the next page
      }
    })
    .catch((error) => {
      console.error("Failed to fetch humans:", error);
    });
  }, [loadingPage, token, api_base_url]);

  // Then use them in your useEffect
  useEffect(() => {
    console.log("Automatically Authenticating");
    if(!token || !isAuthenticated){
         autoAuthenticate();
    }
  }, [token, isAuthenticated, autoAuthenticate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotableHumans();
    }
  }, [isAuthenticated, token, fetchNotableHumans]);


  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
        <header style={{ background: "#fff", padding: "10px", zIndex: 1 }}>
          <h1>Notable Humans Map</h1>
        </header>

        {isAuthenticated ? (
          <MapComponent notableHumans={notableHumans} />
        ) : (
          <p>Loading page {loadingPage}...</p>
        )}
    </div>
  );
};

export default App;
