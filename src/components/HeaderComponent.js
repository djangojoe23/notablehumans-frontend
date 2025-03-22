import React from 'react';

const HeaderComponent = () => (
    <header
        style={{
            height: '60px',
            backgroundColor: '#333',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            padding: '0 20px',
            boxSizing: 'border-box'
        }}
    >

        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Notable Humans Project</h1>

    </header>
);

export default HeaderComponent;
