import '@fortawesome/fontawesome-free/css/all.min.css';

// Handles UI controls for sorting and limiting markers.
// Updates DataComponent.js with user-selected values.

function SidebarComponent({ sortField, setSortField, sortOrder, setSortOrder, markerLimit, setMarkerLimit, markers }) {

    const visibleMarkers = markers.slice(0, markerLimit);  // Limit the markers to the markerLimit

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
                            onChange={(e) => setSortField(e.target.value)}
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
                                onChange={(e) => setSortOrder(e.target.value)}
                            >
                                <option value="asc">Ascending</option>
                                <option value="desc">Descending</option>
                            </select>
                        </div>
                        {/* Limit Control */}
                        <div className="limit-control">
                            <label>
                                Show:
                                <select value={markerLimit} onChange={(e) => setMarkerLimit(parseInt(e.target.value, 10))}>
                                    <option value="10">10</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                    <option value="250">250</option>
                                    <option value="500">500</option>
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
                            {visibleMarkers.length > 0 ? (
                                visibleMarkers.map((marker) => (
                                    <li key={marker.wikidata_id}>
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
