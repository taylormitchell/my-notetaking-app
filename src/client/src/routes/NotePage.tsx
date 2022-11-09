import { Notes, Note, NoteId } from "../model/useNotes";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { NoteView } from "../components/NoteView";
import { useEffect, useRef, useState } from "react";
import { ColumnView } from "../components/Column";
import { Header } from "../components/Header";

export const NotePage = ({ notes }: { notes: Notes }) => {
  const [mainNoteId, setMainNoteId] = useState<NoteId>();
  const [noteIds, setNoteIds] = useState<NoteId[]>([]);
  const [focusOnId, setFocusOnId] = useState<string | null>(null);

  const { id } = useParams();
  if (id && id !== mainNoteId) {
    setMainNoteId(id);
  }
  useEffect(() => {
    setNoteIds(mainNoteId ? [mainNoteId] : []);
  }, [mainNoteId]);

  const navigate = useNavigate();

  useEffect(() => {
    if (focusOnId) {
      const el = document.querySelector(`[data-note-id="${focusOnId}"] .block-text`);
      if (!(el instanceof HTMLElement)) return;
      el.focus();
      setFocusOnId(null);
    }
  }, [focusOnId]);

  const addChild = (noteId: string) => {
    const childId = new Note(notes.getNoteOrThrow(noteId), notes).addChild();
    setNoteIds((noteIds) => {
      const index = noteIds.indexOf(noteId);
      return [...noteIds.slice(0, index + 1), childId, ...noteIds.slice(index + 1)];
    });
    setFocusOnId(childId);
  };

  // get all children
  useEffect(() => {
    setNoteIds((noteIds) => {
      if (!noteIds.length) return [];
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
  if (noteList.length === 0) return <div>Not found</div>;
  return (
    <div style={{ height: "100%", overflow: "hidden" }}>
      <Header back={() => navigate(-1)}>{noteList[0].id.slice(0, 8) + "..."}</Header>
      <ColumnView
        notesDb={notes}
        notesList={noteList}
        noteView={(note) => (
          <NoteView
            key={note.id}
            note={new Note(note, notes)}
            onClick={() => {}}
            editable={true}
            addChild={() => addChild(note.id)}
          />
        )}
      />
    </div>
  );
};
