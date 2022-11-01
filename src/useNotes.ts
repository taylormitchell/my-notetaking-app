import { useEffect, useState } from "react";

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

type NotesMap = {
  [key: string]: NoteRecord;
};

type BlocksMap = {
  [key: string]: BlockRecord;
};

export type BlockType = "text" | "bullet" | "todo";

type BlockToNote = {
  [key: string]: string;
};

export type BlockRecord = {
  id: string;
  type: BlockType;
  text: string;
};

export type NoteRecord = {
  id: string;
  title: string | null;
  lines: { id: string; indent: number }[];
  createdAt: number;
  updatedAt: number;
};

export class Note {
  id: string;
  title: string | null;
  lines: { block: Block; indent: number }[];
  createdAt: number;
  updatedAt: number;

  constructor(note: Partial<Note> = {}) {
    this.id = note.id || uuid();
    this.title = note.title || null;
    this.lines = note.lines || [];
    this.createdAt = note.createdAt || Date.now();
    this.updatedAt = note.updatedAt || Date.now();
  }
}

export class Block {
  id: string;
  type: BlockType;
  text: string;

  constructor(block: Partial<Block> = {}) {
    this.id = uuid();
    this.type = block.type || "text";
    this.text = block.text || "";
  }
}

export class Notes {
  constructor(
    public notes: NotesMap,
    private setNotes: React.Dispatch<React.SetStateAction<NotesMap>>,
    public blocks: BlocksMap,
    private setBlocks: React.Dispatch<React.SetStateAction<BlocksMap>>,
    private blockToNote: BlockToNote,
    private setBlockToNote: React.Dispatch<React.SetStateAction<BlockToNote>>
  ) {}

  /**Get a note by id */
  getNote = (id: string) => {
    return this.notes[id];
  };

  /**Get a block by id */
  getBlock = (id: string) => {
    return this.blocks[id];
  };

  getAll = (): Note[] => {
    return Object.values(this.notes).map((note) => {
      return {
        ...note,
        lines: note.lines.map((line) => ({ ...line, block: this.blocks[line.id] })),
      };
    });
  };

  /**Get the note that a block belongs to */
  getNoteForBlock = (id: string) => {
    return this.getNote(this.blockToNote[id]);
  };

  addNote = (props: Partial<Note>) => {
    const note = new Note(props);
    this.setNotes((ns) => ({
      ...ns,
      [note.id]: { ...note, lines: note.lines.map((line) => ({ ...line, id: line.block.id })) },
    }));
    this.setBlocks((blocks) => {
      const newBlocks: BlocksMap = { ...blocks };
      note.lines.forEach(({ block }) => {
        newBlocks[block.id] = block;
      });
      return newBlocks;
    });
    note.lines.forEach(({ block }) => {
      this.setBlockToNote((blockToNote) => ({
        ...blockToNote,
        [block.id]: note.id,
      }));
    });
  };

  updateNote = (
    noteId: string,
    update: Partial<NoteRecord> | ((note: NoteRecord) => NoteRecord)
  ) => {
    const updateFunc =
      typeof update === "function" ? update : (note: NoteRecord) => ({ ...note, ...update });
    this.setNotes((ns) => ({
      ...ns,
      [noteId]: updateFunc(ns[noteId]),
    }));
  };

  insertLine = (noteId: string, index: number, line: { indent?: number; block: Block }) => {
    const { indent, block } = { ...line, indent: line.indent || 0 };
    this.setNotes((notes) => {
      const note = notes[noteId];
      const newLines = [...note.lines];
      newLines.splice(index, 0, { indent, id: block.id });
      return {
        ...notes,
        [noteId]: { ...note, lines: newLines },
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

  updateBlock = (
    blockId: string,
    update: Partial<BlockRecord> | ((block: BlockRecord) => BlockRecord)
  ) => {
    const updateFunc =
      typeof update === "function" ? update : (block: BlockRecord) => ({ ...block, ...update });
    this.setBlocks((blocks) => ({
      ...blocks,
      [blockId]: updateFunc(blocks[blockId]),
    }));
  };

  splitBlock = (blockId: string, index: number) => {
    const block = this.getBlock(blockId);
    const textBefore = block.text.slice(0, index);
    const textAfter = block.text.slice(index);
    this.updateBlock(blockId, { text: textBefore });
    const newBlock = new Block({ type: block.type, text: textAfter });
    this.insertBlockBelow(block.id, newBlock);
    return newBlock.id;
  };

  mergeBlockWithPrevious = (blockId: string) => {
    const block = this.getBlock(blockId);
    const note = this.getNoteForBlock(blockId);
    const blockIndex = note.lines.findIndex((line) => line.id === blockId);
    if (blockIndex === 0) {
      return;
    }
    const prevBlock = this.getBlock(note.lines[blockIndex - 1].id);
    this.updateBlock(prevBlock.id, { text: prevBlock.text + block.text });
    this.deleteBlock(block.id);
    return prevBlock.id;
  };

  deleteBlock = (blockId: string) => {
    const note = this.getNoteForBlock(blockId);
    this.setNotes((notes) => {
      const newBlocks = note.lines.filter(({ id }) => id !== blockId);
      return {
        ...notes,
        [note.id]: { ...note, lines: newBlocks },
      };
    });
    this.setBlocks((blocks) => {
      const newBlocks = { ...blocks };
      delete newBlocks[blockId];
      return newBlocks;
    });
    this.setBlockToNote((blockToNote) => {
      const newBlockToNote = { ...blockToNote };
      delete newBlockToNote[blockId];
      return newBlockToNote;
    });
  };

  insertBlockAbove = (blockId: string, blockInsert: Block | null = null) => {
    const note = this.getNoteForBlock(blockId);
    const block = blockInsert || new Block();
    const index = note.lines.findIndex((line) => line.id === blockId);
    this.insertLine(note.id, index, { block });
  };

  insertBlockBelow = (blockId: string, blockInsert: Block | null = null) => {
    const note = this.getNoteForBlock(blockId);
    const lineAboveIndex = note.lines.findIndex((line) => line.id === blockId);
    const block = blockInsert || new Block();
    this.insertLine(note.id, lineAboveIndex + 1, {
      indent: note.lines[lineAboveIndex].indent,
      block,
    });
  };
}

export function useNotes(state: Partial<Note>[] = []): Notes {
  const [blocksMap, setBlocksMap] = useState<BlocksMap>({});
  const [notesMap, setNotesMap] = useState<NotesMap>({});
  const [blockToNote, setBlockToNote] = useState<BlockToNote>({});

  useEffect(() => {
    const notes: NotesMap = {};
    const blocks: BlocksMap = {};
    const blockToNote: BlockToNote = {};
    state.forEach((partialNote) => {
      const note = new Note(partialNote);
      notes[note.id] = {
        ...note,
        lines: note.lines.map((line) => ({ ...line, id: line.block.id })),
      };
      note.lines.forEach(({ block }) => {
        blocks[block.id] = block;
        blockToNote[block.id] = note.id;
      });
    });
    setNotesMap(notes);
    setBlocksMap(blocks);
    setBlockToNote(blockToNote);
  }, []);

  const notes = new Notes(
    notesMap,
    setNotesMap,
    blocksMap,
    setBlocksMap,
    blockToNote,
    setBlockToNote
  );

  return notes;
}
