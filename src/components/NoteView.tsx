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
  const [toSelect, setToSelect] = useState<{ blockId: string; start: number; end: number } | null>(
    null
  );

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

  function splitBlock(blockId: string, index: number) {
    const block = notesDb.getBlock(blockId);
    const textBefore = block.text.slice(0, index);
    const textAfter = block.text.slice(index);
    notesDb.updateBlock(blockId, { text: textBefore });
    const newBlock = new Block({ type: block.type, text: textAfter });
    notesDb.insertBlockBelow(block.id, newBlock);
    setToSelect({ blockId: newBlock.id, start: 0, end: 0 });
  }

  function mergeBlockWithPrevious(blockId: string) {
    const note = notesDb.getNoteForBlock(blockId);
    const prevBlock = notesDb.getBlockAbove(note.id, blockId);
    if (!prevBlock) return;
    const block = notesDb.getBlock(blockId);
    notesDb.updateBlock(prevBlock.id, { text: prevBlock.text + block.text });
    notesDb.deleteBlock(block.id);
    setToSelect({
      blockId: prevBlock.id,
      start: prevBlock.text.length,
      end: prevBlock.text.length,
    });
  }

  // Update selection
  useEffect(() => {
    if (!toSelect) return;
    const { blockId, start, end } = toSelect;
    const el = document.querySelector(`.block[data-block-id="${blockId}"] .block-text`);
    if (!(el instanceof HTMLElement)) return;
    const textNode = el.childNodes[0];
    if (!textNode) {
      el.focus();
    } else {
      const range = document.createRange();
      const sel = window.getSelection();
      range.setStart(textNode, start);
      range.setEnd(textNode, end);
      range.collapse(true);
      sel?.removeAllRanges();
      sel?.addRange(range);
      setToSelect(null);
    }
  }, [toSelect, setToSelect]);

  return (
    <div
      style={{
        minHeight: "50px",
        // imessage blue
        // backgroundColor: "#1982FC",
        backgroundColor: "#F5F5F5",
        color: "black",
        borderRadius: "10px",
        boxShadow: "0px 0px 2px rgba(0,0,0,0.2)",
        padding: "5px 20px 10px 20px",
        margin: "10px",
      }}
    >
      {note.title ? <h1>{note.title}</h1> : null}
      <main
        style={{
          paddingTop: "3px",
        }}
      >
        {note.lines.map(({ block, indent }) => (
          <div key={block.id} style={{ display: "flex", flexDirection: "row", margin: "3px 5px" }}>
            <BlockPrefix indent={indent} />
            <BlockView
              block={block}
              updateBlock={(update: Partial<Block>) => notesDb.updateBlock(block.id, update)}
              moveIndent={(shift: -1 | 1) => moveIndent(block.id, shift)}
              indent={indent}
              mergeWithPrevious={() => mergeBlockWithPrevious(block.id)}
              split={(index: number) => splitBlock(block.id, index)}
            />
          </div>
        ))}
      </main>
    </div>
  );
}
