import React, { useEffect, useState } from "react";
import { Notes, NoteItem, Note, LabelItem } from "../model/useNotes";
import { NoteView } from "./NoteView";
import { Link, useNavigate } from "react-router-dom";

export function ColumnView({
  notesDb,
  notesList,
  noteView,
}: {
  notesDb: Notes;
  notesList: NoteItem[];
  noteView: (note: NoteItem) => JSX.Element;
}) {
  const navigate = useNavigate();

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
        overflow: "scroll",
      }}
    >
      {/* <header
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "lightgrey",
        }}
      >
        <Link to="/labels">←</Link>
        <h1>
          <span>
            {labels.map((label) => (
              <span key={label.id}>{label.name}</span>
            ))}
          </span>
        </h1>
      </header> */}
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
        {notesList.map((note) => {
          return noteView(note);
        })}
        <div className="filler" style={{ minHeight: "50px" }} />
      </div>
    </div>
  );
}
