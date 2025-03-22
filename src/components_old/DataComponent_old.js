import React, { useContext, useState, useRef, useEffect } from "react";
import axios from "axios";
import { AuthContext } from "../components/AuthContext";
import SidebarComponent from "./SidebarComponent";
import MapComponent from "./MapComponent"
import "leaflet/dist/leaflet.css";
import "leaflet-sidebar-v2/css/leaflet-sidebar.min.css";
import 'leaflet-sidebar-v2';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';


// Handles fetching data from Django, including pagination.
// Stores markers in state and updates them.
// Passes markers to MapComponent.
// Listens for sorting and filter changes from SidebarComponent.

const DataComponent = () => {
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
    const { token } = useContext(AuthContext);

    const mapRef = useRef(null);

    const [allMarkers, setAllMarkers] = useState([]);
    const [sortedHumans, setSortedHumans] = useState([]); // Sorted sidebar list
    const [sortField, setSortField] = useState("birth_year");

    const loadingPageRef = useRef(false);  // Use ref for loading state to prevent re-renders
    const [isLoading, setIsLoading] = useState(false); // Track loading state
    const currentPage = useRef(1); // Ref to keep track of the current page
    const abortControllerRef = useRef(null); // Store latest AbortController

    const fetchData = async (resetRequest = false) => {
        if (loadingPageRef.current) return; // Avoid multiple requests

        console.log("Reset Request:", resetRequest);

        if (resetRequest) {
            setAllMarkers([]); // Clear existing markers
            currentPage.current = 1; // Reset pagination

            // Cancel any ongoing request
            if (abortControllerRef.current) {
                console.log("Aborting previous request...");
                abortControllerRef.current.abort();
            }

            // Create a new abort controller
            abortControllerRef.current = new AbortController();
        }

        const localAbortController = abortControllerRef.current; // Store reference
        const { signal } = localAbortController;

        loadingPageRef.current = true;
        setIsLoading(true); // Set loading state to true

        try {
            const response = await axios.get(`${API_BASE_URL}/notablehumans/`, {
                headers: { Authorization: `Token ${token}` },
                params: {
                    page: currentPage.current,
                    sort_by: sortField,
                },
                signal,
            });

            // Ignore outdated requests
            if (localAbortController !== abortControllerRef.current) {
                console.log("Ignoring outdated response");
                return;
            }

            setAllMarkers((prevMarkers) => [...prevMarkers, ...response.data.results]);

            if (response.data.next !== null) {
                currentPage.current += 1; // Increment page only if there are more pages

                setTimeout(() => {
                    if (localAbortController === abortControllerRef.current) {
                        fetchData(false);
                    } else {
                        console.log("Skipping delayed fetchData due to request cancellation.");
                    }
                }, 1000); // Delay next page fetch
            } else{
                setIsLoading(false)
            }
        } catch (error) {
            if (error.name === "AbortError") {
                console.log("Request was aborted:", error.message);
            } else {
                console.error("Error fetching data:", error);
            }
        } finally {
            loadingPageRef.current = false;
        }
    };

    // Fetch data when filters change (reset previous markers)
    useEffect(() => {
        console.log("TRIGGERED!")
        if (token) {
            fetchData(true); // Reset data when filters change
        }
    }, [token]);

    useEffect(() => {
        let sorted;
        if (isLoading) {
            sorted = allMarkers;
        } // Don't sort while loading
        else {
            console.log("sorting!")
             // Clone and sort the list locally
            sorted = [...allMarkers].sort((a, b) => {
                let valueA = a[sortField];
                let valueB = b[sortField];

                if (valueA == null) return 1; // Handle null values
                if (valueB == null) return -1;

                if (typeof valueA === "string") valueA = valueA.toLowerCase();
                if (typeof valueB === "string") valueB = valueB.toLowerCase();

                return valueA - valueB;
            });
        }

        setSortedHumans(sorted);

    }, [sortField, allMarkers, isLoading]);

    return (
        <div className="map-wrapper">
            <SidebarComponent
                isLoading={isLoading}
                sortField={sortField}
                setSortField={setSortField}
                sortedMarkers={sortedHumans}
                zoomToMarker={handleMarkerClick}
            />

            <MapComponent
                mapRef={mapRef}
                markers={allMarkers}
            />
        </div>
    );
};

export default DataComponent;
