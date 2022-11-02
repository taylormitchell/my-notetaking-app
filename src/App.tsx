import "./App.css";
import { ColumnView } from "./components/Column";
import { useNotes, Block } from "./useNotes";

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

  return (
    <div
      className="App"
      style={{
        height: "100%",
      }}
    >
      <ColumnView notesDb={notes} notesList={noteList} />
    </div>
  );
}

export default App;
