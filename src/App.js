import React, {useState} from 'react';
import './App.css';
import HeaderComponent from './components/HeaderComponent';
import SidebarComponent from './components/SidebarComponent';
import GlobeComponent from './components/GlobeComponent';
import useHumansData from './components/getHumansData';


// TODO
// CLUSTER POINTS FROM THE DATA AND SPIDER EFFECTS WHEN CLICKED
// SHOW INFO ABOUT POINT WHEN INDIVIDUAL POINT IS CLICKED
// GET SIDEBAR TO LIST THE PEOPLE AND SORT THEM AND SEARCH THEM WITH LAZY LOADING
// ZOOM TO POINT WHEN CLICKED IN THE SIDEBAR
// FILTERS


function App() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { allHumans, loading, error } = useHumansData();

    if (loading) return <div>Loading data...</div>;
    if (error) return <div>Error loading data. Please try again.</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden'}}>

            <HeaderComponent />

            {/* Main content area container*/}
            <div style={{ height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'row' }}>

                <SidebarComponent sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

                {/* Globe Section (Sidebar is inside here) */}
                <div style={{
                    flex: 1,
                    position: 'relative',
                    minWidth: 0,
                }}>

                    <GlobeComponent />

                </div>
            </div>
        </div>
    );
}

export default App;