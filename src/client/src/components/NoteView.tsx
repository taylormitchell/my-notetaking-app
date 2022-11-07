import { useEffect, useState } from "react";
import { BlockItem, Note, Upsert } from "../model/useNotes";
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

export function NoteView({ note }: { note: Note }) {
  const [toSelect, setToSelect] = useState<{ blockId: string; start: number; end: number } | null>(
    null
  );

  function split(index: number, indexChar: number) {
    const newBlockId = note.split(index, indexChar);
    setToSelect({ blockId: newBlockId, start: 0, end: 0 });
  }

  function mergeWithPrevious(index: number) {
    const blockPrevious = note.mergeWithPrevious(index);
    if (blockPrevious) {
      setToSelect({
        blockId: blockPrevious.id,
        start: blockPrevious.text.length,
        end: blockPrevious.text.length,
      });
    }
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
        display: "flex",
        minHeight: "fit-content",
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
          width: "100%",
        }}
      >
        {note.blocks.map(({ indent, block }, index) => {
          return (
            <div
              key={block.id}
              style={{ display: "flex", flexDirection: "row", margin: "3px 5px" }}
            >
              <BlockPrefix indent={indent} />
              <BlockView
                block={block}
                updateBlock={(update: Upsert<BlockItem>) => note.updateBlock(index, update)}
                moveIndent={(shift: -1 | 1) => note.moveIndent(index, shift)}
                indent={indent}
                mergeWithPrevious={() => mergeWithPrevious(index)}
                split={(indexChar: number) => split(index, indexChar)}
              />
            </div>
          );
        })}
      </main>
    </div>
  );
}
