import { ColumnView } from "../components/Column";
import { Notes, LabelItem, NoteId } from "../model/useNotes";
import { getQuery } from "../util";
import { useNavigate } from "react-router-dom";

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

  return <ColumnView notesDb={notes} notesList={noteList} navigate={navigate} />;
};
