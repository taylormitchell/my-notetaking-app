import Entry from "./components/Entry";
import { useNotes } from "./model/useNotes";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import { Labels } from "./routes/Labels";
import { NoteList } from "./routes/NoteList";
import { NewNoteButton } from "./components/NewNoteButton";
import { NotePage } from "./routes/NotePage";
import { Search } from "./routes/Search";

function App() {
  const notes = useNotes(true);
  const navigate = useNavigate();

  function newNote() {
    const noteId = notes.createNote();
    navigate(`/note/${noteId}`);
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
      <main style={{ height: "100%", overflow: "hidden" }}>
        <Routes>
          <Route path="/labels" element={<Labels notes={notes} />} />
          <Route path="/" element={<NoteList notes={notes} />} />
          <Route path="/note/:id" element={<NotePage notes={notes} />} />
          <Route path="/search" element={<Search notes={notes} />} />
        </Routes>
      </main>
      <footer>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            borderTop: "1px solid #ccc",
            padding: "10px 30px",
            fontSize: "1.5em",
          }}
        >
          <Link to="/labels">Labels</Link>
          <Link to="/">Notes</Link>
          <Link to="/search">Search</Link>
        </div>
      </footer>
    </div>
  );
}

export default App;
