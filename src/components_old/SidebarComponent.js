import React, { useState, useEffect } from "react";
import { Range, getTrackBackground } from "react-range"
import '@fortawesome/fontawesome-free/css/all.min.css';
import SidebarList from "./SidebarList"

// Handles UI controls for sorting and filtering markers.
// Updates DataComponent.js with user-selected values.

// { isLoading, sortField, setSortField, sortedMarkers, zoomToMarker }
function SidebarComponent({sidebarRef, allHumans, zoomToMarker, searchQuery, setSearchQuery}) {

    const [sortField, setSortField] = useState("birth_year");
    const [sortOrder, setSortOrder] = useState('asc');

    const minBirthYear = 0;
    const maxBirthYear = 100;

    const [birthYearRange, setBirthYearRange] = useState([20, 80]);
    const [sliderKey, setSliderKey] = useState(0);


    const toggleSortOrder = () => {
        setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    };

    // Listen for the sidebar instance event and force slider re-render
    useEffect(() => {
      if (!sidebarRef.current) return;
      const handleSidebarOpen = (e) => {
        // Delay to allow the sidebar to fully open
        setTimeout(() => {
          setSliderKey(prevKey => prevKey + 1);
          // Optionally, dispatch a resize event too:
          window.dispatchEvent(new Event('resize'));
        }, 300); // Adjust the delay as needed
      };

      sidebarRef.current.on('opening', handleSidebarOpen);
      return () => {
        sidebarRef.current.off('opening', handleSidebarOpen);
      };
    }, [sidebarRef]);


    return (
        <div id="sidebar" className="leaflet-sidebar collapsed">
            {/* Tab Controls */}
            <div className="leaflet-sidebar-tabs">
                <ul role="tablist">
                    {/*<li><a href="#filtersort" role="tab"><i className="fa fa-filter"></i></a></li>*/}
                    <li><a href="#filtersort" role="tab"><i className="fa fa-filter"></i></a></li>
                </ul>
            </div>

            {/* Tab Content */}
            <div className="leaflet-sidebar-content">
                {/*<div id="filtersort" className="leaflet-sidebar-pane">*/}
                {/*    <h1 className="leaflet-sidebar-header">Sort & Filter Options</h1>*/}
                {/*</div>*/}
                <div id="filtersort" className="leaflet-sidebar-pane">
                    <h1 className="leaflet-sidebar-header">Filter & Sort</h1>

                    {/* Search Box */}
                    <div className="search-box">
                        <input
                          type="text"
                          placeholder="Search by name..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Birth Year Range Slider */}
                    <div className="birth-year-slider" style={{ margin: '20px 0' }}>
                        <label>
                          Birth Year Range: {birthYearRange[0]} - {birthYearRange[1]}
                        </label>
                        <Range
                            key={sliderKey}
                            values={birthYearRange}
                            step={1}
                            min={minBirthYear}
                            max={maxBirthYear}
                            onChange={(values) => setBirthYearRange(values)}
                          renderTrack={({ props, children }) => {
                                // Remove key from the props object
                                const { key, ...trackProps } = props;
                                return (
                                  <div
                                      key={key}
                                    onMouseDown={trackProps.onMouseDown}
                                    onTouchStart={trackProps.onTouchStart}
                                    style={{
                                      ...trackProps.style,
                                      height: '36px',
                                      display: 'flex',
                                      width: '100%',
                                      pointerEvents: 'auto'

                                    }}
                                  >
                                    <div
                                      ref={trackProps.ref}
                                      style={{
                                        height: '5px',
                                        width: '100%',
                                        borderRadius: '4px',
                                        background: getTrackBackground({
                                          values: birthYearRange,
                                          colors: ['#ccc', '#548BF4', '#ccc'],
                                          min: minBirthYear,
                                          max: maxBirthYear
                                        }),
                                        alignSelf: 'center'
                                      }}
                                    >
                                      {children}
                                    </div>
                                  </div>
                                );
                              }}
                          renderThumb={({ index, props, isDragged }) => {
                            const { key, ...thumbProps } = props;
                            return (
                              <div
                                  key={key}
                                {...thumbProps}
                                style={{
                                  ...thumbProps.style,
                                  height: '24px',
                                  width: '24px',
                                  borderRadius: '12px',
                                  backgroundColor: '#FFF',
                                  display: 'flex',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  boxShadow: '0px 2px 6px #AAA',
                                  position: 'relative',
                                    zIndex: 101,
                                              pointerEvents: 'auto'

                                }}
                              >
                                <div
                                  style={{
                                    position: 'absolute',
                                    top: '-28px',
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    fontSize: '14px',
                                    fontFamily: 'Arial, Helvetica, sans-serif',
                                    padding: '4px',
                                    borderRadius: '4px',
                                    backgroundColor: '#548BF4',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {birthYearRange[index]}
                                </div>
                                <div
                                  style={{
                                    height: '16px',
                                    width: '5px',
                                    backgroundColor: isDragged ? '#548BF4' : '#CCC'
                                  }}
                                />
                              </div>
                            );
                          }}
                        />
          </div>



                    <div className="sort-option">
                        <label htmlFor="sortField">Sort By</label>
                        <select
                            className="sort-dropdown"
                            id="sortField"
                            value={sortField}
                            onChange={(e) => setSortField(e.target.value)}
                        >
                            <option value="birth_year">Birth Year</option>
                            {/*<option value="death_year">Death Year</option>*/}
                            <option value="article_length">Article Length</option>
                            <option value="article_recent_views">Recent Views</option>
                            <option value="article_total_edits">Total Edits</option>
                            <option value="article_recent_edits">Recent Edits</option>
                            <option value="article_created_date">Article Created Date</option>
                        </select>
                        <button
                            className="sort-order-button"
                            onClick={toggleSortOrder}
                            style={{ marginLeft: '10px' }}
                          >
                            {sortOrder === 'asc' ? (
                              <i className="fa-solid fa-arrow-up-short-wide"></i>
                            ) : (
                              <i className="fa-solid fa-arrow-up-wide-short"></i>
                            )}
                          </button>
                    </div>
                    <div className="sidebar-list">
                        <SidebarList
                            allHumans={allHumans}
                            zoomToMarker={zoomToMarker}
                            sortField={sortField}
                            sortOrder={sortOrder}
                            searchQuery={searchQuery}
                        />
                    </div>
                </div>
            </div>
        </div>
      );
};

export default SidebarComponent;
