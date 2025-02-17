import React, {useEffect, useState, useRef} from 'react';
import L from 'leaflet';
import "leaflet/dist/leaflet.css";
import "leaflet-sidebar-v2/css/leaflet-sidebar.min.css";
import 'leaflet-sidebar-v2'; // Import the Sidebar JavaScript (This may be missing)
import '@fortawesome/fontawesome-free/css/all.min.css';
import SidebarComponent from "./SidebarComponent";
import DataComponent from "./DataComponent";

const defaultIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',  // Default marker URL
    iconSize: [25, 41],  // Size of the marker
    iconAnchor: [12, 41],  // Anchor point of the marker
    popupAnchor: [0, -41],  // Position of the popup relative to the marker
});

const MapComponent = () => {
    const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_API_TOKEN;
    const MAPBOX_USERNAME = process.env.REACT_APP_MAPBOX_USER;
    const MAPBOX_STYLE_ID = process.env.REACT_APP_MAPBOX_STYLE_ID;
    const markersRef = useRef([]); // Keeps track of markers without triggering re-renders
    const [markers, setMarkers] = useState([]); // Ensure markers state is initialized
    const [map, setMap] = useState([]);
    const mapContainer = useRef(null);
    const sidebarRef = useRef(null);
    const [sortField, setSortField] = useState("birth_year");
    const [sortOrder, setSortOrder] = useState("asc");
    const [markerLimit, setMarkerLimit] = useState(10); // Default limit is 10


    useEffect(() => {
         if (!mapContainer.current) return;

        // Initialize the map when the component mounts
        const mapInstance = L.map(mapContainer.current, {
            center: [40.4406, -79.9959],
            zoom: 5,
            worldCopyJump: true,
            preferCanvas: true,
            zoomControl: false,
        });

        // Set the tile layer (you can use a free provider like OpenStreetMap or any other)
        L.tileLayer(`https://api.mapbox.com/styles/v1/${MAPBOX_USERNAME}/${MAPBOX_STYLE_ID}/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}&fresh=true`, {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(mapInstance);

        const sidebarElement = document.getElementById("sidebar");
        if (sidebarElement) {
            sidebarRef.current = L.control.sidebar({
                autopan: true,
                closeButton: true,
                container: "sidebar",
                position: "left",
            }).addTo(mapInstance);
        } else {
            console.error("Sidebar element not found");
        }

        setMap(mapInstance);  // Save the map instance to state

        // Cleanup the map when the component is unmounted
        return () => mapInstance.remove();
    }, []);  // Empty dependency array to run only once on mount

    useEffect(() => {
        if (!map || !markers.length) return;

        // Remove old markers
        markersRef.current.forEach(marker => map.removeLayer(marker));
        markersRef.current = []; // Clear stored markers

        markers.forEach(({ wikidata_id, name, birth_latitude, birth_longitude }) => {
            const marker = L.marker([birth_latitude, birth_longitude], {
                key: wikidata_id,
                icon: defaultIcon
            }).addTo(map).bindPopup(name);

            markersRef.current.push(marker); // Store the new marker
        });

    }, [map, markers]);

    const handleDataFetched = (data) => {
        setMarkers(data.results);
    };

    const handleSortChange = (field, order) => {
        setSortField(field);
        setSortOrder(order);
    };

    const handleMarkerLimitChange = (newMarkerLimit) => {
        setMarkerLimit(newMarkerLimit);
    };

    return (
        <div className="map-wrapper">
            <SidebarComponent
                onSortChange={handleSortChange}
                onMarkerLimitChange={handleMarkerLimitChange}
                sortField={sortField}
                sortOrder={sortOrder}
                markers={markers}
            />

            <DataComponent
                handleDataFetched={handleDataFetched}
                sortField={sortField}
                sortOrder={sortOrder}
                markerLimit={markerLimit}
            />

            <div ref={mapContainer} className="map-container"></div>
        </div>
    );
};

export default MapComponent;
