import { useEffect, useRef, useState } from "react";
import { Notes, Note, Block, useNotes, NoteRecord } from "../useNotes";
import { NoteView } from "./NoteView";

function Entry({ addNote }: { addNote: (note: Note) => void }) {
  const [refocus, setRefocus] = useState(false);
  const [focus, setFocus] = useState(false);
  const entryNotes = useNotes([new Note()]);
  const [note] = entryNotes.getAll();

  function submitNote() {
    addNote({ ...note, createdAt: Date.now(), updatedAt: Date.now() });
    entryNotes.clear();
    entryNotes.addNote();
    if (!entryRef.current) return;
    const elSelected = document.getSelection()?.anchorNode?.parentElement;
    if (elSelected && entryRef.current.contains(elSelected)) {
      setRefocus(true);
    }
  }

  // Refocus after clearing the entry
  const entryRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!refocus) return;
    if (!entryRef.current) return;
    const el = entryRef.current.querySelector(".block-text");
    if (!(el instanceof HTMLElement)) return;
    el.focus();
    setRefocus(false);
  }, [refocus]);

  if (!note) return null;
  return (
    <div
      className="Entry"
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        borderTop: "1px solid lightgray",
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && e.metaKey) {
          e.preventDefault();
          submitNote();
        }
      }}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
    >
      <div ref={entryRef} className="Entry__input" style={{ width: "100%" }}>
        <NoteView notesDb={entryNotes} note={note} />
      </div>
      <button
        style={{
          width: "30px",
          height: "30px",
          borderRadius: "50%",
          color: "white",
          backgroundColor: focus ? "blue" : "lightgray",
          border: "none",
        }}
        onClick={submitNote}
      >
        ↑
      </button>
    </div>
  );
}

export default Entry;
