import React, {useEffect, useRef} from 'react';
import L from 'leaflet';

// Receives markers from DataComponent.js.
// Displays markers on the map without managing state.

const defaultIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',  // Default marker URL
    iconSize: [25, 41],  // Size of the marker
    iconAnchor: [12, 41],  // Anchor point of the marker
    popupAnchor: [0, -41],  // Position of the popup relative to the marker
});

const MapComponent = ({ markers, markerLimit }) => {
    const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_API_TOKEN;
    const MAPBOX_USERNAME = process.env.REACT_APP_MAPBOX_USER;
    const MAPBOX_STYLE_ID = process.env.REACT_APP_MAPBOX_STYLE_ID;
    const mapContainer = useRef(null);
    const mapRef = useRef(null);
    const markersRef = useRef([]); // Keep track of markers without triggering re-renders


    useEffect(() => {
        if (!mapContainer.current) return;

        // Prevent reinitializing the map
        if (mapRef.current) return;

        // Initialize the map when the component mounts
        mapRef.current = L.map(mapContainer.current, {
            center: [40.4406, -79.9959],
            zoom: 2,
            worldCopyJump: true,
            preferCanvas: true,
            zoomControl: false,
        });

        // Set the tile layer (you can use a free provider like OpenStreetMap or any other)
        L.tileLayer(`https://api.mapbox.com/styles/v1/${MAPBOX_USERNAME}/${MAPBOX_STYLE_ID}/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}&fresh=true`, {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(mapRef.current);

        const sidebarElement = document.getElementById("sidebar");
        if (sidebarElement) {
            L.control.sidebar({
                autopan: true,
                closeButton: true,
                container: "sidebar",
                position: "left",
            }).addTo(mapRef.current);
        } else {
            console.error("Sidebar element not found");
        }

        // Cleanup function to remove the map when the component unmounts
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);  // Empty dependency array to run only once on mount


    useEffect(() => {
        if (!mapRef.current || !markers) return;

        const currentMarkerCount = markersRef.current.length;

        if (markerLimit > currentMarkerCount) {
            // Add only the additional markers needed
            markers.slice(currentMarkerCount, markerLimit).forEach(({ wikidata_id, name, birth_latitude, birth_longitude }) => {
                const marker = L.marker([birth_latitude, birth_longitude], {
                    icon: defaultIcon
                }).addTo(mapRef.current).bindPopup(name);
                markersRef.current.push(marker);
            });
        } else if (markerLimit < currentMarkerCount) {
            // Remove excess markers
            markersRef.current.slice(markerLimit).forEach(marker => marker.remove());
            markersRef.current = markersRef.current.slice(0, markerLimit);
        }
        else if (markerLimit === currentMarkerCount && markers.length !== currentMarkerCount) {
            // Filter changed: remove all and remap
            markersRef.current.forEach(marker => marker.remove());
            markersRef.current = [];

            markers.slice(0, markerLimit).forEach(({ wikidata_id, name, birth_latitude, birth_longitude }) => {
                const marker = L.marker([birth_latitude, birth_longitude], {
                    key: wikidata_id,
                    icon: defaultIcon
                }).addTo(mapRef.current).bindPopup(name);
                markersRef.current.push(marker);
            });
        }
    }, [markers, markerLimit]); // Only update when markers or markerLimit change

    return <div ref={mapContainer} id="map" className="map-container"></div>;
};

export default MapComponent;
