import {useEffect, useRef} from "react";
import L from 'leaflet';
import "leaflet-sidebar-v2/css/leaflet-sidebar.min.css";
import 'leaflet-sidebar-v2'; // Import the Sidebar JavaScript (This may be missing)
import '@fortawesome/fontawesome-free/css/all.min.css';

const SidebarComponent = ({ map }) => {
    const sidebarRef = useRef(null);
    useEffect(() => {
        if (!map) return; // Ensure the map is available before initializing the sidebar

        const sidebarElement = document.getElementById("sidebar");
        if (sidebarElement) {
            sidebarRef.current = L.control.sidebar({
                autopan: true,
                closeButton: true,
                container: "sidebar",
                position: "left",
            }).addTo(map);
        } else {
            console.error("Sidebar element not found");
        }

        return () => {
            if (sidebarRef.current) {
                map.removeControl(sidebarRef.current);
            }
        };
    }, [map]); // Depend on map to ensure proper initialization

    return (
        <div id="sidebar" className="leaflet-sidebar collapsed">
            {/* Tab Controls */}
            <div className="leaflet-sidebar-tabs">
                <ul role="tablist">
                    <li><a href="#home" role="tab"><i className="fa fa-filter"></i></a></li>
                    {/*<li><a href="#info" role="tab"><i className="fa fa-info"></i></a></li>*/}
                </ul>
            </div>

            {/* Tab Content */}
            <div className="leaflet-sidebar-content">
                <div id="home" className="leaflet-sidebar-pane">
                    <h1 className="leaflet-sidebar-header">Home</h1>
                    <p>Welcome to the sidebar!</p>
                </div>
                {/*<div id="info" className="leaflet-sidebar-pane">*/}
                {/*    <h1 className="leaflet-sidebar-header">Info</h1>*/}
                {/*    <p>More details go here.</p>*/}
                {/*</div>*/}
            </div>
        </div>
    );
};

export default SidebarComponent;
