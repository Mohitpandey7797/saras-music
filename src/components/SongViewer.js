import React, { useEffect, useMemo, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import "./SongViewer.css";

const CHORDS_ORDER = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

const CHORD_ALIASES = {
  Db: "C#",
  Eb: "D#",
  Gb: "F#",
  Ab: "G#",
  Bb: "A#",
};

function getOrdinal(n) {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
}

function transposeChord(chord, steps) {
  if (!chord) return chord;

  const match = chord.match(/^([A-G](?:#|b)?)(.*)$/);

  if (!match) return chord;

  const originalRoot = match[1];
  const rest = match[2];

  const normalizedRoot =
    CHORD_ALIASES[originalRoot] || originalRoot;

  const index = CHORDS_ORDER.indexOf(normalizedRoot);

  if (index === -1) return chord;

  const newIndex =
    ((index + steps) % 12 + 12) % 12;

  return CHORDS_ORDER[newIndex] + rest;
}

function renderLine(
  line,
  steps,
  activeChord,
  setActiveChord,
  lineIndex
) {
  const parts = line.split(/(\([^)]*\))/g);

  let chordIndex = 0;

  return parts.map((part, index) => {
    if (part.startsWith("(") && part.endsWith(")")) {
      const originalChord = part.slice(1, -1);

      const transposed = transposeChord(
        originalChord,
        steps
      );

      // हर chord की पूरी तरह unique identity
      const currentChordIndex = chordIndex++;

      const chordId = `${lineIndex}-${currentChordIndex}`;

      const isActive = activeChord === chordId;

      return (
        <span
          key={`${lineIndex}-${index}`}
          className={`chord chord-clickable ${isActive ? "chord-active" : ""
            }`}
          onClick={() =>
            setActiveChord(
              isActive ? null : chordId
            )
          }
        >
          ({transposed})

          {isActive && (
            <span className="chord-diagram-popup">
              <img
                src={`${process.env.PUBLIC_URL}/chord-diagrams/${transposed.replace("#", "s")}.png`}
                alt={`${transposed} guitar chord`}
                className="chord-diagram-image"
              />
            </span>
          )}
        </span>
      );
    }

    return (
      <span key={`${lineIndex}-${index}`}>
        {part}
      </span>
    );
  });
}

function SongViewer({ song }) {
  const [transpose, setTranspose] = useState(0);
  const [readingMode, setReadingMode] = useState(false);
  const [activeChord, setActiveChord] = useState(null);

  const [autoScroll, setAutoScroll] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1.0);

  const scrollAnimationRef = useRef(null);


  // =========================================================
  // AUTO SCROLL
  // =========================================================



  const changeScrollSpeed = (change) => {
    setScrollSpeed((current) => {
      const next = Number(
        (current + change).toFixed(1)
      );

      return Math.min(
        1.5,
        Math.max(0.1, next)
      );
    });
  };


  useEffect(() => {
    if (!autoScroll) {
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
        scrollAnimationRef.current = null;
      }
      return;
    }

    let lastTime = performance.now();
    let scrollAccumulator = 0;

    const NORMAL_SPEED = 32;

    const animate = (currentTime) => {
      const deltaTime = Math.min(
        currentTime - lastTime,
        50
      );

      lastTime = currentTime;

      const pixelsToMove =
        NORMAL_SPEED *
        scrollSpeed *
        (deltaTime / 1000);

      scrollAccumulator += pixelsToMove;

      // Only move when enough distance has accumulated
      if (scrollAccumulator >= 0.1) {
        window.scrollBy(
          0,
          scrollAccumulator
        );

        scrollAccumulator = 0;
      }

      const atBottom =
        window.scrollY +
        window.innerHeight >=
        document.documentElement.scrollHeight - 2;

      if (atBottom) {
        setAutoScroll(false);
        scrollAnimationRef.current = null;
        return;
      }

      scrollAnimationRef.current =
        requestAnimationFrame(animate);
    };

    scrollAnimationRef.current =
      requestAnimationFrame(animate);

    return () => {
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(
          scrollAnimationRef.current
        );

        scrollAnimationRef.current = null;
      }
    };
  }, [autoScroll, scrollSpeed]);

  // =========================================================
  // RESET AUTO SCROLL
  // =========================================================

  const resetAutoScroll = () => {
    setAutoScroll(false);

    if (scrollAnimationRef.current) {
      cancelAnimationFrame(
        scrollAnimationRef.current
      );

      scrollAnimationRef.current = null;
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };


  const copySong = async () => {
    if (!song) return;

    const lines = [];

    lines.push(song.title);

    if (song.artist || song.movie || song.year) {
      lines.push(
        [song.artist, song.movie, song.year]
          .filter(Boolean)
          .join(" • ")
      );
    }

    lines.push("");

    if (song.scale) {
      lines.push(`Scale: ${song.scale}`);
    }

    if (song.capo !== undefined) {
      lines.push(
        `Capo: ${song.capo === 0
          ? "No Capo"
          : `${getOrdinal(song.capo)} Fret`
        }`
      );
    }

    if (song.strumming) {
      lines.push(`Strumming: ${song.strumming}`);
    }

    lines.push("");
    lines.push("--------------------------------");
    lines.push("");

    song.content?.forEach((item) => {
      if (item.section) {
        lines.push("");
        lines.push(`[${item.section}]`);
        lines.push("");
      }

      if (item.block) {
        const parts = item.block.split(/(\([^)]*\))/g);

        const transposedLine = parts
          .map((part) => {
            if (
              part.startsWith("(") &&
              part.endsWith(")")
            ) {
              const originalChord = part.slice(1, -1);

              return `(${transposeChord(
                originalChord,
                transpose
              )})`;
            }

            return part;
          })
          .join("");

        lines.push(transposedLine);
      }
    });

    try {
      await navigator.clipboard.writeText(
        lines.join("\n")
      );

      alert("Song copied successfully! 🎸");
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  const downloadPDF = () => {
    if (!song) return;

    const pdf = new jsPDF({
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const margin = 18;
    const contentWidth = pageWidth - margin * 2;

    let y = 20;

    // -------------------------
    // TITLE
    // -------------------------

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);

    pdf.text(song.title || "Untitled Song", margin, y);

    y += 8;

    // -------------------------
    // ARTIST / MOVIE / YEAR
    // -------------------------

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);

    const details = [
      song.artist,
      song.movie,
      song.year,
    ]
      .filter(Boolean)
      .join(" • ");

    if (details) {
      pdf.text(details, margin, y);
      y += 8;
    }

    // -------------------------
    // SONG INFO
    // -------------------------

    pdf.setFontSize(10);

    if (song.scale) {
      pdf.text(`Scale: ${song.scale}`, margin, y);
      y += 5;
    }

    if (song.capo !== undefined) {
      const capoText =
        song.capo === 0
          ? "No Capo"
          : `${getOrdinal(song.capo)} Fret`;

      pdf.text(`Capo: ${capoText}`, margin, y);
      y += 5;
    }

    if (song.strumming) {
      pdf.text(
        `Strumming: ${song.strumming}`,
        margin,
        y
      );

      y += 5;
    }

    y += 4;

    // -------------------------
    // DIVIDER
    // -------------------------

    pdf.setDrawColor(210, 210, 210);

    pdf.line(
      margin,
      y,
      pageWidth - margin,
      y
    );

    y += 8;

    // -------------------------
    // SONG CONTENT
    // -------------------------

    song.content?.forEach((item) => {

      // Section heading
      if (item.section) {

        if (y > pageHeight - 25) {
          pdf.addPage();
          y = 20;
        }

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);

        pdf.text(
          `[${item.section}]`,
          margin,
          y
        );

        y += 7;
      }

      // Lyrics / chords
      if (item.block) {

        const parts = item.block.split(
          /(\([^)]*\))/g
        );

        const transposedLine = parts
          .map((part) => {

            if (
              part.startsWith("(") &&
              part.endsWith(")")
            ) {

              const originalChord =
                part.slice(1, -1);

              return `(${transposeChord(
                originalChord,
                transpose
              )})`;
            }

            return part;
          })
          .join("");

        pdf.setFont("courier", "normal");
        pdf.setFontSize(9.5);

        const wrappedLines =
          pdf.splitTextToSize(
            transposedLine,
            contentWidth
          );

        wrappedLines.forEach((textLine) => {

          if (y > pageHeight - 20) {
            pdf.addPage();
            y = 20;
          }

          pdf.text(
            textLine,
            margin,
            y
          );

          y += 5;
        });

        y += 2;
      }
    });

    // -------------------------
    // FOOTER
    // -------------------------

    const totalPages =
      pdf.internal.getNumberOfPages();

    for (let page = 1; page <= totalPages; page++) {

      pdf.setPage(page);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);

      pdf.setTextColor(130, 130, 130);

      pdf.text(
        "Saras Music • Learn • Play • Sing",
        margin,
        pageHeight - 10
      );

      pdf.text(
        `Page ${page} of ${totalPages}`,
        pageWidth - margin,
        pageHeight - 10,
        {
          align: "right",
        }
      );
    }

    // Reset text color
    pdf.setTextColor(0, 0, 0);

    // -------------------------
    // DOWNLOAD
    // -------------------------

    const safeTitle =
      (song.title || "song")
        .replace(/[<>:"/\\|?*]/g, "")
        .trim();

    pdf.save(
      `${safeTitle || "song"} - Saras Music.pdf`
    );
  };


  const currentKey = useMemo(() => {
    if (!song.scale) return "—";

    return transposeChord(
      song.scale,
      transpose
    );
  }, [song.scale, transpose]);

  if (!song) return null;

  return (
    <div className="song-wrapper">

      <article className="song-card">

        {/* Header */}

        <header className="song-header">

          <div className="song-heading">

            <h1 className="song-title">
              {song.title}
            </h1>

            <p className="song-artist">
              {song.artist || "Unknown Artist"}

              {song.movie && (
                <>
                  <span> • </span>
                  {song.movie}
                </>
              )}

              {song.year && (
                <>
                  <span> • </span>
                  {song.year}
                </>
              )}
            </p>

          </div>

        </header>


        {/* Song Information */}

        <div className="song-info-grid">

          <div className="info-item">
            <span className="info-label">
              Original Key
            </span>

            <strong>
              {song.scale || "—"}
            </strong>
          </div>


          <div className="info-item current-key">
            <span className="info-label">
              Current Key
            </span>

            <strong>
              {currentKey}
            </strong>
          </div>


          <div className="info-item">
            <span className="info-label">
              Capo
            </span>

            <strong>
              {song.capo === 0
                ? "No Capo"
                : `${getOrdinal(song.capo)} Fret`}
            </strong>
          </div>

        </div>


        {/* Strumming */}

        {song.strumming && (
          <div className="strumming-box">

            <span className="strumming-icon">
              🥁
            </span>

            <div>
              <span className="strumming-label">
                Strumming Pattern
              </span>

              <strong>
                {song.strumming}
              </strong>
            </div>

          </div>
        )}


        {/* Transpose */}

        <div className="transpose-box">

          <div className="transpose-heading">

            <div>
              <strong>
                Transpose
              </strong>

              <span>
                Adjust the key for your voice
              </span>
            </div>

            {transpose !== 0 && (
              <button
                className="reset-transpose"
                onClick={() => {
                  setTranspose(0);
                  setActiveChord(null);
                }}
              >
                Reset
              </button>
            )}

          </div>


          <div className="transpose-controls">

            <button
              className="transpose-btn"
              onClick={() => {
                setTranspose((value) => value - 1);
                setActiveChord(null);

              }}




              aria-label="Transpose down"
            >
              −
            </button>

            <div className="transpose-value">

              <strong>
                {transpose > 0
                  ? `+${transpose}`
                  : transpose}
              </strong>

              <span>
                semitone
                {Math.abs(transpose) !== 1
                  ? "s"
                  : ""}
              </span>

            </div>

            <button
              className="transpose-btn"
              onClick={() => {
                setTranspose((value) => value + 1);
                setActiveChord(null);
              }}
              aria-label="Transpose up"
            >
              +
            </button>

          </div>

        </div>

        <div className="song-actions">

          <button
            className="song-action-btn"
            onClick={copySong}
          >
            📋 Copy
          </button>

          <button
            className="song-action-btn"
            onClick={downloadPDF}
          >
            📄 PDF
          </button>

        </div>



        <div className="auto-scroll-box">

          {/* START / PAUSE */}

          <button
            type="button"
            className={`auto-scroll-start ${autoScroll ? "active" : ""
              }`}
            onClick={() =>
              setAutoScroll((current) => !current)
            }
          >
            {autoScroll
              ? "⏸ Pause"
              : "▶ Auto Scroll"}
          </button>


          {/* SPEED */}

          <div className="scroll-speed-controls">

            <button
              type="button"
              className="scroll-speed-btn"
              onClick={() => changeScrollSpeed(-0.1)}
              disabled={scrollSpeed <= 0.1}
              aria-label="Decrease scroll speed"
            >
              −
            </button>


            <div className="scroll-speed-display">

              <span>Speed</span>

              <strong>
                {scrollSpeed.toFixed(1)}×
              </strong>

            </div>


            <button
              type="button"
              className="scroll-speed-btn"
              onClick={() => changeScrollSpeed(0.1)}
              disabled={scrollSpeed >= 1.5}
              aria-label="Increase scroll speed"
            >
              +
            </button>

          </div>


          {/* RESET */}

          <button
            type="button"
            className="scroll-reset-btn"
            onClick={resetAutoScroll}
            aria-label="Reset auto scroll"
          >
            ↻
          </button>

        </div>



        <div className="reading-mode-control">
          <button
            className={`reading-mode-btn ${readingMode ? "active" : ""
              }`}
            onClick={() => setReadingMode(!readingMode)}
          >
            {readingMode ? "📖 Reading Mode" : "🎸 Normal Mode"}
          </button>
        </div>




        {/* Lyrics */}

        <div
          className={`lyrics-section ${readingMode ? "reading-mode" : ""
            }`}
        >

          {song.content?.map((item, index) => {

            if (item.section) {
              return (
                <h2
                  key={index}
                  className="section-title"
                >
                  {item.section}
                </h2>
              );
            }

            if (item.block) {
              return (
                <div
                  key={index}
                  className="lyrics-line"
                >
                  {renderLine(
                    item.block,
                    transpose,
                    activeChord,
                    setActiveChord,
                    index
                  )}
                </div>
              );
            }

            return null;
          })}

        </div>

      </article>

    </div>
  );
}

export default SongViewer;