import React from 'react';
import { ATTRIBUTE_LABELS } from '../constants/humanAttributeLabels';
import { formatDate } from '../utils/format';
import { FaMapMarkerAlt, FaWikipediaW } from 'react-icons/fa';
import { SiWikidata } from 'react-icons/si';
import { PiListMagnifyingGlass } from 'react-icons/pi';

import '../styles/components/human-detail.css';

export const formatAttributeLabel = (key) => {
  const rawLabel = ATTRIBUTE_LABELS[key] || key;
  return rawLabel
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const HumanDetail = ({ person, scrollToPerson, onFlyTo }) => {
  if (!person) return null;

  const {
    n: name,
    d: description,
    id: wikidataId,
    wu: wikipediaSlug,
    lat,
    lng,
    by,
    bd,
    bp,
    dy,
    dd,
    dp,
    ...attributes
  } = person;

  return (
    <div className="human-detail">
      {/* Header */}
      <div className="human-detail-header">
        <h2>{name}</h2>
      </div>

      {/* Description */}
      {description && (
        <p className="human-detail-desc">{description}</p>
      )}

      {/* Icons Row */}
      <div className="human-detail-icons">
        <div className="icon-cell">
          <button
            onClick={() => scrollToPerson?.(person)}
            title="Scroll to name in list"
            className="detail-icon"
          >
            <PiListMagnifyingGlass size={20} />
          </button>
        </div>
        <div className="icon-cell">
          <button
            onClick={() => onFlyTo?.({ lng, lat })}
            title="Fly to marker"
            className="pulse-icon"
          >
            <FaMapMarkerAlt size={20} />
          </button>
        </div>
        <div className="icon-cell">
          <a
            href={`https://en.wikipedia.org/wiki/${wikipediaSlug}`}
            target="_blank"
            rel="noreferrer"
            title="View Wikipedia entry"
            className="detail-icon"
          >
            <FaWikipediaW size={20} />
          </a>
        </div>
        <div className="icon-cell">
          <a
            href={`https://www.wikidata.org/wiki/${wikidataId}`}
            target="_blank"
            rel="noreferrer"
            title="View Wikidata entry"
            className="detail-icon"
          >
            <SiWikidata size={20} />
          </a>
        </div>
      </div>

      {/* Other Attributes */}
      <dl className="human-attributes">
          <dt>Born</dt>
          <dd>
            {bd
              ? `${formatDate(bd)}${bp ? ` in ${bp}` : ''}`
              : 'Unknown'}
          </dd>

          {/* Died */}
          <dt>Died</dt>
          <dd>
            {dd
              ? `${formatDate(dd)}${dp ? ` in ${dp}` : ''}`
              : '-'}
          </dd>
        {Object.entries(ATTRIBUTE_LABELS).map(([key]) => {
          let value = attributes[key];
          if (!value) return null;
          // parse stringified arrays
          if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
            try { value = JSON.parse(value); } catch {};
          }
          return (
            <React.Fragment key={key}>
              <dt>{formatAttributeLabel(key)}</dt>
              <dd>{Array.isArray(value) ? value.join(', ') : value}</dd>
            </React.Fragment>
          );
        })}
      </dl>
    </div>
  );
};

export default HumanDetail;
