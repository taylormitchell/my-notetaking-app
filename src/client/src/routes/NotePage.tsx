import { Notes, Note, NoteId } from "../model/useNotes";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { NoteView } from "../components/NoteView";
import { useEffect, useRef, useState } from "react";
import { ColumnView } from "../components/Column";
import { Header } from "../components/Header";

export const NotePage = ({ notes }: { notes: Notes }) => {
  const { id } = useParams();
  const [noteIds, setNoteIds] = useState<NoteId[]>(() => (id ? [id] : []));

  const noteRef = useRef<HTMLDivElement>(null);
  const note = id ? notes.getNote(id) : undefined;
  const navigate = useNavigate();

  useEffect(() => {
    if (noteRef.current) {
      const el = noteRef.current.querySelector(".block-text");
      if (!(el instanceof HTMLElement)) return;
      el.focus();
    }
  }, [noteRef]);

  const addChild = () => {
    if (!note) return;
    const childId = notes.createNote();
    setNoteIds((noteIds) => [...noteIds, childId]);
  };

  const noteList = noteIds.map((id) => notes.getNoteOrThrow(id));
  if (!noteList) return <div>Not found</div>;
  return (
    <div ref={noteRef}>
      <Header back={() => navigate(-1)}>{noteList[0].id.slice(0, 8) + "..."}</Header>
      <ColumnView notesDb={notes} notesList={noteList} editable={true} />
      <button onClick={addChild}>+</button>
    </div>
  );
};
