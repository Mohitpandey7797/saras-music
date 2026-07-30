import React, { useState } from "react";

export default function SearchBar({ songs, setSelectedSong }) {
  const [query, setQuery] = useState("");

  const filtered = songs.filter(song =>
    song.title.toLowerCase().startsWith(query.toLowerCase())
  );

  return (
    <div>
      <input
        type="text"
        placeholder="Search Song..."
        value={query}
        onChange={e => setQuery(e.target.value)}
      />

      {query && (
        <div>
          {filtered.map(song => (
            <div
              key={song.id}
              onClick={() => {
                setSelectedSong(song);
                setQuery("");
              }}
            >
              {song.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}