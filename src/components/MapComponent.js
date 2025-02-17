import React, {useEffect, useState, useRef} from 'react';
import L from 'leaflet';
import "leaflet/dist/leaflet.css";
import SidebarComponent from "./SidebarComponent";

const defaultIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',  // Default marker URL
    iconSize: [25, 41],  // Size of the marker
    iconAnchor: [12, 41],  // Anchor point of the marker
    popupAnchor: [0, -41],  // Position of the popup relative to the marker
});

const MapComponent = ( {markers} ) => {
    const mapContainer = useRef(null);  // Use ref to get map container elemen
    const [map, setMap] = useState(null); // State to store the map instance
    const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_API_TOKEN;
    const MAPBOX_USERNAME = process.env.REACT_APP_MAPBOX_USER;
    const MAPBOX_STYLE_ID = process.env.REACT_APP_MAPBOX_STYLE_ID;

    useEffect(() => {
         if (!mapContainer.current) return;

        // Initialize the map when the component mounts
        const mapInstance = L.map(mapContainer.current, {
            center: [40.4406, -79.9959], // Default to Pittsburgh (Change as needed)*/}
            zoom: 13,
            worldCopyJump: true,
            preferCanvas: true,
            zoomControl: false,
        });

        // Set the tile layer (you can use a free provider like OpenStreetMap or any other)
        L.tileLayer(`https://api.mapbox.com/styles/v1/${MAPBOX_USERNAME}/${MAPBOX_STYLE_ID}/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}&fresh=true`, {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(mapInstance);

        setMap(mapInstance); // Store the map instance in state

        // Cleanup the map when the component is unmounted
        return () => mapInstance.remove();
    }, [MAPBOX_STYLE_ID, MAPBOX_TOKEN, MAPBOX_USERNAME]);

    useEffect(() => {
        if (!map || !markers) return;
        markers.results.forEach(({ wikidata_id, name, birth_latitude, birth_longitude }) => {
            L.marker([birth_latitude, birth_longitude], {
                key: wikidata_id,
                icon: defaultIcon
            }).addTo(map).bindPopup(name);
        });
    }, [map, markers]);

    return (
        <div className="map-wrapper">
            <div id="sidebar" className="leaflet-sidebar collapsed"></div>
            <div ref={mapContainer} className="map-container"></div>
            {/*Sidebar Container */}
            {map && <SidebarComponent map={map} />}
        </div>
    );
};

export default MapComponent;
