import React, { useEffect, useRef, useState, useMemo } from "react";
import "./App.css";

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

type Block = {
  id: string;
  type: string;
  text: string;
};

type Note = {
  id: string;
  title: string | null;
  blocks: string[];
  createdAt: number;
  updatedAt: number;
};

// Same as Note but with the blocks replaced with the actual block objects
type NoteWithBlocks = Omit<Note, "blocks"> & { blocks: Block[] };

type NotesMap = {
  [key: string]: Note;
};

type BlocksMap = {
  [key: string]: Block;
};

type NotesAndBlocksList = NoteWithBlocks[];

type BlockToNote = {
  [key: string]: string;
};

/**Main interface for doing stuff with a note */
class NotesApi {
  constructor(
    public notes: NotesMap,
    private setNotes: React.Dispatch<React.SetStateAction<NotesMap>>,
    public blocks: BlocksMap,
    private setBlocks: React.Dispatch<React.SetStateAction<BlocksMap>>,
    private blockToNote: BlockToNote,
    private setBlockToNote: React.Dispatch<React.SetStateAction<BlockToNote>>
  ) {}

  init = (state: { title: string; lines: string[] }[]) => {
    const notes: NotesMap = {};
    const blocks: BlocksMap = {};
    const blockToNote: BlockToNote = {};
    state.forEach(({ title, lines }) => {
      const note = this.createNote(title, lines);
      notes[note.id] = {
        ...note,
        blocks: note.blocks.map((block) => block.id),
      };
      note.blocks.forEach((block) => {
        blocks[block.id] = block;
        blockToNote[block.id] = note.id;
      });
    });
    this.setNotes(notes);
    this.setBlocks(blocks);
    this.setBlockToNote(blockToNote);
  };

  /**Get a note by id */
  getNote = (id: string) => {
    return this.notes[id];
  };

  /**Get a block by id */
  getBlock = (id: string) => {
    return this.blocks[id];
  };

  getAll = (): NotesAndBlocksList => {
    return Object.values(this.notes).map((note) => {
      return {
        ...note,
        blocks: note.blocks.map((blockId) => this.blocks[blockId]),
      };
    });
  };

  /**Get the note that a block belongs to */
  getNoteForBlock = (id: string) => {
    return this.getNote(this.blockToNote[id]);
  };

  createNote = (title: string | null = null, lines: string[] = []) => {
    const blocks = (lines.length > 0 ? lines : [""]).map((line) => ({
      id: uuid(),
      type: "text",
      text: line,
    }));
    return {
      id: uuid(),
      title,
      blocks,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  };

  createBlock = (type: string = "text", text: string = "") => {
    return {
      id: uuid(),
      type,
      text,
    };
  };

  addNote = (partialNote: Partial<Note> & { lines: string[] }) => {
    const note = this.createNote(partialNote.title, partialNote.lines);
    this.setNotes((ns) => ({
      ...ns,
      [note.id]: { ...note, blocks: note.blocks.map((b) => b.id) },
    }));
    this.setBlocks((blocks) => {
      const newBlocks: BlocksMap = { ...blocks };
      note.blocks.forEach((block) => {
        newBlocks[block.id] = block;
      });
      return newBlocks;
    });
    note.blocks.forEach((block) => {
      this.setBlockToNote((blockToNote) => ({
        ...blockToNote,
        [block.id]: note.id,
      }));
    });
  };

  insertBlock = (noteId: string, block: Block, index: number) => {
    this.setNotes((notes) => {
      const note = notes[noteId];
      const newBlocks = [...note.blocks];
      newBlocks.splice(index, 0, block.id);
      return {
        ...notes,
        [noteId]: { ...note, blocks: newBlocks },
      };
    });
    this.setBlocks((blocks) => ({
      ...blocks,
      [block.id]: block,
    }));
    this.setBlockToNote((blockToNote) => ({
      ...blockToNote,
      [block.id]: noteId,
    }));
  };

  updateBlock = (blockId: string, blockUpdates: Partial<Block>) => {
    this.setBlocks((blocks) => ({
      ...blocks,
      [blockId]: { ...blocks[blockId], ...blockUpdates },
    }));
  };
}

class ViewApi {
  constructor(
    private notesApi: NotesApi,
    public selectionStart: number,
    public selectionEnd: number,
    public setSelectionStart: React.Dispatch<React.SetStateAction<number>>,
    public setSelectionEnd: React.Dispatch<React.SetStateAction<number>>,
    public focusedBlockId: string | null,
    public setFocusedBlockId: React.Dispatch<
      React.SetStateAction<string | null>
    >
  ) {}
}

class NoteApi {
  constructor(private noteId: string, private notesApi: NotesApi) {}

  insertBlockAbove = (blockId: string, blockInsert: Block | null = null) => {
    const note = this.notesApi.getNoteForBlock(blockId);
    const block = blockInsert || this.notesApi.createBlock();
    const index = note.blocks.indexOf(blockId);
    this.notesApi.insertBlock(note.id, block, index);
  };

  insertBlockBelow = (blockId: string, blockInsert: Block | null = null) => {
    const note = this.notesApi.getNoteForBlock(blockId);
    if (note.id !== this.noteId) {
      throw new Error("Block does not belong to this note");
    }
    const block = blockInsert || this.notesApi.createBlock();
    const index = note.blocks.indexOf(blockId) + 1;
    this.notesApi.insertBlock(note.id, block, index);
  };

  splitBlock = (blockId: string, index: number) => {
    const block = this.notesApi.getBlock(blockId);
    const textBefore = block.text.slice(0, index);
    const textAfter = block.text.slice(index);
    this.notesApi.updateBlock(blockId, { text: textBefore });
    const newBlock = this.notesApi.createBlock(block.type, textAfter);
    this.insertBlockBelow(block.id, newBlock);
    return newBlock.id;
  };
}

function Block({
  block,
  isFocused,
  setFocus,
  updateBlock,
  setFocusAbove,
  setFocusBelow,
  splitBlock,
  selectionStart = 0,
  setSelectionStart,
  indentBlock,
  unindentBlock,
}: {
  block: Block;
  isFocused: boolean;
  setFocus: (focus: boolean) => void;
  updateBlock: (block: Block) => void;
  setFocusAbove: () => void;
  setFocusBelow: () => void;
  splitBlock: (index: number) => void;
  selectionStart: number;
  setSelectionStart: (selectionStart: number) => void;
  indentBlock: (blockId: string) => void;
  unindentBlock: (blockId: string) => void;
}) {
  const fontSize = 16;
  const minHeight = fontSize + 2;
  const [height, setHeight] = useState(minHeight);
  const textArea = useRef<HTMLTextAreaElement>(null);
  const paragraph = useRef<HTMLParagraphElement>(null);

  function onClick() {
    if (!isFocused) {
      setFocus(true);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusBelow();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusAbove();
    } else if (e.key === "Escape") {
      setFocus(false);
    } else if (e.key === "Enter") {
      e.preventDefault();
      splitBlock(textArea.current?.selectionStart || 0);
    } else if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) {
        unindentBlock(block.id);
      } else {
        indentBlock(block.id);
      }
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
              updateBlock({ ...block, text: e.target.value });
            }}
            onSelect={(e) => {
              if (textArea.current) {
                setSelectionStart(textArea.current.selectionStart);
              }
            }}
            onKeyDown={handleKeyDown}
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

function Note({
  note,
  updateBlock,
  focusedBlockId,
  setFocusedBlockId,
  splitBlock,
  selectionStart,
  setSelectionStart,
}: {
  note: NoteWithBlocks;
  updateBlock: (block: Block) => void;
  focusedBlockId: string | null;
  setFocusedBlockId: (id: string | null) => void;
  splitBlock: (blockId: string, index: number) => Block;
  selectionStart: number;
  setSelectionStart: (selectionStart: number) => void;
}) {
  const [indentation, setIndentation] = useState<{ [key: string]: number }>(
    () => {
      const indentation: { [key: string]: number } = {};
      note.blocks.forEach((block) => {
        indentation[block.id] = 0;
      });
      return indentation;
    }
  );

  function indentBlock(blockId: string) {
    setIndentation((indentation) => ({
      ...indentation,
      [blockId]: indentation[blockId] + 1,
    }));
  }

  function unindentBlock(blockId: string) {
    setIndentation((indentation) => ({
      ...indentation,
      [blockId]: Math.max(indentation[blockId] - 1, 0),
    }));
  }

  return (
    <div
      style={{
        border: "1px solid black",
        minHeight: "50px",
      }}
    >
      <h1>{note.title}</h1>
      {note.blocks.map((block, i) => (
        <div
          style={{
            marginLeft: `${indentation[block.id] * 20}px`,
          }}
        >
          <Block
            key={block.id}
            block={block}
            updateBlock={updateBlock}
            isFocused={block.id === focusedBlockId}
            setFocus={(focus) =>
              focus ? setFocusedBlockId(block.id) : setFocusedBlockId(null)
            }
            setFocusAbove={() => {
              if (i > 0) {
                setFocusedBlockId(note.blocks[i - 1].id);
              }
            }}
            setFocusBelow={() => {
              if (i < note.blocks.length - 1) {
                setFocusedBlockId(note.blocks[i + 1].id);
              }
            }}
            splitBlock={(index: number) => {
              splitBlock(block.id, index);
            }}
            selectionStart={selectionStart}
            setSelectionStart={setSelectionStart}
            indentBlock={() => indentBlock(block.id)}
            unindentBlock={() => unindentBlock(block.id)}
          />
        </div>
      ))}
    </div>
  );
}

function App() {
  const [blocksMap, setBlocksMap] = useState<BlocksMap>({});
  const [notesMap, setNotesMap] = useState<NotesMap>({});
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const [blockToNote, setBlockToNote] = useState<BlockToNote>({});

  const notes = useMemo(
    () =>
      new NotesApi(
        notesMap,
        setNotesMap,
        blocksMap,
        setBlocksMap,
        blockToNote,
        setBlockToNote
      ),
    [notesMap, blocksMap]
  );

  const view = useMemo(
    () =>
      new ViewApi(
        notesApi,
        selectionStart,
        selectionEnd,
        setSelectionStart,
        setSelectionEnd,
        focusedBlockId,
        setFocusedBlockId
      ),
    [notesApi, focusedBlockId, selectionStart, selectionEnd]
  );

  // Initialize app with some dummy data
  useEffect(() => {
    notesApi.init([
      {
        title: "Note 1",
        lines: ["This is a note", "It has two lines"],
      },
      {
        title: "Note 2",
        lines: ["This is another note", "It also has two lines"],
      },
    ]);
  }, []);

  function createNote(title: string | null = null, lines: string[] = []) {
    const blocks = (lines.length > 0 ? lines : [""]).map((line) => ({
      id: uuid(),
      type: "text",
      text: line,
    }));
    return {
      id: uuid(),
      title,
      blocks,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  function addNote() {
    const note = createNote();
    setNotesMap((ns) => ({
      ...ns,
      [note.id]: { ...note, blocks: note.blocks.map((b) => b.id) },
    }));
    setBlocksMap((blocks) => {
      const newBlocks = { ...blocks };
      note.blocks.forEach((block) => {
        newBlocks[block.id] = block;
      });
      return newBlocks;
    });
    note.blocks.forEach((block) => {
      setBlockToNote((blockToNote) => ({
        ...blockToNote,
        [block.id]: note.id,
      }));
    });
  }

  function updateBlock(block: Block) {
    setBlocksMap((blocks) => ({
      ...blocks,
      [block.id]: block,
    }));
  }

  function insertBlockAbove(blockId: string, blockInsert: Block | null = null) {
    const note = notesMap[blockToNote[blockId]];
    const newBlock = blockInsert || {
      id: uuid(),
      type: "text",
      text: "",
    };
    setBlocksMap((blocks) => ({
      ...blocks,
      [newBlock.id]: newBlock,
    }));
    setNotesMap((notes) => ({
      ...notes,
      [note.id]: {
        ...note,
        blocks: note.blocks
          .slice(0, note.blocks.indexOf(blockId))
          .concat([newBlock.id])
          .concat(note.blocks.slice(note.blocks.indexOf(blockId))),
      },
    }));
    setBlockToNote((blockToNote) => ({
      ...blockToNote,
      [newBlock.id]: note.id,
    }));
    setFocusedBlockId(newBlock.id);
  }

  function insertBlockBelow(blockId: string, blockInsert: Block | null = null) {
    const note = notesMap[blockToNote[blockId]];
    const newBlock = blockInsert || {
      id: uuid(),
      type: "text",
      text: "",
    };
    setBlocksMap((blocks) => ({
      ...blocks,
      [newBlock.id]: newBlock,
    }));
    setNotesMap((notes) => ({
      ...notes,
      [note.id]: {
        ...note,
        blocks: note.blocks
          .slice(0, note.blocks.indexOf(blockId) + 1)
          .concat([newBlock.id])
          .concat(note.blocks.slice(note.blocks.indexOf(blockId) + 1)),
      },
    }));
    setBlockToNote((blockToNote) => ({
      ...blockToNote,
      [newBlock.id]: note.id,
    }));
    setFocusedBlockId(newBlock.id);
  }

  function splitBlock(blockId: string, index: number) {
    const block = blocksMap[blockId];
    const textBefore = block.text.slice(0, index);
    const textAfter = block.text.slice(index);
    updateBlock({ ...block, text: textBefore });
    const newBlock = {
      id: uuid(),
      type: "text",
      text: textAfter,
    };
    insertBlockBelow(block.id, newBlock);
    setFocusedBlockId(newBlock.id);
    return newBlock;
  }

  const noteList = notesApi.getAll().sort((a, b) => a.createdAt - b.createdAt);

  return (
    <div className="App">
      {noteList.map((note) => (
        <Note
          key={note.id}
          note={note}
          updateBlock={updateBlock}
          focusedBlockId={focusedBlockId}
          setFocusedBlockId={setFocusedBlockId}
          splitBlock={splitBlock}
          selectionStart={selectionStart}
          setSelectionStart={setSelectionStart}
        />
      ))}
      <button onClick={() => addNote()}>Add Note</button>
    </div>
  );
}

export default App;
