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

export function ActionButton({
  name,
  count,
  size,
  onClick,
  children,
}: {
  name: string;
  count?: number;
  size: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const [showCount, setShowCount] = useState(false);

  function handleClick() {
    onClick();
    setShowCount(true);
    setTimeout(() => setShowCount(false), 1000);
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div className={"upvote"} onClick={handleClick}>
        {children}
      </div>
      <div style={{ width: "5px" }}>{count && <span>{count}</span>}</div>
    </div>
  );
}

export function NoteView({
  note,
  showActions = true,
  editable = false,
  open,
}: {
  note: Note;
  showActions?: boolean;
  editable?: boolean;
  open?: () => void;
}) {
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
        minHeight: "fit-content",
        backgroundColor: "#F5F5F5",
        color: "black",
        borderRadius: "10px",
        boxShadow: "0px 0px 2px rgba(0,0,0,0.2)",
        padding: "5px 20px 10px 20px",
        margin: "10px",
      }}
      onClick={open}
    >
      {note.title ? <h1>{note.title}</h1> : null}
      <main
        style={{
          display: "flex",
          flexDirection: "column",
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
                editable={editable}
              />
            </div>
          );
        })}
      </main>
      {showActions && (
        <footer
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
            color: "gray",
          }}
        >
          <div className={"upvote"}>
            <ActionButton
              name={"upvote"}
              count={note.upvotes}
              size={15}
              onClick={() => note.upvote()}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12.781 2.375c-.381-.475-1.181-.475-1.562 0l-8 10A1.001 1.001 0 0 0 4 14h4v7a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-7h4a1.001 1.001 0 0 0 .781-1.625l-8-10zM15 12h-1v8h-4v-8H6.081L12 4.601 17.919 12H15z"
                  fill="currentColor"
                />
              </svg>
            </ActionButton>
          </div>
          {/* <div className={"comment"}>
          <ActionButton
            name={"comment"}
            count={2}
            size={20}
            onClick={() => alert(`clicked upvote`)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12.0867962,18 L6,21.8042476 L6,18 L4,18 C2.8954305,18 2,17.1045695 2,16 L2,4 C2,2.8954305 2.8954305,2 4,2 L20,2 C21.1045695,2 22,2.8954305 22,4 L22,16 C22,17.1045695 21.1045695,18 20,18 L12.0867962,18 Z M8,18.1957524 L11.5132038,16 L20,16 L20,4 L4,4 L4,16 L8,16 L8,18.1957524 Z"
                fill="currentColor"
              />
            </svg>
          </ActionButton>
        </div> */}
        </footer>
      )}
    </div>
  );
}
