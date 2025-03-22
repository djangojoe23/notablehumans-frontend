import React, { useState } from 'react';
import './App.css';
import AuthProvider from "./components/AuthContext";
import HeaderComponent from './components/HeaderComponent';
import SidebarComponent from './components/SidebarComponent';
import GlobeComponent from './components/GlobeComponent';

// TODO
// LOAD TO GITHUB
// LOAD IN THE DATA AND WORK ON CLUSTERING POINTS!


function App() {

    const [sidebarOpen, setSidebarOpen] = useState(false); // Move sidebar state here

    return (
        <AuthProvider>
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

                        <GlobeComponent sidebarOpen={sidebarOpen} />

                    </div>
                </div>
            </div>
        </AuthProvider>
    );
}

export default App;