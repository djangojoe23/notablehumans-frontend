// getNotableHumanData.js
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthProvider';

const convertToGeoJSON = (data) => ({
  type: 'FeatureCollection',
  features: data.map((person) => {
    const lng = person.birth_place?.longitude;
    const lat = person.birth_place?.latitude;
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      properties: { ...person, markerRadius: 10 },
    };
  }),
});

const useNotableHumanData = () => {
  const { token, loading } = useContext(AuthContext);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const [allHumans, setAllHumans] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (loading) return; // Wait until the token has been fetched

    if (!token) {
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
        // Convert to GeoJSON right here.
        setAllHumans(convertToGeoJSON(response.data));
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

export default useNotableHumanData;
