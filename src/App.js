import React, { useEffect, useState } from "react";
import "./App.css";
import SongCard from "./components/SongCard";

import SearchBar from "./components/SearchBar";
import SongViewer from "./components/SongViewer";

import songs from "./data/songs.json";

function App() {
  const [selectedSong, setSelectedSong] = useState(() => {
    const savedSong = sessionStorage.getItem("selectedSong");
    return savedSong ? JSON.parse(savedSong) : null;
  });

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  const [showAllSongs, setShowAllSongs] = useState(false);

  const [sortOption, setSortOption] = useState("title-az");
  const [songFilter, setSongFilter] = useState("");

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
  if (selectedSong) {
    window.scrollTo({
      top: 0,
      behavior: "instant",
    });
  }
}, [selectedSong]);


  const openSong = (song) => {
  setSelectedSong(song);

  sessionStorage.setItem(
    "selectedSong",
    JSON.stringify(song)
  );

  window.scrollTo({
    top: 0,
    behavior: "instant",
  });
};

  const closeSong = () => {
    setSelectedSong(null);
    sessionStorage.removeItem("selectedSong");
  };

  const filteredAndSortedSongs = [...songs]
  .filter((song) => {
    const query = songFilter.trim().toLowerCase();

    if (!query) return true;

    return (
      song.title?.toLowerCase().includes(query) ||
      song.artist?.toLowerCase().includes(query) ||
      song.movie?.toLowerCase().includes(query)
    );
  })
  .sort((a, b) => {
    if (sortOption === "title-az") {
      return a.title.localeCompare(b.title);
    }

    if (sortOption === "title-za") {
      return b.title.localeCompare(a.title);
    }

    if (sortOption === "artist-az") {
      return (a.artist || "").localeCompare(b.artist || "");
    }

    return 0;
  });

const visibleSongs = showAllSongs
  ? filteredAndSortedSongs
  : filteredAndSortedSongs.slice(0, 8);


  /* =========================
     SONG PAGE
  ========================= */

  if (selectedSong) {
    return (
      <div className="song-page">

        <div className="song-top-bar">

          <button
            className="back-btn"
            onClick={closeSong}
          >
            ← Back
          </button>

          <button
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? "☀ Light" : "🌙 Dark"}
          </button>

        </div>

        <SongViewer song={selectedSong} />

      </div>
    );
  }

  /* =========================
     HOME PAGE
  ========================= */

  return (
    <main className="home-container">

      <div className="top-bar">

        <div className="brand-area">
          <div className="logo">
            🎸 Saras Music
          </div>
        </div>

        <button
          className="theme-toggle"
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? "☀ Light" : "🌙 Dark"}
        </button>

      </div>

      <p className="home-subtitle">
        Guitar Chords & Lyrics
      </p>

      <div className="search-section">

        <SearchBar
          songs={songs}
          setSelectedSong={openSong}
        />

        <p className="search-helper">
          Search by song, artist or movie
        </p>

      </div>

      <section className="popular-section">

  <div className="section-heading">
    <div>
      <h2>Popular Songs</h2>
      <p>Play your favorite songs with guitar chords</p>
    </div>

    <span className="song-count">
      {songs.length} Songs
    </span>
  </div>

  <div className="song-grid">
    {songs.slice(0, 6).map((song) => (
      <SongCard
        key={song.id}
        song={song}
        onClick={openSong}
      />
    ))}
  </div>

</section>


<section className="recent-section">

  <div className="section-heading">
    <div>
      <h2>Recently Added</h2>
      <p>Latest songs added to Saras Music</p>
    </div>
  </div>

  <div className="recent-list">
    {songs
      .slice(-6)
      .reverse()
      .map((song) => (
        <SongCard
          key={`recent-${song.id}`}
          song={song}
          onClick={openSong}
        />
      ))}
  </div>

</section>



<section className="all-songs-section">

  <div className="section-heading">

    <div>
      <h2>All Songs</h2>

      <p>
        Browse the complete Saras Music collection
      </p>
    </div>

    <span className="song-count">
      {filteredAndSortedSongs.length} Songs
    </span>

  </div>


  {/* =========================
      FILTER & SORT TOOLBAR
  ========================= */}

  <div className="songs-toolbar">

    <div className="song-filter-box">

      <span>
        🔎
      </span>

      <input
        type="text"
        placeholder="Filter songs..."
        value={songFilter}
        onChange={(e) => {
          setSongFilter(e.target.value);
          setShowAllSongs(true);
        }}
      />

      {songFilter && (
        <button
          type="button"
          onClick={() => setSongFilter("")}
          aria-label="Clear filter"
        >
          ×
        </button>
      )}

    </div>


    <select
      className="song-sort-select"
      value={sortOption}
      onChange={(e) => {
        setSortOption(e.target.value);
        setShowAllSongs(false);
      }}
    >

      <option value="title-az">
        Title A–Z
      </option>

      <option value="title-za">
        Title Z–A
      </option>

      <option value="artist-az">
        Artist A–Z
      </option>

    </select>

  </div>


  {/* =========================
      SONG GRID
  ========================= */}

  {visibleSongs.length > 0 ? (

    <div className="song-grid">

      {visibleSongs.map((song) => (

        <SongCard
          key={`all-${song.id}`}
          song={song}
          onClick={openSong}
        />

      ))}

    </div>

  ) : (

    <div className="no-library-results">

      <div>
        🎸
      </div>

      <strong>
        No songs found
      </strong>

      <span>
        Try another song, artist or movie.
      </span>

    </div>

  )}


  {/* =========================
      VIEW ALL
  ========================= */}

  {filteredAndSortedSongs.length > 8 && (

    <button
      className="view-all-btn"
      onClick={() =>
        setShowAllSongs(!showAllSongs)
      }
    >

      {showAllSongs
        ? "Show Less ↑"
        : `View All ${filteredAndSortedSongs.length} Songs →`}

    </button>

  )}

</section>

      <div className="home-stats">

        <div className="stat-item">
          <strong>{songs.length}</strong>
          <span>Songs</span>
        </div>

        <div className="stat-divider" />

        <div className="stat-item">
          <strong>🎸</strong>
          <span>Guitar Chords</span>
        </div>

        <div className="stat-divider" />

        <div className="stat-item">
          <strong>🎵</strong>
          <span>Lyrics</span>
        </div>

      </div>

      <footer className="home-footer">
        <span>
          © {new Date().getFullYear()} Saras Music
        </span>

        <span>
          Learn • Play • Sing
        </span>
      </footer>

    </main>
  );
}

export default App;

const ids = songs.map((song) => song.id);

console.log("Total songs:", songs.length);
console.log("Highest ID:", Math.max(...ids));

console.log(
  "Missing IDs:",
  Array.from(
    { length: Math.max(...ids) },
    (_, i) => i + 1
  ).filter((id) => !ids.includes(id))
);