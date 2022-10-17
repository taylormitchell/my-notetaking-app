import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import "./App.css";
import { Note, Block } from "./types";
import { useNotes } from "./useNotes";

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

  addNote = (
    partialNote: Partial<Note> & { lines: string[] } = {
      title: null,
      lines: [],
    }
  ) => {
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
    private notesList: NotesAndBlocksList,
    public selectionStart: number,
    public selectionEnd: number,
    public setSelectionStart: React.Dispatch<React.SetStateAction<number>>,
    public setSelectionEnd: React.Dispatch<React.SetStateAction<number>>,
    public focusedBlockId: string | null,
    public setFocusedBlockId: React.Dispatch<
      React.SetStateAction<string | null>
    >
  ) {}

  setFocus = (blockId: string | null) => {
    this.setFocusedBlockId(blockId);
  };

  getNoteAbove = (noteId: string) => {
    for (let i = 0; i < this.notesList.length; i++) {
      if (this.notesList[i].id === noteId) {
        return this.notesList[i - 1];
      }
    }
    return null;
  };

  getNoteBelow = (noteId: string) => {
    for (let i = 0; i < this.notesList.length; i++) {
      if (this.notesList[i].id === noteId) {
        return this.notesList[i + 1];
      }
    }
    return null;
  };

  setFocusBelow = () => {
    if (!this.focusedBlockId) {
      return;
    }
    const note = this.notesApi.getNoteForBlock(this.focusedBlockId);
    const index = note.blocks.indexOf(this.focusedBlockId);
    if (index >= note.blocks.length - 1) {
      // At the bottom of a note, so move to the note below
      const blocks = this.getNoteBelow(note.id)?.blocks;
      const firstBlock = blocks?.[0];
      if (firstBlock) {
        this.setFocus(firstBlock.id);
      }
    } else {
      this.setFocus(note.blocks[index + 1]);
    }
  };

  setFocusAbove = () => {
    if (!this.focusedBlockId) {
      return;
    }
    const note = this.notesApi.getNoteForBlock(this.focusedBlockId);
    const index = note.blocks.indexOf(this.focusedBlockId);
    if (index === 0) {
      // At the top of a note, so move to the note above
      const blocks = this.getNoteAbove(note.id)?.blocks;
      const lastBlock = blocks?.[blocks.length - 1];
      if (lastBlock) {
        this.setFocus(lastBlock.id);
      }
    } else {
      this.setFocus(note.blocks[index + 1]);
    }
  };
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
  view,
  noteApi,
}: {
  block: Block;
  isFocused: boolean;
  view: ViewApi;
  noteApi: NoteApi;
}) {
  const fontSize = 16;
  const minHeight = fontSize + 2;
  const [height, setHeight] = useState(minHeight);
  const textArea = useRef<HTMLTextAreaElement>(null);
  const paragraph = useRef<HTMLParagraphElement>(null);

  function onClick() {
    if (!isFocused) {
      view.setFocus(block.id);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      view.setFocusBelow(block.id);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      view.setFocusAbove(block.id);
    } else if (e.key === "Escape") {
      view.setFocus(null);
    } else if (e.key === "Enter") {
      e.preventDefault();
      noteApi.splitBlock(textArea.current?.selectionStart || 0);
    } else if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) {
        noteApi.unindentBlock(block.id);
      } else {
        noteApi.indentBlock(block.id);
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
  notes,
  view,
}: {
  note: NoteWithBlocks;
  notes: NotesApi;
  view: ViewApi;
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

  const noteApi = useMemo(() => new NoteApi(note.id, notes), [note, notes]);

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
            noteApi={noteApi}
            view={view}
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

  const [notes] = useNotes([
    {
      title: "Note 1",
      lines: ["This is a note", "It has two lines"],
    },
    {
      title: "Note 2",
      lines: ["This is another note", "It also has two lines"],
    },
  ]);

  const notesApi = useMemo(
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

  const noteList = notesApi.getAll().sort((a, b) => a.createdAt - b.createdAt);

  const view = useMemo(
    () =>
      new ViewApi(
        notesApi,
        noteList,
        selectionStart,
        selectionEnd,
        setSelectionStart,
        setSelectionEnd,
        focusedBlockId,
        setFocusedBlockId
      ),
    [notesApi, noteList, focusedBlockId, selectionStart, selectionEnd]
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

  const keyDownHandler = useCallback(
    (e: React.KeyboardEvent) => {
      if (!view.focusedBlockId) {
        return;
      }
      e.preventDefault();
      if (e.key === "ArrowDown") {
        view.setFocusBelow();
      } else if (e.key === "ArrowUp") {
        view.setFocusAbove();
      } else if (e.key === "Escape") {
        view.setFocus(null);
      }
    },
    [view]
  );

  return (
    <div className="App" onKeyDown={keyDownHandler}>
      {noteList.map((note) => (
        <Note key={note.id} note={note} notes={notesApi} view={view} />
      ))}
      <button onClick={() => notesApi.addNote()}>Add Note</button>
    </div>
  );
}

export default App;
