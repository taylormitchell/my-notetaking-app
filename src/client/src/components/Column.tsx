import React, { useEffect, useState } from "react";
import { Notes, NoteItem, Note, LabelItem } from "../model/useNotes";
import { NoteView } from "./NoteView";
import { Link, Navigate } from "react-router-dom";
import { getQuery } from "../util";

export function ColumnView(props: {
  notesDb: Notes;
  notesList: NoteItem[];
  navigate: (path: string) => void;
}) {
  const { notesDb, notesList } = props;
  const query = getQuery();

  let labels: LabelItem[] = [];
  for (const labelId of query.labels || []) {
    const label = notesDb.getLabel(labelId);
    if (label) {
      labels.push(label);
    }
  }

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
        <h1>
          <span>
            {labels.map((label) => (
              <span key={label.id}>{label.name}</span>
            ))}
          </span>
        </h1>
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
          <NoteView
            key={note.id}
            note={new Note(note, notesDb)}
            open={() => props.navigate(`/note/${note.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
