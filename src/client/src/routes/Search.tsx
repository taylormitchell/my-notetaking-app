import { ColumnView } from "../components/Column";
import { Notes, LabelItem, NoteId, Note } from "../model/useNotes";
import { NoteView } from "../components/NoteView";
import { getQuery } from "../util";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "../components/Header";
import { useRef } from "react";

export const Search = ({ notes }: { notes: Notes }) => {
  let noteList = notes.getAll().sort((a, b) => a.createdAt - b.createdAt);
  const navigate = useNavigate();
  const query = getQuery();
  const inputRef = useRef<HTMLInputElement>(null);

  if (query.q) {
    noteList = noteList.filter((note) => {
      for (const q of query.q) {
        let match = false;
        for (const line of note.lines) {
          const block = notes.getBlock(line.id);
          if (!block) continue;
          if (block.text.toLowerCase().includes(q.toLowerCase())) {
            match = true;
            break;
          }
        }
        if (!match) return false;
      }
      return true;
    });
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "flex-end",
      }}
    >
      <Header back={() => navigate("/")}></Header>
      <div style={{ flexGrow: 1 }}></div>
      <ColumnView
        notesDb={notes}
        notesList={noteList}
        noteView={(note) => (
          <NoteView
            key={note.id}
            note={new Note(note, notes)}
            onClick={() => navigate(`/note/${note.id}`)}
            editable={false}
          />
        )}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "row",
        }}
      >
        <input
          ref={inputRef}
          style={{
            width: "100%",
            height: "50px",
            fontSize: "1em",
          }}
          type="text"
          placeholder="Search"
          autoFocus
          onChange={(e) => {
            const query = e.target.value;
            if (query.length > 0) {
              navigate(`/search?q=${query}`);
            } else {
              navigate(`/search`);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (inputRef.current) {
                inputRef.current.blur();
              }
            }
          }}
        />
        <button
          onClick={(e) => {
            e.preventDefault();
            const el = inputRef.current;
            if (!el) return;
            el.value = "";
          }}
        >
          x
        </button>
      </div>
    </div>
  );
};
