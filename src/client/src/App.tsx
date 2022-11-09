import Entry from "./components/Entry";
import { useNotes } from "./model/useNotes";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Labels } from "./routes/Labels";
import { NoteList } from "./routes/NoteList";
import { NotePage } from "./routes/NotePage";

function App() {
  const notes = useNotes(true);

  return (
    <div
      className="App"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <main style={{ height: "100%", overflow: "hidden" }}>
        <Router>
          <Routes>
            <Route path="/labels" element={<Labels notes={notes} />} />
            <Route path="/" element={<NoteList notes={notes} />} />
            <Route path="/note/:id" element={<NotePage notes={notes} />} />
          </Routes>
        </Router>
      </main>
      <Entry notesDb={notes} />
    </div>
  );
}

export default App;
