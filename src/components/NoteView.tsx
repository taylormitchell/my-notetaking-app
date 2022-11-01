import { useEffect, useState } from "react";
import { Note, Block, Notes } from "../useNotes";
import { BlockView } from "./BlockView";

function BlockPrefix({ indent }: { indent: number }) {
  const Bullet = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        paddingRight: "10px",
      }}
    >
      <div
        style={{
          width: "5px",
          height: "5px",
          borderRadius: "2.5px",
          backgroundColor: "black",
        }}
      />
    </div>
  );
  return (
    <div className={"block-prefix"} style={{ display: "flex", flexDirection: "row" }}>
      {indent > 0 && (
        <>
          <div style={{ width: `${indent * 20}px` }} />
          <Bullet />
        </>
      )}
    </div>
  );
}

export function NoteView({ note, notesDb }: { note: Note; notesDb: Notes }) {
  const [toFocus, setToFocus] = useState<string | null>(null);

  function getSelectedBlock() {
    const sel = document.getSelection();
    if (!sel) return;
    const selectionStart = sel?.anchorOffset || 0;
    const selectedNode = sel?.focusNode;
    if (!selectedNode) return;
    const blockElement = selectedNode.parentElement?.closest(".block");
    if (!(blockElement instanceof HTMLElement)) return;
    const blockId = blockElement.dataset.blockId;
    if (!blockId) return;
    return { blockId, selectionStart };
  }

  const moveIndent = (blockId: string, shift: -1 | 1) => {
    notesDb.updateNote(note.id, (note) => ({
      ...note,
      lines: note.lines.map((line) => {
        if (line.id === blockId) {
          return { ...line, indent: line.indent + shift };
        } else {
          return line;
        }
      }),
    }));
  };

  const keyDownHandler = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const sel = getSelectedBlock();
      if (!sel) return;
      const newBlockId = notesDb.splitBlock(sel.blockId, sel.selectionStart);
      setToFocus(newBlockId);
    } else if (e.key === "Backspace") {
      const sel = getSelectedBlock();
      if (!sel) return;
      if (sel.selectionStart === 0) {
        const prevBlockId = notesDb.mergeBlockWithPrevious(sel.blockId);
        if (!prevBlockId) return;
        e.preventDefault();
        setToFocus(prevBlockId);
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const sel = getSelectedBlock();
      if (!sel) return;
      moveIndent(sel.blockId, e.shiftKey ? -1 : 1);
    }
  };

  useEffect(() => {
    if (toFocus) {
      const el = document.querySelector(`.block[data-block-id="${toFocus}"] .block-text`);
      if (el instanceof HTMLElement) {
        el.focus();
      }
      setToFocus(null);
    }
  }, [toFocus, setToFocus]);

  return (
    <div
      style={{
        border: "1px solid black",
        minHeight: "50px",
      }}
      onKeyDown={keyDownHandler}
    >
      <h1>{note.title}</h1>
      {note.lines.map(({ block, indent }) => (
        <div key={block.id} style={{ display: "flex", flexDirection: "row" }}>
          <BlockPrefix indent={indent} />
          <BlockView
            block={block}
            updateBlock={(update: Partial<Block>) => notesDb.updateBlock(block.id, update)}
            moveIndent={(shift: -1 | 1) => moveIndent(block.id, shift)}
          />
        </div>
      ))}
    </div>
  );
}
