import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthProvider';

const useHumansData = () => {
  const { token, loading } = useContext(AuthContext);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const [allHumans, setAllHumans] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (loading) return; // Wait until the token has been fetched

    if (!token) {
      // Optionally, you can set an error state here if token is required
      setError(new Error("Token not available"));
      setDataLoading(false);
      return;
    }

    const source = axios.CancelToken.source();
    axios.get(`${API_BASE_URL}/notablehumans/`, {
      headers: { Authorization: `Token ${token}` },
      cancelToken: source.token,
    })
      .then((response) => {
        setAllHumans(response.data);
        setDataLoading(false);
      })
      .catch((err) => {
        if (!axios.isCancel(err)) {
          console.error("Error fetching data:", err);
          setError(err);
          setDataLoading(false);
        }
      });

    return () => {
      source.cancel("Component unmounted, request cancelled.");
    };
  }, [token, loading, API_BASE_URL]);

  return { allHumans, loading: dataLoading, error };
};

export default useHumansData;
