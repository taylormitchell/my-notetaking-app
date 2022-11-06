import { ColumnView } from "../components/Column";
import { Notes } from "../model/useNotes";

export const AllNotes = ({ notes }: { notes: Notes }) => {
  const noteList = notes.getAll().sort((a, b) => a.createdAt - b.createdAt);
  return <ColumnView notesDb={notes} notesList={noteList} />;
};
