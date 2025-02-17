import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { AuthContext } from "./AuthContext";
import MapComponent from "./MapComponent";

const DataComponent = () => {
    const { token } = useContext(AuthContext);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;


    useEffect(() => {
        if (!token) return; // Wait for the token to be set

        const fetchData = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/notablehumans/`, {
                    headers: { Authorization: `Token ${token}` },
                });

                setData(response.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token, API_BASE_URL]); // Runs when token is available

    if (loading) return <p>Loading data...</p>;
    if (error) return <p>Error: {error}</p>;

    return <MapComponent markers={data} />;
};

export default DataComponent;
