import React from 'react';
import './App.css';
import Header from './components/Header';
import AuthProvider from "./components/AuthContext";
import DataComponent from './components/DataComponent';


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