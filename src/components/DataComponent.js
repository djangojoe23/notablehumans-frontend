import React, { useContext, useState, useRef, useEffect } from "react";
import axios from "axios";
import { AuthContext } from "./AuthContext";
import SidebarComponent from "./SidebarComponent";
import MapComponent from "./MapComponent"
import "leaflet/dist/leaflet.css";
import "leaflet-sidebar-v2/css/leaflet-sidebar.min.css";
import 'leaflet-sidebar-v2';


// Handles fetching data from Django, including pagination.
// Stores markers in state and updates them.
// Passes markers to MapComponent.
// Listens for sorting and limit changes from SidebarComponent.

const DataComponent = () => {
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
    const { token } = useContext(AuthContext);

    const [allMarkers, setAllMarkers] = useState([]);
    const [sortField, setSortField] = useState("birth_year");
    const [sortOrder, setSortOrder] = useState("asc");
    const [markerLimit, setMarkerLimit] = useState(100);

    const loadingRef = useRef(false);  // Use ref for loading state to prevent re-renders
    const currentPage = useRef(1); // Ref to keep track of the current page
    const cancelTokenRef = useRef(null); // Store Axios cancel token


    const fetchData = async ( resetRequest = false) => {
        if (loadingRef.current) return;  // Avoid sending multiple requests

        if (resetRequest){
            setAllMarkers([]); // Clear existing markers
            currentPage.current = 1; // Reset pagination

            // Cancel any ongoing request
            if (cancelTokenRef.current) {
                cancelTokenRef.current.cancel("Request canceled due to filter change.");
            }

            // Create a new cancel token for this fetch cycle
            cancelTokenRef.current = axios.CancelToken.source();
        }

        loadingRef.current = true;
        try {
            const response = await axios.get(`${API_BASE_URL}/notablehumans/`, {
                headers: { Authorization: `Token ${token}` },
                params: {
                    page: currentPage.current,
                    sort_by: sortField,
                    sort_order: sortOrder,
                },
                cancelToken: cancelTokenRef.current.token, // Attach cancel token
            });

            setAllMarkers((prevMarkers) => [...prevMarkers, ...response.data.results]);
            if (response.data.next !== null) {
                currentPage.current += 1 // Increment page only if there are more pages
                setTimeout(() => fetchData(false), 2000); // Delay next page fetch
            }
        } catch (error) {
            if (axios.isCancel(error)) {
                console.log("Request canceled:", error.message);
            } else {
                console.error("Error fetching data:", error);
            }
        }
        loadingRef.current = false;
    };

    // Fetch data when filters change (reset previous markers)
    useEffect(() => {
        if (token) {
            fetchData(true); // Reset data when filters change
        }
    }, [token, sortField, sortOrder]);

    return (
        <div className="map-wrapper">
            <SidebarComponent
                sortField={sortField}
                setSortField={setSortField}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                markerLimit={markerLimit}
                setMarkerLimit={setMarkerLimit}
                markers={allMarkers}
            />

            <MapComponent markers={allMarkers} markerLimit={markerLimit} />
        </div>
    );
};

export default DataComponent;
