import { ReactNode } from "react";
import { Note } from "../useNotes";

export function NoteView({ note, children }: { note: Note; children: ReactNode }) {
  return (
    <div
      style={{
        border: "1px solid black",
        minHeight: "50px",
      }}
    >
      <h1>{note.title}</h1>
      {children}
    </div>
  );
}
