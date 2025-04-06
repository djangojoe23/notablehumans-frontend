import React, { useState } from 'react';
import './App.css';
import HeaderComponent from './components/HeaderComponent';
import SidebarComponent from './components/SidebarComponent';
import GlobeComponent from './components/GlobeComponent';
import MarkerComponent from './components/MarkerComponent';
import useNotableHumanData from './components/useNotableHumanData';
import { MapContext } from './components/MapContext';

function App() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [selectedMarkerHumans, setSelectedMarkerHumans] = useState(null);
    const [selectedListHuman, setSelectedListHuman] = useState(null);
    const { allHumans, loading, error } = useNotableHumanData();
    const [mapContextValue, setMapContextValue] = useState(null);


    if (loading) return <div>Loading data...</div>;
    if (error) return <div>Error loading data. Please try again.</div>;

    // This callback is passed to MarkerComponent.
    const openSidebar = (humansData) => {
        console.log("opening sidebar")
        setSelectedMarkerHumans(humansData);
        setSidebarOpen(true);
        // setSelectedListHuman(null)
    };

    // Callback to clear the sidebar selection.
    const clearSidebar = () => {
        setSelectedMarkerHumans(null);
    };

    // When no marker is selected, sidebar shows the full list.
    const sidebarData = selectedMarkerHumans || (allHumans.features || []);

    return (
        <MapContext.Provider value={mapContextValue}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden'}}>

                <HeaderComponent />

                <div style={{ height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'row' }}>

                    <SidebarComponent
                        sidebarOpen={sidebarOpen}
                        setSidebarOpen={setSidebarOpen}
                        allHumans={sidebarData}
                        selectedListHuman={selectedListHuman}
                        setSelectedListHuman={setSelectedListHuman}
                    />

                    <div style={{
                        flex: 1,
                        position: 'relative',
                        minWidth: 0,
                    }}>

                        <GlobeComponent
                            clearSidebar={clearSidebar}
                            onMapReady={setMapContextValue}
                            selectedMarkerHumans={selectedMarkerHumans}
                            selectedListHuman={selectedListHuman}
                        >
                            <MarkerComponent
                                data={allHumans}
                                sidebarOpen={sidebarOpen}
                                openSidebar={openSidebar}
                            />
                        </GlobeComponent>
                    </div>
                </div>
            </div>
        </MapContext.Provider>
    );
}

export default App;