import React, { useState } from 'react';
import './App.css';
import HeaderComponent from './components/HeaderComponent';
import SidebarComponent from './components/SidebarComponent';
import GlobeComponent from './components/GlobeComponent';
import MarkerComponent from './components/MarkerComponent';
import getData from './components/getNotableHumanData';


// TODO
// HANDLE CLUSTERS WHEN CLICKED SHOW INFO ABOUT POINT/FULLYOVERLAPPING POINT AND INDICATE THAT IT IS CURRENTLY HIGHLIGHTED
// GET SIDEBAR TO LIST THE PEOPLE AND SORT THEM AND SEARCH THEM WITH LAZY LOADING
// ZOOM TO POINT WHEN CLICKED IN THE SIDEBAR
// FILTERS

function App() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { allHumans, loading, error } = getData();

    if (loading) return <div>Loading data...</div>;
    if (error) return <div>Error loading data. Please try again.</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden'}}>

            <HeaderComponent />

            <div style={{ height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'row' }}>

                <SidebarComponent sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

                <div style={{
                    flex: 1,
                    position: 'relative',
                    minWidth: 0,
                }}>

                    <GlobeComponent>
                        <MarkerComponent data={allHumans} />
                    </GlobeComponent>
                </div>
            </div>
        </div>
    );
}

export default App;