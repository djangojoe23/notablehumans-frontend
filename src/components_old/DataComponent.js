import React, { useContext, useState, useRef, useEffect } from "react";
import axios from "axios";
import { AuthContext } from "../components/AuthContext";
import SidebarComponent from "./SidebarComponent";
import MapComponent from "./MapComponent"
import "leaflet/dist/leaflet.css";
// import "leaflet-sidebar-v2/css/leaflet-sidebar.min.css";
import 'react-leaflet-sidebarv2/lib/react-leaflet-sidebarv2.css';
// import 'leaflet-sidebar-v2';
// import 'leaflet.markercluster/dist/MarkerCluster.css';
// import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

const DataComponent = () => {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const { token } = useContext(AuthContext);

  const mapRef = useRef(null);
  const sidebarRef = useRef(null);
  const clusterGroup = useRef(null);
  const markersById = useRef({});

  const [searchQuery, setSearchQuery] = useState("");

  const [allHumans, setAllHumans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from the Django API endpoint that serves the JSON
  useEffect(() => {
    if (token){
     axios.get(`${API_BASE_URL}/notablehumans/`, {
        headers: { Authorization: `Token ${token}` }
      })
      .then((response) => {
        setAllHumans(response.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        setError(err);
        setLoading(false);
      });
    }
  }, [token]);

  // Function to zoom to a specific marker
  const zoomToMarker = (wikidata_id) => {
    const marker = markersById.current[wikidata_id];
    if (marker && clusterGroup.current && mapRef.current) {
            // Get current map center and calculate distance to target marker
            const currentCenter = mapRef.current.getCenter();
            const targetLatLng = marker.getLatLng();
            const distance = mapRef.current.distance(currentCenter, targetLatLng)/1000; // in kilometers

            let duration = 9; // Base animation duration

            if (distance < 500) {
                duration = 2;
            }

            mapRef.current.flyTo(marker.getLatLng(), 13, {
                animate: true,
                duration: duration,
            });

            // Spiderfy and open popup after zooming in
            setTimeout(() => {
                const visibleParent = clusterGroup.current.getVisibleParent(marker);
                if (visibleParent && visibleParent !== marker && typeof visibleParent.spiderfy === 'function') {
                    visibleParent.spiderfy();
                }
                marker.openPopup();
            }, duration * 1000 + 500);
        }
    };

  if (loading) return <div>Loading data...</div>;
  if (error)
    return <div>Error loading data: {error.message || "Unknown error"}</div>;

  return (
        <div className="map-wrapper">
            <SidebarComponent
                sidebarRef={sidebarRef}
                allHumans={allHumans}
                zoomToMarker={zoomToMarker}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
            />

            <MapComponent
                mapRef={mapRef}
                sidebarRef={sidebarRef}
                clusterGroup={clusterGroup}
                markersById={markersById}
                searchQuery={searchQuery}
                allHumans={allHumans}
            />
        </div>
    );

};

export default DataComponent;