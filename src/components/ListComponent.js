import React, { useContext, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import OverflowTooltip from './OverflowTooltip'
import { MapContext } from './MapContext';
import { getOffset, updateHaloForFeature } from './mapUtils';


// Define triggerHalo here, below the imports.
const triggerHalo = (map, feature, human, haloPersistRef, currentHaloFeatureRef, pulseAnimationFrameRef, isAnimatingRef) => {
  if (!feature) {
    console.error("triggerHalo called with undefined feature for", human.properties.name);
    return;
  }

  if (feature.properties.point_count) {
    // Feature is a cluster. Retrieve its leaves and activate the halo.
    const pointCount = feature.properties.point_count;
    let baseRadius = 15;
    if (pointCount >= 10 && pointCount < 30) {
      baseRadius = 20;
    } else if (pointCount >= 30) {
      baseRadius = 25;
    }
    map.getSource('humans').getClusterLeaves(
      feature.properties.cluster_id,
      pointCount,
      0,
      (err, leaves) => {
        if (err) return;
        updateHaloForFeature(
          map,
          feature,
          baseRadius,
          haloPersistRef,
          currentHaloFeatureRef,
          pulseAnimationFrameRef
        );
        isAnimatingRef.current = true;
        console.log("Halo activated on cluster for", human.properties.name);
      }
    );
  } else {
    // Unclustered marker: update the halo directly.
    updateHaloForFeature(
      map,
      feature,
      feature.properties.markerRadius || 10,
      haloPersistRef,
      currentHaloFeatureRef,
      pulseAnimationFrameRef
    );
    isAnimatingRef.current = true;
    console.log("Halo activated on unclustered marker for", human.properties.name);
  }
};

// Calculates the distance in kilometers between two lat/lng points.
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers.
}

/**
 * ListComponent displays a long list of people in a virtualized list,
 * sorted alphabetically by name. When a row is clicked, it sets that row as active
 * (via setSelectedListHuman) and flies to the corresponding marker.
 *
 * @param {Array|Object} humans - Array of human objects or a GeoJSON FeatureCollection.
 * @param {number} itemSize - Height of each row in pixels.
 * @param {Object} selectedListHuman - The currently active human object.
 * @param {Function} setSelectedListHuman - Setter function to update the active human.
 */
const ListComponent = ({ humans=[], itemSize , selectedListHuman, setSelectedListHuman}) => {
  const { map, haloPersistRef, currentHaloFeatureRef, pulseAnimationFrameRef, isAnimatingRef } = useContext(MapContext) || {};

  // Derive an array from the input. If humans.features exists, use that.
  const humanArray = Array.isArray(humans) ? humans : (humans.features || []);

  // Sort the people alphabetically by name (assuming a "name" property exists)
  const sortedHumans = useMemo(() => {
    return [...humanArray].sort((a, b) => {
      const nameA = (a.properties.name || '').toLowerCase();
      const nameB = (b.properties.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [humanArray]);

const handleRowClick = (human) => {
  setSelectedListHuman(human);

  // Parse birthplace coordinates.
  let birthPlace = human.properties.birth_place;
  if (typeof birthPlace === 'string') {
    try {
      birthPlace = JSON.parse(birthPlace);
    } catch (error) {
      console.error('Error parsing birth_place:', error);
      return;
    }
  }
  if (!birthPlace) return;

  const { longitude, latitude } = birthPlace;

  if (map) {
    // Begin the flyTo animation.
    map.flyTo({
      center: [longitude, latitude],
      zoom: 15,
      speed: 0.8,
      curve: 1.5,
      easing: t => t,
    });

    // Create a flag to avoid calling stop() multiple times.
    let animationStopped = false;

    // Define a callback to check the condition.
    const checkAnimationCondition = () => {
  // Project the target geographic coordinates to screen coordinates.
  const point = map.project([longitude, latitude]);
  const features = map.queryRenderedFeatures(point, { layers: ['clusters', 'unclustered-point'] });

  // Try to find the unclustered feature matching the human.
  let feature = features.find(
    (f) => !f.properties.point_count && f.properties.wikidata_id === human.properties.wikidata_id
  );
  // If no unclustered feature is found, fall back to any cluster feature.
  if (!feature) {
    feature = features.find((f) => f.properties.point_count);
  }

  if (feature) {
    const targetCenter = [longitude, latitude];
    const currentCenter = map.getCenter();
    const deltaLng = currentCenter.lng - targetCenter[0];
    const deltaLat = currentCenter.lat - targetCenter[1];
    const centerDistance = Math.sqrt(deltaLng * deltaLng + deltaLat * deltaLat);
    const centerThreshold = 0.001; // Adjust as needed

    // Define a helper to recheck after easeTo completes.
    const recheckAfterEasing = () => {
      map.once('moveend', () => {
        const newCenter = map.getCenter();
        const newDeltaLng = newCenter.lng - targetCenter[0];
        const newDeltaLat = newCenter.lat - targetCenter[1];
        const newCenterDistance = Math.sqrt(newDeltaLng * newDeltaLng + newDeltaLat * newDeltaLat);
        if (newCenterDistance <= centerThreshold && !animationStopped) {
          console.log("After easing, camera is centered; triggering halo.");
          triggerHalo(map, feature, human, haloPersistRef, currentHaloFeatureRef, pulseAnimationFrameRef, isAnimatingRef);
          map.stop();
          animationStopped = true;
        }
      });
    };

    if (!feature.properties.point_count) {
      // Unclustered marker.
      if (centerDistance > centerThreshold) {
        console.log("Marker is unclustered but camera not centered; adjusting camera.");
        map.easeTo({
          center: targetCenter,
          duration: 1000,
          easing: t => t,
        });
        recheckAfterEasing();
      } else if (!animationStopped) {
        console.log("Marker is unclustered and camera is centered; triggering halo.");
        triggerHalo(map, feature, human, haloPersistRef, currentHaloFeatureRef, pulseAnimationFrameRef, isAnimatingRef);
        map.stop();
        animationStopped = true;
      }
    } else {
      // Cluster feature.
      const state = map.getFeatureState({ source: 'humans', id: feature.id });
      if (state && state.fullyOverlapping) {
        if (centerDistance > centerThreshold) {
          console.log("Cluster is fully overlapping but camera not centered; adjusting camera.");
          map.easeTo({
            center: targetCenter,
            duration: 1000,
            easing: t => t,
          });
          recheckAfterEasing();
        } else if (!animationStopped) {
          console.log("Cluster is fully overlapping and camera is centered; triggering halo.");
          triggerHalo(map, feature, human, haloPersistRef, currentHaloFeatureRef, pulseAnimationFrameRef, isAnimatingRef);
          map.stop();
          animationStopped = true;
        }
      }
    }
  }
};


    // Attach the move event listener to check the condition repeatedly.
    map.on('move', checkAnimationCondition);

    // When the movement ends, remove the listener.
    map.once('moveend', () => {
      map.off('move', checkAnimationCondition);
    });
  }
};




  const Row = ({ index, style }) => {
    const human = sortedHumans[index];
    // Check if this row is active.
    // If you have a unique id, you can compare that instead of the name.
    const isActive = selectedListHuman && (human.properties.wikidata_id === selectedListHuman.properties.wikidata_id);
    return (
      <div
        style={{
          ...style,
          backgroundColor: isActive ? 'rgba(242, 140, 177, 0.3)' : undefined,
        }}
        className="clickable-row"
        onClick={() => handleRowClick(human)}
      >
        <OverflowTooltip className="clickable-name">
          {human.properties.name || 'Unknown'}
        </OverflowTooltip>
      </div>
    );
  };

  return (
    <AutoSizer>
      {({ height, width }) => (
        <List
          style={{ overflowX: 'hidden' }}
          height={height}        // AutoSizer provides a number.
          itemCount={sortedHumans.length}
          itemSize={itemSize}    // e.g., 40 px per row.
          width={width}
        >
          {Row}
        </List>
      )}
    </AutoSizer>
  );
};

export default ListComponent;
