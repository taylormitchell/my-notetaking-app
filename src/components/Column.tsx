import React, { useState } from "react";
import { Notes, Note, Block } from "../useNotes";
import { BlockView } from "./BlockView";
import { NoteView } from "./NoteView";

export function ColumnView(props: { notesDb: Notes; notesList: Note[] }) {
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [selectionStart, setSelectionStart] = useState(0);

  const { notesDb, notesList } = props;

  const setFocus = (blockId: string | null) => {
    setFocusedBlockId(blockId);
  };

  const getNoteAbove = (noteId: string) => {
    for (let i = 0; i < notesList.length; i++) {
      if (notesList[i].id === noteId) {
        return notesList[i - 1];
      }
    }
    return null;
  };

  const getNoteBelow = (noteId: string) => {
    for (let i = 0; i < notesList.length; i++) {
      if (notesList[i].id === noteId) {
        return notesList[i + 1];
      }
    }
    return null;
  };

  const setFocusBelow = () => {
    if (!focusedBlockId) {
      return;
    }
    const note = notesDb.getNoteForBlock(focusedBlockId);
    const index = note.blocks.indexOf(focusedBlockId);
    if (index >= note.blocks.length - 1) {
      // At the bottom of a note, so move to the note below
      const blocks = getNoteBelow(note.id)?.blocks;
      const firstBlock = blocks?.[0];
      if (firstBlock) {
        setFocus(firstBlock.id);
      }
    } else {
      setFocus(note.blocks[index + 1]);
    }
  };

  const setFocusAbove = () => {
    if (!focusedBlockId) {
      return;
    }
    const note = notesDb.getNoteForBlock(focusedBlockId);
    const index = note.blocks.indexOf(focusedBlockId);
    if (index === 0) {
      // At the top of a note, so move to the note above
      const blocks = getNoteAbove(note.id)?.blocks;
      const lastBlock = blocks?.[blocks.length - 1];
      if (lastBlock) {
        setFocus(lastBlock.id);
      }
    } else {
      setFocus(note.blocks[index - 1]);
    }
  };

  const keyDownHandler = (e: React.KeyboardEvent) => {
    if (!focusedBlockId) {
      return;
    }
    if (e.key === "ArrowDown" && !e.shiftKey) {
      e.preventDefault();
      setFocusBelow();
    } else if (e.key === "ArrowUp" && !e.shiftKey) {
      e.preventDefault();
      setFocusAbove();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setFocus(null);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const newBlockId = notesDb.splitBlock(focusedBlockId, selectionStart);
      // Check if the focused block started with a prefix
      const focusedBlock = notesDb.getBlock(focusedBlockId);
      const prefix = focusedBlock.text.match(/^\s*(-|\*|(\[\s?\]))?\s+/);
      if (prefix) {
        notesDb.updateBlock(newBlockId, (block) => ({
          ...block,
          text: prefix[0] + block.text,
        }));
        setSelectionStart(-1);
      } else {
        setSelectionStart(0);
      }
      setFocus(newBlockId);
    } else if (e.key === "Backspace") {
      if (selectionStart === 0) {
        const prevBlockId = notesDb.mergeBlockWithPrevious(focusedBlockId);
        if (!prevBlockId) return;
        e.preventDefault();
        setFocus(prevBlockId);
        setSelectionStart(notesDb.getBlock(prevBlockId).text.length);
      }
    }
  };

  const clickHandler = (blockId: string, e: React.MouseEvent) => {
    if (focusedBlockId === blockId) {
      return;
    }
    setFocus(blockId);
  };

  return (
    <div className="Column" onKeyDown={keyDownHandler}>
      {notesList.map((note) => (
        <NoteView key={note.id} note={note}>
          {note.blocks.map((block) => (
            <BlockView
              key={block.id}
              block={block}
              isFocused={block.id === focusedBlockId}
              setFocus={() => setFocusedBlockId(block.id)}
              updateBlock={(update: Partial<Block>) => notesDb.updateBlock(block.id, update)}
              selectionStart={selectionStart}
              setSelectionStart={setSelectionStart}
              onClick={(e) => clickHandler(block.id, e)}
            />
          ))}
        </NoteView>
      ))}
      <button onClick={() => notesDb.addNote()}>Add Note</button>
    </div>
  );
}
