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
  blocks: string[];
  createdAt: number;
  updatedAt: number;
};

export class Note {
  id: string;
  title: string | null;
  blocks: Block[];
  createdAt: number;
  updatedAt: number;

  constructor(title: string | null = null, lines: string[] = []) {
    const blocks: Block[] = (lines.length > 0 ? lines : [""]).map((line) => ({
      id: uuid(),
      type: "text",
      text: line,
    }));
    this.id = uuid();
    this.title = title;
    this.blocks = blocks;
    this.createdAt = Date.now();
    this.updatedAt = Date.now();
  }
}

export class Block {
  id: string;
  type: BlockType;
  text: string;

  constructor(type: BlockType = "text", text: string = "") {
    this.id = uuid();
    this.type = type;
    this.text = text;
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
        blocks: note.blocks.map((blockId) => this.blocks[blockId]),
      };
    });
  };

  /**Get the note that a block belongs to */
  getNoteForBlock = (id: string) => {
    return this.getNote(this.blockToNote[id]);
  };

  addNote = (
    partialNote: Partial<Note> & { lines: string[] } = {
      title: null,
      lines: [],
    }
  ) => {
    const note = new Note(partialNote.title, partialNote.lines);
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

  updateNote = (note: Note) => {
    this.setNotes((ns) => ({
      ...ns,
      [note.id]: { ...note, blocks: note.blocks.map((b) => b.id) },
    }));
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

  splitBlock = (blockId: string, index: number) => {
    const block = this.getBlock(blockId);
    const textBefore = block.text.slice(0, index);
    const textAfter = block.text.slice(index);
    this.updateBlock(blockId, { text: textBefore });
    const newBlock = new Block(block.type, textAfter);
    this.insertBlockBelow(block.id, newBlock);
    return newBlock.id;
  };

  deleteBlock = (blockId: string) => {
    const note = this.getNoteForBlock(blockId);
    this.setNotes((notes) => {
      const newBlocks = note.blocks.filter((b) => b !== blockId);
      return {
        ...notes,
        [note.id]: { ...note, blocks: newBlocks },
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
    const index = note.blocks.indexOf(blockId);
    this.insertBlock(note.id, block, index);
  };

  insertBlockBelow = (blockId: string, blockInsert: Block | null = null) => {
    const note = this.getNoteForBlock(blockId);
    const block = blockInsert || new Block();
    const index = note.blocks.indexOf(blockId) + 1;
    this.insertBlock(note.id, block, index);
  };
}

export function useNotes(state: { title: string; lines: string[] }[] = []): Notes {
  const [blocksMap, setBlocksMap] = useState<BlocksMap>({});
  const [notesMap, setNotesMap] = useState<NotesMap>({});
  const [blockToNote, setBlockToNote] = useState<BlockToNote>({});

  useEffect(() => {
    const notes: NotesMap = {};
    const blocks: BlocksMap = {};
    const blockToNote: BlockToNote = {};
    state.forEach(({ title, lines }) => {
      const note = new Note(title, lines);
      notes[note.id] = {
        ...note,
        blocks: note.blocks.map((block) => block.id),
      };
      note.blocks.forEach((block) => {
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
