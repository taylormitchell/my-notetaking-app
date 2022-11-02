import { ColumnView } from "./components/Column";
import Entry from "./components/Entry";
import { useNotes, Block, Note } from "./useNotes";
import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

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
  const [labels, setLabels] = useState<{ [key: string]: string }>({
    "1": "Ideaflow",
    "2": "My note-taking app",
  });

  const noteList = notes.getAll().sort((a, b) => a.createdAt - b.createdAt);

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
            <Route
              path="/labels"
              element={
                <div>
                  <ul>
                    {Object.entries(labels).map(([key, value]) => {
                      return (
                        <li>
                          <Link key={key} to={`/?q=${value}`}>
                            {value}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              }
            />
            <Route path="/" element={<ColumnView notesDb={notes} notesList={noteList} />} />
          </Routes>
        </Router>
      </main>
      <Entry addNote={(note: Note) => notes.addNote(note)} />
    </div>
  );
}

export default App;
