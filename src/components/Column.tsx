import React, { useState, useRef, ReactNode, useEffect } from "react";
import { Notes, Note, Block } from "../useNotes";

function Checkbox({ checked = false }: { checked?: boolean }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => {
        checked = e.target.checked;
      }}
    />
  );
}

function BlockView({
  block,
  isFocused,
  setFocus,
  updateBlock,
  selectionStart = 0,
  setSelectionStart,
  onClick,
  deleteBlock,
}: {
  block: Block;
  isFocused: boolean;
  setFocus: () => void;
  updateBlock: (update: Partial<Block>) => void;
  selectionStart: number;
  setSelectionStart: (selectionStart: number) => void;
  onClick: (e: React.MouseEvent) => void;
  deleteBlock: () => void;
}) {
  const fontSize = 16;
  const editableDiv = useRef<HTMLDivElement>(null);

  const [innerText, setInnerText] = useState("");

  useEffect(() => {
    if (block.text !== innerText) {
      const text = block.text.replace(/\s/g, " ");
      setInnerText(text);
      if (editableDiv.current) {
        editableDiv.current.innerHTML = text;
      }
    }
    if (isFocused) {
      const el = editableDiv.current;
      if (!el) return;
      el.focus();
      //   const range = document.createRange();
      //   const sel = window.getSelection();
      //   range.setStart(el.childNodes[0], selectionStart);
      //   range.collapse(true);
      //   sel?.removeAllRanges();
      //   sel?.addRange(range);
    }
  }, [block.text, isFocused, innerText]);

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

  function keyDownHandler(e: React.KeyboardEvent) {
    const sel = window.getSelection();
    const hasSelection = sel?.anchorOffset !== sel?.focusOffset;
    if (selectionStart === 0 && !hasSelection) {
      if (block.type === "text") {
        if (e.key === "Backspace") {
          e.preventDefault();
          deleteBlock();
        }
      } else {
        if (e.key === "Backspace" || e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          updateBlock({ type: "text" });
        }
      }
    }
  }

  function keyUpHandler(e: React.KeyboardEvent) {
    const pos = document.getSelection()?.anchorOffset || 0;
    if (isFocused) {
      setSelectionStart(pos);
    }
    if (block.type !== "bullet" && block.text.slice(0, pos).match(/-\s/)) {
      updateBlock({ text: block.text.slice(pos), type: "bullet" });
    } else if (block.type !== "todo" && block.text.slice(0, pos).match(/\[\]\s/)) {
      updateBlock({ text: block.text.slice(pos), type: "todo" });
    }
  }

  function BlockPrefix({ blockType }: { blockType: Block["type"] }) {
    switch (blockType) {
      case "text":
        return null;
      case "bullet":
        return <Bullet />;
      case "todo":
        return <Checkbox />;
      default:
        return null;
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        margin: "10px",
      }}
    >
      <BlockPrefix blockType={block.type} />
      <div
        style={{
          textAlign: "left",
          width: "100%",
        }}
        className="block"
        onClick={onClick}
        data-block-id={block.id}
      >
        <div
          ref={editableDiv}
          style={{
            fontSize: `${fontSize}px`,
            fontFamily: "sans-serif",
            padding: 0,
            margin: 0,
            cursor: "text",
            border: "none",
            outline: "none",
          }}
          contentEditable
          className="block-text"
          onInput={(e) => {
            setInnerText(e.currentTarget.innerText);
            updateBlock({ text: e.currentTarget.innerText });
          }}
          onKeyDown={keyDownHandler}
          onKeyUp={keyUpHandler}
          onFocus={() => {
            // set selection to selectionStart
            let pos = 0;
            if (selectionStart < 0) {
              pos = Math.max(0, block.text.length + selectionStart + 1);
            } else {
              pos = Math.min(block.text.length, selectionStart);
            }
            if (!pos) return;
            const el = editableDiv.current;
            if (!el) return;
            const range = document.createRange();
            const sel = window.getSelection();
            range.setStart(el.childNodes[0], pos);
            range.collapse(true);
            sel?.removeAllRanges();
            sel?.addRange(range);
            setSelectionStart(pos);
          }}
        />
      </div>
    </div>
  );
}

function NoteView({ note, blocks }: { note: Note; blocks: ReactNode[] }) {
  return (
    <div
      style={{
        border: "1px solid black",
        minHeight: "50px",
      }}
    >
      <h1>{note.title}</h1>
      {blocks.map((block, i) => (
        <div
        // style={{
        //   marginLeft: `${indentation[block.id] * 20}px`,
        // }}
        >
          {block}
        </div>
      ))}
    </div>
  );
}

type ColumnViewProps = {
  notesDb: Notes;
  notesList: Note[];
};

export function ColumnView(props: ColumnViewProps) {
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
      setFocus(newBlockId);
      // } else if (e.key === "Tab") {
      //   e.preventDefault();
      //   if (e.shiftKey) {
      //     notesDb.unindentBlock(block.id);
      //   } else {
      //     notesDb.indentBlock(block.id);
      //   }
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
        <NoteView
          key={note.id}
          note={note}
          blocks={note.blocks.map((block) => (
            <BlockView
              key={block.id}
              block={block}
              isFocused={block.id === focusedBlockId}
              setFocus={() => setFocusedBlockId(block.id)}
              updateBlock={(update: Partial<Block>) => notesDb.updateBlock(block.id, update)}
              deleteBlock={() => {
                notesDb.deleteBlock(block.id);
                setSelectionStart(-1);
                setFocusAbove();
              }}
              selectionStart={selectionStart}
              setSelectionStart={setSelectionStart}
              onClick={(e) => clickHandler(block.id, e)}
            />
          ))}
        />
      ))}
      <button onClick={() => notesDb.addNote()}>Add Note</button>
    </div>
  );
}
