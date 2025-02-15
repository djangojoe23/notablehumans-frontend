import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Range } from "react-range";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const defaultIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',  // Default marker URL
    iconSize: [25, 41],  // Size of the marker
    iconAnchor: [12, 41],  // Anchor point of the marker
    popupAnchor: [0, -41],  // Position of the popup relative to the marker
});


const MapComponent = ({ notableHumans }) => {
    const mapbox_token = process.env.REACT_APP_MAPBOX_API_TOKEN;
    const mapbox_user = process.env.REACT_APP_MAPBOX_USER;
    const mapbox_style_id = process.env.REACT_APP_MAPBOX_STYLE_ID;
    const [yearRange, setYearRange] = useState([1800, 2020]); // Default range

    // Filter markers based on the selected year range
    const filteredHumans = notableHumans.filter(
    (human) => human.birth_year >= yearRange[0] && human.birth_year <= yearRange[1]
    );

    return (
        <div style={{ position: "relative", "height": "100%" }}>
            {/*Floating Filter Box*/}
            <div style={{
                position: "absolute",
                bottom: "10px",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 1000, background: "white",
                padding: "10px",
                borderRadius: "5px",
                width: "250px",
                textAlign: "center",
                boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.2)"
            }}>
                <label>Born Between: {yearRange[0]} - {yearRange[1]}</label>
                <Range
                  step={5}
                  min={1800}
                  max={2020}
                  values={yearRange}
                  onChange={(values) => setYearRange(values)}
                  renderTrack={({ props, children }) => (
                    <div {...props} style={{
                        height: "6px",
                        width: "100%",
                        background: "#ddd",
                        borderRadius: "3px",
                        marginTop: "16px",
                        position: "relative"
                    }}>
                      {children.map((child, index) => (
                        <div key={index}>{child}</div> // ✅ Add a key to each child
                      ))}
                    </div>
                  )}
                  renderThumb={({ props, index }) => {
                      const { key, ...restProps } = props;
                      // Calculate left position based on range value
                      const position = (yearRange[index] - 1800) / (2020 - 1800) * 100; // Calculate percentage
                      return (
                          <div {...restProps} style={{
                              height: "18px",
                              width: "18px",
                              background: "#007bff",
                              borderRadius: "50%",
                              position: "absolute",
                              left: `${position}%`,
                              transform: "translateX(-50%) translateY(-6px)", // Centers the thumb over the position
                          }} />
                      );
                  }}
                />
            </div>


            {/* Map */}
            <MapContainer
                center={[51.505, -0.09]}
                zoom={5}
                worldCopyJump={true}
                preferCanvas={true}
                zoomControl={false}
                style={{ height: "100%", width: '100%' }}
            >

                <TileLayer
                    url={`https://api.mapbox.com/styles/v1/${mapbox_user}/${mapbox_style_id}/tiles/{z}/{x}/{y}?access_token=${mapbox_token}&fresh=true`}
                    attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
                />

                {/* Markers */}
                {filteredHumans.map((human, index) => {
                    // console.log(`Rendering marker ${index}:`, human.wikidata_id) // Log the marker key
                    return (
                        human.birth_latitude && human.birth_longitude ? (
                            <Marker
                                key={human.wikidata_id}
                                position={[human.birth_latitude, human.birth_longitude]}
                                icon={defaultIcon}
                            >
                                <Popup>
                                    <strong>{human.name}</strong><br/>
                                    Born in: {human.birth_place}<br/>
                                    Birth Date: {human.birth_date}
                                </Popup>
                            </Marker>
                        ) : null);
                })}
            </MapContainer>
        </div>
    );
};

export default MapComponent;
