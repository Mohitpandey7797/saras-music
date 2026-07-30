import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import SongViewer from "./components/SongViewer";
import songs from "./data/songs.json";

function App() {
  const [selectedSong, setSelectedSong] = useState(() => {
    const savedSong = sessionStorage.getItem("selectedSong");
    return savedSong ? JSON.parse(savedSong) : null;
  });

  const [search, setSearch] = useState("");
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "dark";
  });

  const suggestionsRef = useRef([]);

  // Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // Search Filter
  useEffect(() => {
    if (search.trim() === "") {
      setFilteredSongs([]);
      return;
    }

    const results = songs.filter(
      (song) =>
        song.title.toLowerCase().includes(search.toLowerCase()) ||
        song.artist.toLowerCase().includes(search.toLowerCase())
    );

    const uniqueSongs = Array.from(
      new Map(results.map((song) => [song.title, song])).values()
    );

    setFilteredSongs(uniqueSongs);
  }, [search]);

  // Scroll active suggestion into view
  useEffect(() => {
    if (highlightIndex >= 0) {
      suggestionsRef.current[highlightIndex]?.scrollIntoView({
        block: "nearest",
      });
    }
  }, [highlightIndex]);

  const openSong = (song) => {
    setSelectedSong(song);
    sessionStorage.setItem("selectedSong", JSON.stringify(song));

    setSearch("");
    setFilteredSongs([]);
    setHighlightIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      setHighlightIndex((prev) =>
        prev < filteredSongs.length - 1 ? prev + 1 : prev
      );
    }

    if (e.key === "ArrowUp") {
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : 0));
    }

    if (e.key === "Enter" && highlightIndex >= 0) {
      openSong(filteredSongs[highlightIndex]);
    }
  };

  // Song View
  if (selectedSong) {
    return (
      <div className="app-wrapper">
        <button
          className="back-btn"
          onClick={() => {
            setSelectedSong(null);
            sessionStorage.removeItem("selectedSong");
          }}
        >
          ← Back
        </button>

        <SongViewer song={selectedSong} />
      </div>
    );
  }

  // Home Page
  return (
    <div className="home-container">
      <div className="top-bar">
        <h1 className="logo">🎸 Saras Music</h1>

        <button
          className="theme-toggle"
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? "☀ Light" : "🌙 Dark"}
        </button>
      </div>

      <div className="search-box">
        <input
          type="text"
          placeholder="Search song..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {filteredSongs.length > 0 && (
          <div className="suggestions">
            {filteredSongs.map((song, index) => (
              <div
                key={song.id}
                ref={(el) => (suggestionsRef.current[index] = el)}
                className={`suggestion-item ${
                  index === highlightIndex ? "active" : ""
                }`}
                onClick={() => openSong(song)}
              >
                {song.title} • {song.artist}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;