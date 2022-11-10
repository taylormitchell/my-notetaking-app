import { ColumnView } from "../components/Column";
import { Notes, LabelItem, NoteId, Note } from "../model/useNotes";
import { NoteView } from "../components/NoteView";
import { getQuery } from "../util";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "../components/Header";

export const NoteList = ({ notes }: { notes: Notes }) => {
  let noteList = notes.getAll().sort((a, b) => a.createdAt - b.createdAt);
  const navigate = useNavigate();

  const query = getQuery();

  let labels: LabelItem[] = [];
  for (const labelId of query.labels || []) {
    const label = notes.getLabel(labelId);
    if (label) {
      labels.push(label);
    }
  }
  if (labels.length > 0) {
    const noteIds = labels.reduce((acc, label) => {
      return new Set([...acc, ...label.noteIds]);
    }, new Set<NoteId>([]));
    noteList = noteList.filter((note) => noteIds.has(note.id));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Header back={() => navigate("/labels")}>
        <span>
          {labels.map((label) => (
            <span key={label.id}>{label.name}</span>
          ))}
        </span>
      </Header>
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
    </div>
  );
};
