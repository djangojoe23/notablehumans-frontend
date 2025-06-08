import React, { useState, useEffect } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { getFilterClauses } from '../utils/filterSummary';

const FilterSummary = ({ filterState, humansCount, sidebarOpen, sidebarWidth }) => {
    const theme = useTheme();
    const buildParams = () => ({
        nameMatchType:   filterState.nameMatchType,
        searchQuery:     filterState.searchQuery,
        dateFilterType:  filterState.dateFilterType,
        filterYear:      filterState.filterYear,
        filterYearRange: filterState.filterYearRange,
        filterMonth:     filterState.filterMonth,
        filterDay:       filterState.filterDay,
        filterAge:       filterState.filterAge,
        filterAgeType:   filterState.filterAgeType,
        attributeFilters:filterState.attributeFilters,
        resultsCount:    humansCount
    });

    const [filterClauses, setFilterClauses] = useState(() => {
        const params = buildParams();
        return getFilterClauses(params);
    });

    // Whenever any underlying value (or humansCount) changes, recompute after 350ms
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            const params = buildParams();
            setFilterClauses(getFilterClauses(params));
        }, 350);
        return () => clearTimeout(timeoutId);
    }, [
        // Dependencies are exactly the values inside initialParams:
        humansCount,
        filterState.nameMatchType,
        filterState.searchQuery,
        filterState.dateFilterType,
        filterState.filterYear,
        filterState.filterYearRange,
        filterState.filterMonth,
        filterState.filterDay,
        filterState.filterAge,
        filterState.filterAgeType,
        filterState.attributeFilters,
    ]);

    return (
        <Box
            sx={{
                position: 'absolute',
                top: 10,
                left: sidebarOpen ? `${sidebarWidth}px` : 0,
                right: 0,
                transition: 'left 300ms ease-in-out',
                display: 'flex',
                justifyContent: 'center',
                pointerEvents: 'none',
                zIndex: 10,
            }}
        >
            <Box
                sx={{
                    backgroundColor: 'rgba(255,255,255,0.85)',
                    borderTop: `1px solid ${theme.palette.divider}`,
                    padding: 1,
                    borderRadius: 1,
                    boxShadow: 1,
                    fontSize: '13px',
                    fontFamily: 'Roboto, sans-serif',
                    pointerEvents: 'none',
                    maxWidth: '85%',
                    whiteSpace: 'normal',
                    textAlign: 'center',
                }}
            >
                {/* First clause on its own line */}
                {filterClauses.length > 0 && (
                    <Typography variant="h6" component="div" sx={{ lineHeight: 1 }}>
                        {filterClauses[0]}
                    </Typography>
                )}

                {/* Remaining clauses joined with “and”, only if any */}
                {filterClauses.length > 1 && (
                    <Typography variant="body2" component="div" sx={{ mt: 0.5, fontSize: '1.1em' }}>
                        {filterClauses.slice(1).map((clause, idx) => {
                            // split into “[prefix]includes” and the values string
                            const [prefix, valuesStr] = clause.split(/includes\s+/);
                            // if it’s not an “includes” clause, render it as-is
                            if (valuesStr == null) {
                                return (
                                    <React.Fragment key={idx}>
                                        {clause}
                                        {idx < filterClauses.length - 2 && ' and '}
                                    </React.Fragment>
                                );
                            }

                            // now split valuesStr on " and " or " or ", keeping the separators
                            const parts = valuesStr.split(/(\s(?:and|or)\s)/);

                            return (
                                <React.Fragment key={idx}>
                                    {prefix}includes{' '}
                                    {parts.map((part, i) => {
                                        // if this part *is* “ and ” or “ or ”, render plain
                                        if (/^( and | or )$/.test(part)) {
                                            return <span key={i}>{part}</span>;
                                        }
                                        // otherwise it’s a value—italicize
                                        return <em key={i}>{part}</em>;
                                    })}
                                    {idx < filterClauses.length - 2 && ' and '}
                                </React.Fragment>
                            );
                        })}
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

export default FilterSummary;
