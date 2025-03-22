import React, { useEffect, useRef, useState } from 'react';
import Globe from 'react-globe.gl';


const GlobeComponent = () => {
    const globeRef = useRef();
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // Set min/max zoom values for orbit controls
    useEffect(() => {
        if (globeRef.current) {
            const controls = globeRef.current.controls(); // Access Three.js orbit controls

            controls.minDistance = 100.07; // Set the minimum zoom (higher means farther out)
            controls.maxDistance = 400; // Set the maximum zoom (lower means closer)
        }
    }, []);


    useEffect(() => {
        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                setDimensions({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height,
                });
            }
        });

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, []);

    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                height: '100%',
                position: 'relative',
            }}
        >
            <Globe
                ref={globeRef}
                width={dimensions.width}
                height={dimensions.height}
                atmosphereColor="lightskyblue"  // Adjust to taste
                atmosphereAltitude={0.2}                // Adjust for more/less glow
                backgroundImageUrl= {"https://cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png"}
                globeTileEngineUrl={(x, y, z) =>
                    `https://a.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}@2x.png`
                }
            />
        </div>
    );

};

export default GlobeComponent;