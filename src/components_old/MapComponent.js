import React, {useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';

// Receives markers from DataComponent.js.
// Displays markers on the map without managing state.

const defaultIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',  // Default marker URL
    iconSize: [25, 41],  // Size of the marker
    iconAnchor: [12, 41],  // Anchor point of the marker
    popupAnchor: [0, -41],  // Position of the popup relative to the marker
});

const MapComponent = ({ mapRef, sidebarRef, clusterGroup, markersById, allHumans, searchQuery }) => {
    const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_API_TOKEN;
    const MAPBOX_USERNAME = process.env.REACT_APP_MAPBOX_USER;
    const MAPBOX_STYLE_ID = process.env.REACT_APP_MAPBOX_STYLE_ID;
    const mapContainer = useRef(null);


    useEffect(() => {
        if (!mapContainer.current || mapRef.current) return;

        // Initialize the map when the component mounts
        mapRef.current = L.map(mapContainer.current, {
            center: [40.4406, -79.9959],
            zoom: 2,
            worldCopyJump: true,
            preferCanvas: true,
            zoomControl: false,
            zoomAnimation: true,
            markerZoomAnimation: true,
        });

        // Set the tile layer (you can use a free provider like OpenStreetMap or any other)
        L.tileLayer(`https://api.mapbox.com/styles/v1/${MAPBOX_USERNAME}/${MAPBOX_STYLE_ID}/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`, {
            maxZoom: 18,
            minZoom: 2,
            keepBuffer: 16, // Cache more tiles before they are needed
            accessToken: MAPBOX_TOKEN
        }).addTo(mapRef.current);

        const sidebarElement = document.getElementById("sidebar");
        if (sidebarElement) {

            sidebarRef.current = L.control.sidebar({
                autopan: true,
                closeButton: true,
                container: "sidebar",
                position: "left",
            }).addTo(mapRef.current);
            sidebarRef.current.open('filtersort')
        } else {
            console.error("Sidebar element not found");
        }

        if (!clusterGroup.current) {
          clusterGroup.current = L.markerClusterGroup();
          mapRef.current.addLayer(clusterGroup.current);
        }

    }, []);  // Empty dependency array to run only once on mount


    useEffect(() => {
        if (!mapRef.current || !clusterGroup.current || !allHumans) return;

        clusterGroup.current.clearLayers();
        markersById.current={};

        // Filter humans based on search query (case-insensitive)
        const filteredHumans = allHumans.filter(human =>
          human.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        // Clear existing markers before adding new ones
        clusterGroup.current.clearLayers();

        // Add markers to cluster group
        filteredHumans.forEach((human) => {
            let coords;
            if (human.birth_place && human.birth_place.latitude && human.birth_place.longitude){
                coords = [human.birth_place.latitude, human.birth_place.longitude]
            }
            if (!coords) return;
            const marker = L.marker(coords, { icon: defaultIcon }).bindPopup(human.name);

            markersById.current[human.wikidata_id] = marker;
            clusterGroup.current.addLayer(marker);
        });

    }, [allHumans, searchQuery]);


    return <div ref={mapContainer} id="map" className="map-container"></div>;
};

export default MapComponent;
