import { useItems, Items, uuid, Uuid, UpdateItem } from "./useItems";

export type Upsert<T> = Partial<T> | ((item: T) => T);

export type BlockId = Uuid;
export class BlockItem {
  id: BlockId;
  type: "block";
  text: string;

  constructor(block: Partial<BlockItem> = {}) {
    this.id = block.id || uuid();
    this.type = "block";
    this.text = block.text || "";
  }
}

export type NoteId = Uuid;
export class NoteItem {
  id: NoteId;
  type: "note";
  title: string | null;
  lines: { id: string; indent: number }[];
  createdAt: number;
  updatedAt: number;

  constructor(note: Partial<NoteItem> = {}) {
    this.id = note.id || uuid();
    this.type = "note";
    this.title = note.title || null;
    this.lines = note.lines || [];
    this.createdAt = note.createdAt || Date.now();
    this.updatedAt = note.updatedAt || Date.now();
  }
}

export type LabelId = Uuid;
export class LabelItem {
  id: LabelId;
  type: "label";
  name: string;
  color: string;

  constructor(label: Partial<LabelItem> = {}) {
    this.id = label.id || uuid();
    this.type = "label";
    this.name = label.name || "";
    this.color = label.color || "#000000";
  }
}

export class Notes {
  private blockToNote: { [key: BlockId]: NoteId };
  constructor(
    public items: Items<BlockItem | NoteItem | LabelItem>,
    private updateItems: UpdateItem<BlockItem | NoteItem | LabelItem>,
    private clearItems: () => void
  ) {
    this.blockToNote = {};
    Object.entries(this.items).forEach(([key, value]) => {
      if (value.type === "note") {
        const note = value as NoteItem;
        note.lines.forEach((line) => {
          this.blockToNote[line.id] = key;
        });
      }
    });
  }

  clear() {
    this.clearItems();
    this.blockToNote = {};
  }

  /**Get a note by id */
  getNote = (id: string) => {
    const item = this.items[id];
    if (item && item.type === "note") {
      return item as NoteItem;
    }
  };

  /**Get a block by id */
  getBlock = (id: string) => {
    const item = this.items[id];
    if (item && item.type === "block") {
      return item as BlockItem;
    }
  };

  getLabels = () => {
    return Object.values(this.items).filter((item) => item.type === "label") as LabelItem[];
  };

  getAll = (): NoteItem[] => {
    const notes = Object.values(this.items).filter((item) => item.type === "note") as NoteItem[];
    return notes.map((note) => ({
      ...note,
      lines: note.lines.map((line) => ({ ...line, block: this.items[line.id] as BlockItem })),
    }));
  };

  /**Get the note that a block belongs to */
  getNoteForBlock = (id: string) => {
    return this.getNote(this.blockToNote[id]);
  };

  newNote = () => {
    const note = new NoteItem({ lines: [{ id: uuid(), indent: 0 }] });
    note.lines.forEach((line) => {
      this.upsertBlock({ id: line.id });
    });
    this.upsertNote(note);
  };

  upsertBlock = (upsert: Upsert<BlockItem>, blockId?: string) => {
    const id = blockId || uuid();
    this.updateItems((items) => {
      const block = items[id] || new BlockItem({ id });
      if (block?.type !== "block") {
        throw new Error("block not found");
      }
      const newblock = typeof upsert === "function" ? upsert(block) : { ...block, ...upsert };
      return { [newblock.id]: newblock };
    });
    return id;
  };

  upsertNote = (upsert: Upsert<NoteItem>, noteId?: string) => {
    const id = noteId || uuid();
    this.updateItems((items) => {
      const note = items[id] || new NoteItem({ id });
      if (note?.type !== "note") {
        throw new Error("Note not found");
      }
      const newNote = typeof upsert === "function" ? upsert(note) : { ...note, ...upsert };
      note.lines.forEach(({ id }) => {
        delete this.blockToNote[id];
      });
      newNote.lines.forEach(({ id }) => {
        this.blockToNote[id] = newNote.id;
      });
      return { [newNote.id]: newNote };
    });
    return id;
  };

  upsertLabel = (upsert: Upsert<LabelItem>, labelId?: LabelId) => {
    const id = labelId || uuid();
    this.updateItems((items) => {
      const label = items[id] || new LabelItem({ id });
      if (label?.type !== "label") {
        throw new Error("Label not found");
      }
      const newLabel = typeof upsert === "function" ? upsert(label) : { ...label, ...upsert };
      return { [newLabel.id]: newLabel };
    });
  };
}

export class Note {
  constructor(private noteItem: NoteItem, private notes: Notes) {}

  get title() {
    return this.noteItem.title;
  }

  get lines() {
    return this.noteItem.lines;
  }

  get createdAt() {
    return this.noteItem.createdAt;
  }

  get updatedAt() {
    return this.noteItem.updatedAt;
  }

  get id() {
    return this.noteItem.id;
  }

  get blocks() {
    const blocks: { indent: number; block: BlockItem }[] = [];
    this.noteItem.lines.forEach((line) => {
      const block = this.notes.getBlock(line.id);
      if (block) {
        blocks.push({ indent: line.indent, block });
      }
    });
    return blocks;
  }

  moveIndent(index: number, shift: -1 | 1) {
    this.notes.upsertNote((note) => {
      if (note.lines[index].indent + shift < 0) {
        return note;
      }
      return {
        ...note,
        lines: note.lines.map((line, i) => {
          if (i === index) {
            return { ...line, indent: line.indent + shift };
          }
          return line;
        }),
      };
    }, this.noteItem.id);
  }

  insertAfter(index: number, blockId: string) {
    this.notes.upsertNote((note) => {
      return {
        ...note,
        lines: [
          ...note.lines.slice(0, index + 1),
          { id: blockId, indent: note.lines[index].indent },
          ...note.lines.slice(index + 1),
        ],
      };
    }, this.noteItem.id);
  }

  delete(index: number) {
    this.notes.upsertNote((note) => {
      if (index < 0 || index >= note.lines.length) {
        return note;
      }
      return {
        ...note,
        lines: [...note.lines.slice(0, index), ...note.lines.slice(index + 1)],
      };
    }, this.noteItem.id);
  }

  split(index: number, indexChar: number) {
    const note = this.notes.getNote(this.noteItem.id);
    if (!note) throw new Error("note not found");
    const blockId = note.lines[index].id;
    const block = this.notes.getBlock(blockId);
    if (!block) throw new Error("block not found");
    const textBefore = block.text.slice(0, indexChar);
    const textAfter = block.text.slice(indexChar);
    this.notes.upsertBlock({ text: textBefore }, blockId);
    const newBlockId = this.notes.upsertBlock({ text: textAfter });
    this.insertAfter(index, newBlockId);
    return newBlockId;
  }

  mergeWithPrevious(index: number) {
    if (index === 0) {
      return;
    }
    const indexPrev = index - 1;
    const block = this.notes.getBlock(this.noteItem.lines[index].id);
    const blockPrevious = this.notes.getBlock(this.noteItem.lines[indexPrev].id);
    if (!block || !blockPrevious) {
      throw new Error("Current and/or previous block found");
    }
    this.notes.upsertBlock({ text: blockPrevious.text + block.text }, blockPrevious.id);
    this.delete(index);
    return this.notes.getBlock(blockPrevious.id);
  }

  updateBlock(index: number, upsert: Upsert<BlockItem>) {
    this.notes.upsertBlock(upsert, this.noteItem.lines[index].id);
  }
}

export function useNotes(persist = false): Notes {
  const [items, updateItems, clearItems] = useItems<BlockItem | NoteItem | LabelItem>({}, persist);
  return new Notes(items, updateItems, clearItems);
}
