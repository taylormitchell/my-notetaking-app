import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import "./App.css";
import { ColumnView } from "./components/Column";
import { useNotes } from "./useNotes";

function App() {
  const notes = useNotes([
    {
      title: "Note 1",
      lines: ["This is a note", "It has two lines"],
    },
    {
      title: "Note 2",
      lines: ["This is another note", "It also has two lines"],
    },
  ]);

  const noteList = notes.getAll().sort((a, b) => a.createdAt - b.createdAt);

  return (
    <div className="App">
      <ColumnView notesDb={notes} notesList={noteList} />
    </div>
  );
}

export default App;
