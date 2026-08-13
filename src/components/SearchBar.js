import React, { useEffect, useRef, useState } from "react";
import "./SearchBar.css";

function SearchBar({ songs, setSelectedSong }) {
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const inputRef = useRef(null);
  const suggestionsRef = useRef([]);

  const searchText = query.trim().toLowerCase();

  const rankedSongs =
    searchText === ""
      ? []
      : songs
        .map((song) => {
          const title = song.title?.toLowerCase() || "";
          const artist = song.artist?.toLowerCase() || "";
          const movie = song.movie?.toLowerCase() || "";

          let score = 0;

          // Title gets highest priority
          if (title === searchText) {
            score = 100;
          } else if (title.startsWith(searchText)) {
            score = 90;
          } else if (title.includes(searchText)) {
            score = 80;
          }

          // Artist
          else if (artist.startsWith(searchText)) {
            score = 70;
          } else if (artist.includes(searchText)) {
            score = 60;
          }

          // Movie
          else if (movie.startsWith(searchText)) {
            score = 50;
          } else if (movie.includes(searchText)) {
            score = 40;
          }

          return {
            song,
            score,
          };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => {
          if (b.score !== a.score) {
            return b.score - a.score;
          }

          return a.song.title.localeCompare(b.song.title);
        })
        .filter(
          (item, index, array) =>
            array.findIndex(
              (entry) =>
                entry.song.title === item.song.title
            ) === index
        );

  const filteredSongs = rankedSongs
    .slice(0, 8)
    .map((item) => item.song);



  useEffect(() => {
    setHighlightIndex(-1);
  }, [query]);

  useEffect(() => {
    if (highlightIndex >= 0) {
      suggestionsRef.current[highlightIndex]?.scrollIntoView({
        block: "nearest",
      });
    }
  }, [highlightIndex]);

  const openSong = (song) => {
    setSelectedSong(song);
    setQuery("");
    setHighlightIndex(-1);

    sessionStorage.setItem(
      "selectedSong",
      JSON.stringify(song)
    );
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();

      setHighlightIndex((previous) =>
        previous < filteredSongs.length - 1
          ? previous + 1
          : previous
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      setHighlightIndex((previous) =>
        previous > 0 ? previous - 1 : 0
      );
    }

    if (
      event.key === "Enter" &&
      highlightIndex >= 0 &&
      filteredSongs[highlightIndex]
    ) {
      openSong(filteredSongs[highlightIndex]);
    }

    if (event.key === "Escape") {
      setQuery("");
      setHighlightIndex(-1);
      inputRef.current?.blur();
    }
  };

  const clearSearch = () => {
    setQuery("");
    setHighlightIndex(-1);
    inputRef.current?.focus();
  };

  const highlightMatch = (text) => {
    if (!text || !searchText) {
      return text;
    }

    const parts = text.split(
      new RegExp(`(${searchText})`, "gi")
    );

    return parts.map((part, index) => {
      if (
        part.toLowerCase() === searchText
      ) {
        return (
          <mark
            key={index}
            className="search-highlight"
          >
            {part}
          </mark>
        );
      }

      return part;
    });
  };


  return (
    <div className="professional-search">

      <div className="search-input-wrapper">

        <span className="search-icon" aria-hidden="true">
          🔎
        </span>

        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder="Search songs, artists or movies..."
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          aria-label="Search songs"
        />

        {query && (
          <button
            type="button"
            className="clear-search"
            onClick={clearSearch}
            aria-label="Clear search"
          >
            ×
          </button>
        )}

        {!query && (
          <span className="search-shortcut">
            /
          </span>
        )}

      </div>


      {query && (
        <div className="search-results">

          {filteredSongs.length > 0 ? (
            <>
              <div className="results-header">
                <span>SONGS</span>

                <span>
                  {filteredSongs.length}
                  {filteredSongs.length === 8 ? "+" : ""}
                </span>
              </div>

              {filteredSongs.map((song, index) => (
                <button
                  key={song.id}
                  ref={(element) => {
                    suggestionsRef.current[index] = element;
                  }}
                  type="button"
                  className={`search-result ${index === highlightIndex
                    ? "active"
                    : ""
                    }`}
                  onClick={() => openSong(song)}
                >

                  <span className="result-music-icon">
                    🎵
                  </span>

                  <span className="result-details">

                    <strong>
                      {highlightMatch(song.title)}
                    </strong>

                    <span>
                      {highlightMatch(song.artist || "Unknown Artist")}

                      {song.movie && (
                        <>
                          <span className="result-dot">
                            •
                          </span>

                          {highlightMatch(song.movie)}
                        </>
                      )}
                    </span>

                  </span>

                  <span className="result-arrow">
                    →
                  </span>

                </button>
              ))}
            </>
          ) : (
            <div className="no-results">

              <span className="no-results-icon">
                🎸
              </span>

              <strong>
                No songs found
              </strong>

              <span>
                Try another song, artist or movie
              </span>

            </div>
          )}

        </div>
      )}

    </div>
  );
}

export default SearchBar;