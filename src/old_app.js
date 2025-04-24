import React, { useEffect, useMemo } from 'react';
import axios from "axios";
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Globe from './components/Globe';
import useGlobeState from './hooks/useGlobeState';
import throttle from 'lodash.throttle';
import updateClusterVisualStates from './utils/updateClusterVisualStates';
import { isMarkerStillFocused } from './utils/mapValidation'; // adjust path as needed
import './styles/App.css';
import {updateHaloForFeature} from "./utils/haloUtils";

function App() {
  const globeState = useGlobeState();

    const enrichedAllHumans = useMemo(() => {
      if (!globeState.notableHumans?.features) return [];

      return globeState.notableHumans.features
        .filter(f => f.geometry?.coordinates?.length === 2)
        .map(f => ({
          ...f.properties,
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0],
        }))
        .sort((a, b) => a.n.localeCompare(b.n));
    }, [globeState.notableHumans]);

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/notable-humans-geojson/`)
      .then((res) => {
      console.log("📦 API response:", res.data);

          // optional: check programmatically
          if (Array.isArray(res.data)) {
            console.warn("⚠️ Received a plain array, not a GeoJSON FeatureCollection.");
          } else if (res.data.type === "FeatureCollection" && Array.isArray(res.data.features)) {
            console.log("✅ Proper GeoJSON FeatureCollection");
          } else {
            console.error("❌ Unexpected response format:", res.data);
          }

          globeState.setNotableHumans(res.data);
        })
      .catch((err) => {
        console.error("Error fetching GeoJSON", err);
        globeState.setError("Failed to load data");
      });
  }, []);

  if (globeState.error) return <div>{globeState.error}</div>;
  if (!globeState.notableHumans) return <div>Loading...</div>;

  const handleSelectPerson = (human, options = {}) => {
    if (!human || !human.lat || !human.lng || !globeState.globeRef.current) return;
    const globe = globeState.globeRef.current;
    const targetLngLat = [parseFloat(human.lng), parseFloat(human.lat)];
    const maxZoom = 16;

    // 💡 Exit early if already focused and in "location" mode
   const alreadyFocused =
    globeState.sidebarModeRef.current === 'location' &&
    globeState.selectedClusterHumans.some(h => h.id === human.id) &&
    isMarkerStillFocused({
      globe,
      targetLngLat,
      focusedZoom: globeState.focusedZoomRef.current,
      tolerance: 30,
      zoomThreshold: 0.1,
    });

    if (alreadyFocused) {
      globeState.setSelectedListHuman(human);         // highlight immediately
      globeState.setExpandedHumanId(human.id); // expand info
        console.log("returned!@")
      return;
    }

    globeState.setSelectedListHuman(human); // fallback case: update normally

    let animationStopped = false;

    const throttledUpdate = throttle(() => {
      updateClusterVisualStates(globe);
    }, 150);

    const stopAndSelect = (humansAtPoint, featureForHalo = null, markerRadius = 10, options={}) => {
      const matched = humansAtPoint.find(h => h.id === human.id);
      globeState.setSelectedListHuman(matched ?? null);


      if (options.source !== 'sidebar') {
          globeState.setSelectedClusterHumans(humansAtPoint);
          globeState.setSidebarMode('location');
          globeState.setSidebarTrigger('marker');
      }
      globeState.setLastMarkerCoordinates(targetLngLat);
      globeState.focusedZoomRef.current = globe.getZoom();

      globe.stop();
      animationStopped = true;
      globe.off('move', checkWhileFlying);

      // 🌟 Add pulsing halo if valid feature provided
      if (featureForHalo) {
        updateHaloForFeature(
          globe,
          {
            ...featureForHalo,
            id: featureForHalo.id ?? featureForHalo.properties?.id ?? human.id
          },
          markerRadius + 8,
          globeState.haloPersistRef,
          globeState.currentHaloFeatureRef,
          globeState.pulseAnimationFrameRef,
          globeState.isAnimatingRef
        );
      }
    };

    const checkWhileFlying = () => {
      throttledUpdate();

      const point = globe.project(targetLngLat);
      const features = globe.queryRenderedFeatures(point, {
        layers: ['clusters', 'unclustered-point'],
      });

      const unclustered = features.find(f =>
        f.layer.id === 'unclustered-point' &&
        f.properties.id === human.id
      );

      if (unclustered && !animationStopped) {
        const coords = unclustered.geometry?.coordinates ?? targetLngLat;
        stopAndSelect(
            [human],
            {
              ...unclustered,
              geometry: { coordinates: coords }, // 💡 Add fallback manually
              id: unclustered.id ?? unclustered.properties.id,
            },
            10,
            options
        );
        return;
      }

      const cluster = features.find(f => f.layer.id === 'clusters');
      if (cluster && !animationStopped) {
        const clusterId = cluster.properties.cluster_id;
        const isFullyOverlapping = globe.getFeatureState({ source: 'humans', id: clusterId })?.fullyOverlapping;

        if (isFullyOverlapping) {
            globe.getSource('humans').getClusterLeaves(clusterId, Infinity, 0, (err, leaves) => {
            if (err) return;

            const sorted = leaves
              .filter(l => l.geometry?.coordinates?.length === 2)
              .map(l => ({
                ...l.properties,
                lat: l.geometry.coordinates[1],
                lng: l.geometry.coordinates[0],
              }))
              .sort((a, b) => a.n.localeCompare(b.n));

            function computeMarkerRadius(pointCount) {
              if (pointCount >= 30) return 25;
              if (pointCount >= 10) return 20;
              return 15;
            }

            const coords = cluster.geometry?.coordinates ?? targetLngLat;

            stopAndSelect(
              sorted,
              {
                ...cluster,
                geometry: { coordinates: coords },
                id: clusterId,
              },
              computeMarkerRadius(cluster.properties.point_count),
                options
            );
            });
            }
      }
    };

    globe.flyTo({
      center: targetLngLat,
      zoom: maxZoom,
      speed: 0.8,
      curve: 1.5,
      easing: t => t,
    });

    globe.on('move', checkWhileFlying);
    globe.once('moveend', () => {
      globe.off('move', checkWhileFlying);
    });
  };

  return (
    <div className="app-container">
      <Header />
      <div className="main-content">
        <Globe {...globeState} />
        <Sidebar
            {...globeState}
            humansAtMarker={
              globeState.sidebarMode === 'all'
                ? enrichedAllHumans
                : globeState.selectedClusterHumans
            }
            onSelectPerson={handleSelectPerson}
        />
      </div>
    </div>
  );
}

export default App;
