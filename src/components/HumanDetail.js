import React from "react";
import { ATTRIBUTE_LABELS } from "../constants/humanAttributeLabels";
import { formatYear } from '../utils/format';
import { FaMapMarkerAlt, FaInfo, FaWikipediaW } from 'react-icons/fa';
import { SiWikidata } from "react-icons/si";


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
      id: wikidataId,
    wu: wikipediaSlug,
    lat,
    lng,
    by,
    bp,
    dy,
    dp,
    ...attributes
  } = person;

   return (
    <div className="human-info" style={{ width: '100%' }}>
      {/* Name */}
      <h2 style={{
        fontSize: '1.25rem',
        fontWeight: 600,
        margin: 0,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis'
      }}>
        {name}
      </h2>

      {/* Icons below name */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        margin: '0.5rem 0'
      }}>

        <button
            onClick={() => scrollToPerson?.(person)}
            title="Scroll to name in list"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
            <FaInfo size={20} />
        </button>

        <button
         onClick={() => onFlyTo?.({lng, lat})}
        title="Fly to marker"
        style={{ flex: '0 0 auto', padding: 0, background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <FaMapMarkerAlt style={{ width: '1.25rem', height: '1.25rem' }} />
      </button>

        <a
          href={`https://en.wikipedia.org/wiki/${wikipediaSlug}`}
          target="_blank"
          rel="noreferrer"
          title="View Wikipedia Entry"
          style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}
        >
          <FaWikipediaW size={20} />
        </a>

          <a
          href={`https://www.wikidata.org/wiki/${wikidataId}`}
          target="_blank"
          rel="noreferrer"
          title="View Wikidata Entry"
          style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}
        >
          <SiWikidata size={20} />
        </a>
      </div>

      {/* Birth / Death Info */}
      <p>
        <strong>Born:</strong>{' '}
        {by != null ? `${formatYear(by)}${bp ? ` in ${bp}` : ''}` : 'Unknown'}
      </p>
      <p>
        <strong>Died:</strong>{' '}
        {dy != null ? `${formatYear(dy)}${dp ? ` in ${dp}` : ''}` : 'Unknown'}
      </p>

      {/* Other attributes */}
      {Object.entries(ATTRIBUTE_LABELS).map(([key]) => {
        let value = attributes[key];
        if (!value) return null;

        // Parse stringified arrays like '["politician"]'
        if (
          typeof value === 'string' &&
          value.startsWith('[') &&
          value.endsWith(']')
        ) {
          try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) value = parsed;
          } catch (err) {
            // leave as-is
          }
        }

        return (
          <p key={key}>
            <strong>{formatAttributeLabel(key)}:</strong>{' '}
            {Array.isArray(value) ? value.join(', ') : value}
          </p>
        );
      })}
    </div>
  );
};

export default HumanDetail;
