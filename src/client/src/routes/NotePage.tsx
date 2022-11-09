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
  const navigate = useNavigate();

  useEffect(() => {
    if (noteRef.current) {
      const el = noteRef.current.querySelector(".block-text");
      if (!(el instanceof HTMLElement)) return;
      el.focus();
    }
  }, [noteRef]);

  const addChild = () => {
    if (!noteIds) return;
    const lastNoteId = noteIds[noteIds.length - 1];
    const childId = new Note(notes.getNoteOrThrow(lastNoteId), notes).addChild();
    setNoteIds((noteIds) => [...noteIds, childId]);
  };

  // get all children
  useEffect(() => {
    setNoteIds((noteIds) => {
      let newNoteIds = [...noteIds];
      let lastNoteId = noteIds[noteIds.length - 1];
      let lastNote = new Note(notes.getNoteOrThrow(lastNoteId), notes);
      let children = lastNote.getChildren().map((c) => c.id);
      while (children.length > 0) {
        newNoteIds = [...newNoteIds, ...children];
        lastNoteId = children[children.length - 1];
        lastNote = new Note(notes.getNoteOrThrow(lastNoteId), notes);
        children = lastNote.getChildren().map((c) => c.id);
      }
      return newNoteIds;
    });
  }, []);

  let noteList = noteIds.map((id) => notes.getNoteOrThrow(id));
  if (!noteList) return <div>Not found</div>;
  return (
    <div ref={noteRef}>
      <Header back={() => navigate(-1)}>{noteList[0].id.slice(0, 8) + "..."}</Header>
      <ColumnView
        notesDb={notes}
        notesList={noteList}
        noteView={(note) => (
          <NoteView key={note.id} note={new Note(note, notes)} onClick={() => {}} editable={true} />
        )}
      />
      <button onClick={addChild}>+</button>
    </div>
  );
};
