import React from 'react';

const SidebarComponent = ({ onSortChange, onMarkerLimitChange, sortField, sortOrder, markers }) => {

    const handleMarkerLimitChange = (e) => {
        // Notify parent component of the new limit
        onMarkerLimitChange(e.target.value);
    };

    const handleSortFieldChange = (e) => {
        onSortChange(e.target.value, sortOrder); // Inform MapComponent of the change
    };

    const handleSortOrderChange = (e) => {
        onSortChange(sortField, e.target.value); // Inform MapComponent of the change
    };

    return (
        <div id="sidebar" className="leaflet-sidebar collapsed">
            {/* Tab Controls */}
            <div className="leaflet-sidebar-tabs">
                <ul role="tablist">
                    <li><a href="#filtersort" role="tab"><i className="fa fa-filter"></i></a></li>
                    <li><a href="#list" role="tab"><i className="fa fa-list"></i></a></li>
                </ul>
            </div>

            {/* Tab Content */}
            <div className="leaflet-sidebar-content">
                <div id="filtersort" className="leaflet-sidebar-pane">
                    <h1 className="leaflet-sidebar-header">Sort & Filter Options</h1>
                    <div className="sort-option">
                        <label htmlFor="sortField">Sort By</label>
                        <select
                            id="sortField"
                            value={sortField}
                            onChange={handleSortFieldChange}
                        >
                            <option value="birth_year">Birth Year</option>
                            <option value="death_year">Death Year</option>
                            <option value="article_length">Article Length</option>
                            <option value="article_recent_views">Recent Views</option>
                            <option value="article_total_edits">Total Edits</option>
                            <option value="article_recent_edits">Recent Edits</option>
                            <option value="article_created_date">Article Created Date</option>
                        </select>
                        <div className="sort-option">
                            <label htmlFor="sortOrder">Order</label>
                            <select
                                id="sortOrder"
                                value={sortOrder}
                                onChange={handleSortOrderChange}
                            >
                                <option value="asc">Ascending</option>
                                <option value="desc">Descending</option>
                            </select>
                        </div>
                        {/* Limit Control */}
                        <div className="limit-control">
                            <label>
                                Show:
                                <select onChange={handleMarkerLimitChange}>
                                    <option value="100">100</option>
                                    <option value="500">500</option>
                                    <option value="1000">1000</option>
                                    {/*<option value="100">100</option>*/}
                                </select>
                                markers
                            </label>
                        </div>
                    </div>
                </div>
                <div id="list" className="leaflet-sidebar-pane">
                    <h1 className="leaflet-sidebar-header">List</h1>
                    <div className="markers-list">
                        <h3>List of Notable Humans</h3>
                        <ol>
                            {markers.length > 0 ? (
                                markers.map((marker, index) => (
                                    <li key={index}>
                                        <p>{marker.name}</p>
                                        {/* Add any other properties you want to display */}
                                    </li>
                                ))
                            ) : (
                                <p>No markers available</p>
                            )}
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SidebarComponent;
