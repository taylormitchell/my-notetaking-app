import { useState, useRef, ReactNode } from "react";
import { Notes, Note, Block } from "../useNotes";

function BlockView({
  block,
  isFocused,
  setFocus,
  updateText,
  selectionStart,
  setSelectionStart,
}: {
  block: Block;
  isFocused: boolean;
  setFocus: (blockId: string) => void;
  updateText: (text: string) => void;
  selectionStart: number;
  setSelectionStart: (selectionStart: number) => void;
}) {
  const fontSize = 16;
  const minHeight = fontSize + 2;
  const [height, setHeight] = useState(minHeight);
  const textArea = useRef<HTMLTextAreaElement>(null);
  const paragraph = useRef<HTMLParagraphElement>(null);

  function onClick() {
    if (!isFocused) {
      setFocus(block.id);
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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: `${minHeight}px`,
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
      <div
        style={{
          textAlign: "left",
          width: "100%",
        }}
        className="block"
        onClick={onClick}
      >
        {isFocused ? (
          <textarea
            ref={textArea}
            rows={1}
            style={{
              display: "block",
              fontSize: `${fontSize}px`,
              fontFamily: "sans-serif",
              padding: 0,
              margin: 0,
              width: "100%",
              height: `${height}px`,
              border: "none",
              outline: "none",
              resize: "none",
              overflow: "hidden",
            }}
            defaultValue={block.text}
            // onBlur={(e) => {
            //   setFocus(false);
            // }}
            onFocus={(e) => {
              e.target.selectionStart = selectionStart;
            }}
            onChange={(e) => {
              setHeight(() => {
                // if we don't set the height to 0 first, the scroll height won't
                // shrink when the text is deleted
                e.target.style.height = "";
                e.target.style.height = `${e.target.scrollHeight}px`;
                return e.target.scrollHeight;
              });
              updateText(e.target.value);
            }}
            onSelect={(e) => {
              if (textArea.current) {
                setSelectionStart(textArea.current.selectionStart);
              }
            }}
            autoFocus
          />
        ) : (
          <p
            ref={paragraph}
            style={{
              fontSize: `${fontSize}px`,
              fontFamily: "sans-serif",
              height: `${height}px`,
              padding: 0,
              margin: 0,
              cursor: "text",
            }}
            className="block-text"
          >
            {block.text}
          </p>
        )}
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
  const [selectionEnd, setSelectionEnd] = useState(0);

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
      setFocus(note.blocks[index + 1]);
    }
  };

  const keyDownHandler = (e: React.KeyboardEvent) => {
    if (!focusedBlockId) {
      return;
    }
    e.preventDefault();
    if (e.key === "ArrowDown") {
      setFocusBelow();
    } else if (e.key === "ArrowUp") {
      setFocusAbove();
    } else if (e.key === "Escape") {
      setFocus(null);
    } else if (e.key === "Enter") {
      e.preventDefault();
      notesDb.splitBlock(focusedBlockId, selectionStart);
      // } else if (e.key === "Tab") {
      //   e.preventDefault();
      //   if (e.shiftKey) {
      //     notesDb.unindentBlock(block.id);
      //   } else {
      //     notesDb.indentBlock(block.id);
      //   }
    }
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
              updateText={(text) => notesDb.updateBlock(block.id, { text })}
              selectionStart={selectionStart}
              setSelectionStart={setSelectionStart}
            />
          ))}
        />
      ))}
      <button onClick={() => notesDb.addNote()}>Add Note</button>
    </div>
  );
}
