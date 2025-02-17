import React, { useEffect, useState } from 'react';
import './App.css';
import Header from './components/Header';
import MapComponent from './components/MapComponent';
import AuthProvider from "./components/AuthContext";


function App() {

    return (
        <AuthProvider>
            <div className="App-container">
                <header className="App-header">
                    <Header />
                </header>
                {/* MapComponent manages map, markers, sidebar, and data */}
                <MapComponent />
            </div>
        </AuthProvider>
    );
}

export default App;