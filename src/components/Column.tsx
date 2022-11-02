import React, { useEffect, useState } from "react";
import { Notes, Note, Block } from "../useNotes";
import { BlockView } from "./BlockView";
import { NoteView } from "./NoteView";

export function ColumnView(props: { notesDb: Notes; notesList: Note[] }) {
  const { notesDb, notesList } = props;

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
          <NoteView key={note.id} note={note} notesDb={notesDb} />
        ))}
      </div>
    </div>
  );
}
