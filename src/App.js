import React, { useEffect, useState } from 'react';
import './App.css';
import Header from './components/Header';
import DataComponent from './components/DataComponent';
import AuthProvider from "./components/AuthContext";
// import FilterComponent from "./components/FilterComponent";


function App() {

    return (
        <AuthProvider>
            <div className="App-container">
                <header className="App-header">
                    <Header />
                </header>
                <DataComponent />
        </div>
        </AuthProvider>
    );
}

export default App;