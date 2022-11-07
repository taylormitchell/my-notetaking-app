import React, { useEffect, useState } from "react";
import { Notes, NoteItem, Note } from "../model/useNotes";
import { NoteView } from "./NoteView";
import { Link } from "react-router-dom";
import url from "url";

export function ColumnView(props: { notesDb: Notes; notesList: NoteItem[] }) {
  const { notesDb, notesList } = props;
  const query = url.parse(document.URL, true).query.q;

  // Scroll to bottom on new note
  const [count, setCount] = useState(0);
  const notesWrapper = React.useRef<HTMLDivElement>(null);
  if (count !== notesList.length) {
    setCount(notesList.length);
  }
  useEffect(() => {
    const el = notesWrapper.current;
    if (!el) return;
    el.scrollTo(0, el.scrollHeight);
  }, [count]);

  return (
    <div
      className="Column"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <header
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "lightgrey",
        }}
      >
        <Link to="/labels">←</Link>
        <h1>{query}</h1>
      </header>
      <div
        ref={notesWrapper}
        className="notes"
        style={{
          display: "flex",
          flexDirection: "column",
          overflowY: "scroll",
          height: "100%",
          padding: "10px",
        }}
      >
        <div className="filler" style={{ height: "100%" }} />
        {notesList.map((note) => (
          <NoteView key={note.id} note={new Note(note, notesDb)} />
        ))}
      </div>
    </div>
  );
}
