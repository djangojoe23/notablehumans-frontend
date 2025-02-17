import { useContext, useEffect } from "react";
import axios from "axios";
import { AuthContext } from "./AuthContext";

const DataComponent = ({ handleDataFetched, sortField, sortOrder, markerLimit } ) => {
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
    const { token } = useContext(AuthContext);


    useEffect(() => {
        if (!token) return; // Wait for the token to be set

        const fetchData = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/notablehumans/`, {
                    headers: { Authorization: `Token ${token}` },
                    params: {
                        sort_by: sortField,
                        order: sortOrder,
                        limit: markerLimit,
                    },
                });
                handleDataFetched(response.data);
            } catch (err) {
                console.error("Error fetching data:", err);
            }
        };

        fetchData();
    }, [token, API_BASE_URL, sortField, sortOrder, markerLimit]); // Runs when token is available

    return null;
};

export default DataComponent;
