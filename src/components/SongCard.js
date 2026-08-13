import React from "react";
import "./SongCard.css";

function SongCard({ song, onClick }) {
  return (
    <button
      type="button"
      className="song-card-item"
      onClick={() => onClick(song)}
    >
      <div className="song-card-icon">
        🎵
      </div>

      <div className="song-card-info">
        <h3>{song.title}</h3>

        <p>
          {song.artist || "Unknown Artist"}
        </p>

        {song.movie && (
          <span>
            🎬 {song.movie}
          </span>
        )}
      </div>

      <div className="song-card-arrow">
        →
      </div>
    </button>
  );
}

export default SongCard;