import React, {useEffect, useRef, useCallback} from 'react';

import {Box} from '@mui/material';
import {useTheme} from "@mui/material/styles";

import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import FilterSummary from './FilterSummary'
import { buildClusterPopup, closePopup, matchesFilter } from "../utils/clusterPopup";


const Globe = ({humans, globeState, filterState, filteredHumansIdSet, SIDEBAR_WIDTH}) => {
    const theme = useTheme();
    const containerRef = useRef(null);
    const popupRef = useRef(null);
    const popupListDivRef = useRef(null); //DOM node for your scrolling list inside cluster popup
    const clusterContextRef = useRef(null); //the cluster that currently has a popup open
    const lastZoomRef = useRef(null);

    // Helper to rebuild the existing popup on sort/filter change
    const rebuildClusterPopup = useCallback(() => {
        if (!popupRef.current || !clusterContextRef.current) return;
        const { clusterId, lngLat, singletonFeature, totalCount } = clusterContextRef.current;
        // build a fake feature for singleton or cluster
        const feature = singletonFeature
            ? singletonFeature
            : {
                properties: { cluster_id: clusterId, point_count: totalCount },
                geometry: { coordinates: lngLat }
              };
        const fakeEvent = {
            features: [feature],
            lngLat: { lng: lngLat[0], lat: lngLat[1] }
        };
        buildClusterPopup(
            fakeEvent,
            clusterContextRef,
            popupRef,
            popupListDivRef,
            globeState,
            filterState,
            filteredHumansIdSet
        );
    }, [filterState.sortBy, filterState.sortAsc, filteredHumansIdSet]);

    // Set up the Globe
    useEffect(() => {
        if (!containerRef.current || !globeState.geojsonData || globeState.globeRef.current) return;

        globeState.globeRef.current = new mapboxgl.Map({
            container: containerRef.current,
            style: `mapbox://styles/${process.env.REACT_APP_MAPBOX_USER}/${process.env.REACT_APP_MAPBOX_STYLE_ID}`,
            accessToken: process.env.REACT_APP_MAPBOX_API_TOKEN,
            center: [0, 0],
            zoom: 2,
            minZoom: 2,
            maxZoom: 16,
            projection: 'globe',
            doubleClickZoom: false
        });

        lastZoomRef.current = globeState.globeRef.current.getZoom();

        globeState.globeRef.current.on('load', () => {
            globeState.globeRef.current.addSource(
                'humans', {
                    type: 'geojson',
                    data: globeState.geojsonData,
                    cluster: true,
                    clusterMaxZoom: 16,
                    clusterRadius: 50,
                }
            );

            globeState.globeRef.current.addLayer({
                id: 'clusters',
                type: 'circle',
                source: 'humans',
                filter: ['has', 'point_count'],
                paint: {
                    'circle-color': theme.palette.primary.main,
                    'circle-stroke-color': [
                        'case',
                        ['boolean', ['feature-state', 'fullyOverlapping'], false],
                        '#666',
                        'transparent'
                    ],
                    'circle-stroke-width': [
                        'case',
                        ['boolean', ['feature-state', 'fullyOverlapping'], false],
                        2,
                        0
                    ],
                    'circle-radius': [
                        'interpolate',
                        ['linear'],
                        ['get', 'point_count'],
                        1, 11,   // count=1 → 12px
                        100, 30,   // count=50 → 25px
                        1000, 40,    // count=200 → 50px
                        10000, 50,
                    ]
                },
            });

            globeState.globeRef.current.addLayer({
                id: 'cluster-count',
                type: 'symbol',
                source: 'humans',
                filter: ['has', 'point_count'],
                layout: {
                    'text-field': ['get', 'point_count_abbreviated'],
                    'text-font': ['Ubuntu Medium', 'Arial Unicode MS Bold'],
                    'text-size': 12,
                    'text-anchor': 'center',
                    'text-offset': [-0.05, 0.15],
                },
                paint: {
                    'text-color': '#444',
                },
            });

            globeState.globeRef.current.addLayer({
                id: 'singletons',
                type: 'circle',
                source: 'humans',
                filter: ['!', ['has', 'point_count']],
                paint: {
                    'circle-color': theme.palette.primary.main,
                    'circle-radius': 8,
                },
            });

            globeState.globeRef.current.addLayer({
                id: 'singleton-count',
                type: 'symbol',
                source: 'humans',
                filter: ['!', ['has', 'point_count']],
                layout: {
                    'text-field': '1',
                    'text-font': ['Ubuntu Medium', 'Arial Unicode MS Bold'],
                    'text-size': 10,
                    'text-anchor': 'center',
                    'text-offset': [0, 0.15],
                    'text-ignore-placement': true,
                    'text-allow-overlap': true,
                },
                paint: {
                    'text-color': '#444',
                },
            });

            globeState.globeRef.current.on('click', 'clusters', (e) => {
                buildClusterPopup(
                    e,
                    clusterContextRef,
                    popupRef,
                    popupListDivRef,
                    globeState,
                    filterState,
                    filteredHumansIdSet
                )
            });

            globeState.globeRef.current.on('click', 'singletons', (e) => {
                buildClusterPopup(
                    e,
                    clusterContextRef,
                    popupRef,
                    popupListDivRef,
                    globeState,
                    filterState,
                    filteredHumansIdSet
                )
            });

            globeState.globeRef.current.on('click', (e) => {
                const features = globeState.globeRef.current.queryRenderedFeatures(e.point, {
                    layers: ['clusters', 'singletons'],
                });

                if (features.length === 0 && popupRef.current) {
                    // Clicked on empty map, not on cluster or unclustered point
                    popupRef.current.remove();
                    popupRef.current = null;
                    // clusterWithPopupRef.current = { clusterId: null, lngLat: null, totalCount: 0 };
                }
            });

            globeState.globeRef.current.on('mouseenter', 'clusters', () => {
                globeState.globeRef.current.getCanvas().style.cursor = 'pointer';
            });

            globeState.globeRef.current.on('mouseleave', 'clusters', () => {
                globeState.globeRef.current.getCanvas().style.cursor = '';
            });

            globeState.globeRef.current.on('mouseenter', 'singletons', () => {
                globeState.globeRef.current.getCanvas().style.cursor = 'pointer';
            });

            globeState.globeRef.current.on('mouseleave', 'singletons', () => {
                globeState.globeRef.current.getCanvas().style.cursor = '';
            });

            return () => {
                globeState.globeRef.current.remove();
                globeState.globeRef.current = null;
            };
        });
    }, [globeState.geojsonData, globeState]);

    // When the `humans` array changes, rebuild the GeoJSON FeatureCollection
    // and update the “humans” source on the Mapbox map so only the filtered points are rendered.
    useEffect(() => {
        if (!globeState.globeRef.current) return;
        const source = globeState.globeRef.current.getSource('humans');
        if (!source) return;

        // Build the filtered GeoJSON directly here:
        const filteredGeoJSON = {
            type: 'FeatureCollection',
            features: humans.map(person => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [person.lng, person.lat],
                },
                properties: {
                    ...person,
                },
            })),
        };
        source.setData(filteredGeoJSON);
    }, [humans, globeState]);

    // Update the cluster popup lists on map moveend (zoom or pan)
    useEffect(() => {
        // nothing to do if there’s no popup up or no cluster context
        if (!globeState.globeRef.current) return;

        const onMoveEnd = () => {
            // detect zoom change
            const newZoom = globeState.globeRef.current.getZoom();
            const zoomChanged = newZoom !== lastZoomRef.current;
            lastZoomRef.current = newZoom;

            if (!clusterContextRef.current) return; // never opened a popup yet

            // project the tracked coords and look for any feature there
            const point    = globeState.globeRef.current.project(clusterContextRef.current.lngLat);
            const features = globeState.globeRef.current.queryRenderedFeatures(point, {
                layers: ['clusters','singletons']
            });

            // If nothing renders at point, “off‐screen” happened by panning OR zooming
            if (features.length === 0) {
                // pan → removeOnly=true; zoom → removeOnly=false
                closePopup(popupRef, popupListDivRef, clusterContextRef, !zoomChanged);
                return;
            }

            //find *our* feature in features
            let feature;
            if (clusterContextRef.current.clusterId != null) {
                feature = features.find(f => f.properties.cluster_id === clusterContextRef.current.clusterId);
            } else {
                // singleton case: match by your saved singletonFeature.id
                feature = features.find(f => f.properties.id === clusterContextRef.current.singletonFeature.properties.id);
            }

            // if feature is undefined, that means your original cluster truly disappeared → full close
            if (!feature) {
                closePopup(popupRef, popupListDivRef, clusterContextRef);
                return
            }

            const fakeEvent = {
                features: [feature],
                lngLat: { lng: feature.geometry.coordinates[0], lat: feature.geometry.coordinates[1] }
            };

            // If it’s back on‐screen but we’ve hidden the popup, rebuild from scratch
            if (!popupRef.current) {
                buildClusterPopup(
                    fakeEvent,
                    clusterContextRef,
                    popupRef,
                    popupListDivRef,
                    globeState,
                    filterState,
                    filteredHumansIdSet
                );
                return;
            }

            if (zoomChanged){
                // 🔄 Otherwise it’s on‐screen and still open → update its contents
                if (feature.properties.cluster_id != null) {
                    // Cluster: re‐fetch leaves & filter
                    globeState.globeRef.current.getSource('humans').getClusterLeaves(
                        feature.properties.cluster_id,
                        feature.properties.point_count,
                        0,
                        (err, leaves) => {
                            if (err) {
                                // zoomed past it → fully close
                                closePopup(popupRef, popupListDivRef, clusterContextRef);
                                return;
                            }
                            const kept = leaves.filter(l => matchesFilter(l.properties, filteredHumansIdSet));
                            if (!kept.length) {
                                // filter emptied it → fully close
                                closePopup(popupRef, popupListDivRef, clusterContextRef);
                                return;
                            }
                            // update context
                            clusterContextRef.current = {
                                clusterId: feature.properties.cluster_id,
                                lngLat: feature.geometry.coordinates,
                                totalCount: kept.length,
                                singletonFeature: null
                            };
                            // rebuild the popup with the new leaf set
                            buildClusterPopup(
                                fakeEvent,
                                clusterContextRef,
                                popupRef,
                                popupListDivRef,
                                globeState,
                                filterState,
                                filteredHumansIdSet
                            );
                        }
                    );
                } else {
                    // Singleton point: test filter, update or close
                    if (!matchesFilter(feature.properties, filteredHumansIdSet)) {
                        closePopup(popupRef, popupListDivRef, clusterContextRef);
                        return;
                    }
                    clusterContextRef.current = {
                        clusterId: null,
                        lngLat: feature.geometry.coordinates,
                        totalCount: 1,
                        singletonFeature: feature
                    };
                    buildClusterPopup(
                        fakeEvent,
                        clusterContextRef,
                        popupRef,
                        popupListDivRef,
                        globeState,
                        filterState,
                        filteredHumansIdSet
                    );
                }
            } else {
                // ————— Just a pan: reposition the existing popup —————
                popupRef.current.setLngLat(clusterContextRef.current.lngLat);
            }
        };
        globeState.globeRef.current.on('moveend', onMoveEnd);
        return () => {
            globeState.globeRef.current.off('moveend', onMoveEnd);
        };

    }, [globeState]);

    // Rebuild the cluster popup when sort or filter inputs change
    useEffect(() => {
        if (popupRef.current) {
            rebuildClusterPopup();
        }
    }, [rebuildClusterPopup]);

    // Remove padding when sidebar closes
    useEffect(() => {
        if (!globeState.globeRef.current) return;

        if (!globeState.sidebarOpen) {
            globeState.globeRef.current.easeTo({
                center: globeState.globeRef.current.getCenter(),
                padding: {left: 0, right: 0, top: 0, bottom: 0},
                duration: 500,
            });
        }
    }, [globeState, globeState.sidebarOpen]);

    // Add padding when sidebar closes
    useEffect(() => {
        if (!globeState.globeRef.current || !globeState.sidebarOpen) return;
        globeState.globeRef.current.easeTo({
            center: globeState.globeRef.current.getCenter(),
            padding: {left: SIDEBAR_WIDTH, right: 0, top: 0, bottom: 0},
            duration: 300,
            easing: t => t,
            essential: true,
        });
    }, [globeState, globeState.sidebarOpen]);

    return (
        <Box position="relative" width="100%" height="100%">

            <FilterSummary
                filterState={filterState}
                humansCount={humans.length}
                sidebarOpen={globeState.sidebarOpen}
                sidebarWidth={SIDEBAR_WIDTH}
            />

            <Box
                ref={containerRef}
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
            />
        </Box>
    );
}
export default Globe;