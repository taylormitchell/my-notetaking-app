import React, { useState } from "react";
import { Notes, Note, Block } from "../useNotes";
import { BlockView } from "./BlockView";
import { NoteView } from "./NoteView";

export function ColumnView(props: { notesDb: Notes; notesList: Note[] }) {
  const { notesDb, notesList } = props;

  return (
    <div
      className="Column"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        height: "100%",
      }}
    >
      <div
        className="notes"
        style={{
          display: "flex",
          flexDirection: "column-reverse",
          overflowY: "scroll",
          height: "100%",
          padding: "10px",
        }}
      >
        {notesList
          .slice()
          .reverse()
          .map((note) => (
            <NoteView key={note.id} note={note} notesDb={notesDb} />
          ))}
      </div>

      <button onClick={() => notesDb.addNote()}>Add Note</button>
    </div>
  );
}
