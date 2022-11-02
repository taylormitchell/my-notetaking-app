import { useState } from "react";
import "./App.css";
import { ColumnView } from "./components/Column";
import Entry from "./components/Entry";
import { useNotes, Block, Note } from "./useNotes";

function App() {
  const notes = useNotes([
    {
      // title: "Note 1",
      lines: ["This is a note", "It has two lines"].map((text) => ({
        indent: 0,
        block: new Block({ text }),
      })),
    },
    {
      // title: "Note 2",
      lines: ["This is another note", "It also has two lines"].map((text) => ({
        indent: 0,
        block: new Block({ text }),
      })),
    },
  ]);

  const noteList = notes.getAll().sort((a, b) => a.createdAt - b.createdAt);

  function addNote(note: Note) {
    notes.addNote(note);
  }

  return (
    <div
      className="App"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <ColumnView notesDb={notes} notesList={noteList} />
      <Entry addNote={addNote} />
    </div>
  );
}

export default App;
