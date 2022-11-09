import { Notes, Note } from "../model/useNotes";
import { useParams } from "react-router-dom";
import { NoteView } from "../components/NoteView";

export const NotePage = ({ notes }: { notes: Notes }) => {
  const { id } = useParams();
  const note = id ? notes.getNote(id) : undefined;
  if (!note) {
    return <div>Not found</div>;
  }

  return (
    <div>
      <h3>{note.id}</h3>
      <NoteView note={new Note(note, notes)} editable={true} />
    </div>
  );
};
