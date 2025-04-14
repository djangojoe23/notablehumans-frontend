import React from "react";
import { ATTRIBUTE_LABELS } from "../constants/humanAttributeLabels";

const HumanDetail = ({ person }) => {
  if (!person) return null;

  const {
    n: name,
    wu: wikipediaSlug,
    by,
    bp,
    dy,
    dp,
    ...attributes
  } = person;

  return (
    <div className="human-info">
      <h2>{name}</h2>

      <p>
        <a href={`https://en.wikipedia.org/wiki/${wikipediaSlug}`} target="_blank" rel="noreferrer">
          View Wikipedia Entry ↗
        </a>
      </p>

      <p><strong>Born:</strong> {by ? `${by}${bp ? ` in ${bp}` : ""}` : "Unknown"}</p>
      <p><strong>Died:</strong> {dy ? `${dy}${dp ? ` in ${dp}` : ""}` : "Unknown"}</p>

      {Object.entries(ATTRIBUTE_LABELS).map(([key, label]) => {
        const value = attributes[key];
        if (!value) return null;

        return (
          <p key={key}>
            <strong>{label}:</strong> {Array.isArray(value) ? value.join(", ") : value}
          </p>
        );
      })}
    </div>
  );
};

export default HumanDetail;
