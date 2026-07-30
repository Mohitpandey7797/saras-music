import React, { useState } from "react";
import "./SongViewer.css";

const chordsOrder = [
  "C", "C#", "D", "D#", "E", "F",
  "F#", "G", "G#", "A", "A#", "B"
];

function getOrdinal(n) {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return n + "th";
}

function transposeChord(chord, steps) {
  const match = chord.match(/^([A-G]#?)(.*)$/);
  if (!match) return chord;

  const root = match[1];
  const rest = match[2];

  const index = chordsOrder.indexOf(root);
  if (index === -1) return chord;

  let newIndex = (index + steps) % 12;
  if (newIndex < 0) newIndex += 12;

  return chordsOrder[newIndex] + rest;
}

function renderLine(line, steps) {
  const parts = line.split(/(\([^)]+\))/g);

  return parts.map((part, index) => {
    const chordMatch = part.match(/^\(([^)]+)\)$/);

    if (chordMatch) {
      const transposed = transposeChord(chordMatch[1], steps);
      return (
        <span key={index} className="chord">
          ({transposed})
        </span>
      );
    }

    return <span key={index}>{part}</span>;
  });
}
function SongViewer({ song }) {
  const [transpose, setTranspose] = useState(0);

  if (!song) return null;

  return (
    <div className="song-wrapper">
      <div className="song-card">
        <h2 className="song-title">{song.title}</h2>

        <p className="song-artist">
          {song.artist} • {song.movie} • {song.year}
        </p>

        <div className="song-meta">
          <span>Scale: {song.scale}</span>
          <span>
            Capo - {song.capo === 0 ? "No Capo" : `${getOrdinal(song.capo)} Fret`}
          </span>
          {song.strumming && (
            <span>Strumming – {song.strumming}</span>
          )}
        </div>

        <div className="transpose-controls">
          <button onClick={() => setTranspose(transpose - 1)}>-</button>
          <span>Transpose: {transpose}</span>
          <button onClick={() => setTranspose(transpose + 1)}>+</button>
        </div>

        <div className="lyrics-section">
          {song.content &&
            song.content.map((item, index) => {
              if (item.section) {
                return (
                  <h3 key={index} className="section-title">
                    {item.section}
                  </h3>
                );
              }

              if (item.block) {
                return (
                  <pre key={index} className="lyrics-line">
                    {renderLine(item.block, transpose)}
                  </pre>
                );
              }

              return null;
            })}
        </div>
      </div>
    </div>
  );
}

export default SongViewer;