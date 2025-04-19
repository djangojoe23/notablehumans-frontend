import { useState, useRef } from 'react';

const useGlobeState = () => {
  const globeRef = useRef(null);

  const [notableHumanData, setNotableHumanData] = useState(null);
  const [dataLoadError, setDataLoadError] = useState(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [detailedHuman, setDetailedHuman] = useState(null);

  const isHaloActiveRef = useRef(false);
  const haloAnimationFrameRef = useRef(null);
  const haloPersistRef = useRef(null);
  const currentHaloFeatureRef = useRef(null);

  const justClickedUnclusteredRef = useRef(null);



  return {
    globeRef,

    notableHumanData, setNotableHumanData,
    dataLoadError, setDataLoadError,

    sidebarOpen, setSidebarOpen,

    detailedHuman, setDetailedHuman,

    isHaloActiveRef, haloAnimationFrameRef, haloPersistRef, currentHaloFeatureRef,

    justClickedUnclusteredRef,

  };
};

export default useGlobeState;
