import { useItems, Items, Item, uuid, Uuid, UpdateItem } from "./useItems";

export type Upsert<T> = Partial<T> | ((item: T) => T);

export type BlockId = Uuid;
export class BlockItem implements Item {
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
export class NoteItem implements Item {
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
export class LabelItem implements Item {
  id: LabelId;
  type: "label";
  name: string;
  noteIds: NoteId[];
  color: string;

  constructor(label: Partial<LabelItem> = {}) {
    this.id = label.id || uuid();
    this.type = "label";
    this.name = label.name || "";
    this.noteIds = label.noteIds || [];
    this.color = label.color || "#007bff";
  }
}

export type AttributeId = Uuid;
interface Attribute extends Item {
  id: AttributeId;
  type: "attribute";
  name: string;
  value: any;
  belongsTo: Uuid;
}

export type UpvoteId = Uuid;
export class UpvoteItem implements Attribute {
  id: UpvoteId;
  type: "attribute";
  name: "upvote";
  value: number;
  belongsTo: Uuid;

  constructor(upvote: Partial<UpvoteItem> = {}) {
    this.id = upvote.id || uuid();
    this.type = "attribute";
    this.name = "upvote";
    this.value = upvote.value || 0;
    this.belongsTo = upvote.belongsTo || "";
  }
}

export type RelationId = Uuid;
interface Relation extends Item {
  id: RelationId;
  type: "relation";
  name: string;
  nameReverse?: string;
  from: Uuid;
  to: Uuid;
}

export class NoteIsParentRelation implements Relation {
  id: RelationId;
  type: "relation";
  name: "isParent";
  nameReverse: "isChild";
  from: NoteId;
  to: NoteId;

  constructor(relation: Partial<NoteIsParentRelation> = {}) {
    this.id = relation.id || uuid();
    this.type = "relation";
    this.name = "isParent";
    this.nameReverse = "isChild";
    this.from = relation.from || "";
    this.to = relation.to || "";
  }
}

type ItemTypes = BlockItem | NoteItem | LabelItem | UpvoteItem | NoteIsParentRelation;

export class Notes {
  private blockToNote: { [key: BlockId]: NoteId };
  private itemToAttributes: { [key: Uuid]: AttributeId[] };
  constructor(
    public items: Items<ItemTypes>,
    private updateItems: UpdateItem<ItemTypes>,
    private clearItems: () => void
  ) {
    this.blockToNote = {};
    this.itemToAttributes = {};
    Object.entries(this.items).forEach(([key, value]) => {
      if (value.type === "note") {
        const note = value as NoteItem;
        note.lines.forEach((line) => {
          this.blockToNote[line.id] = key;
        });
      } else if (value.type === "attribute") {
        const attribute = value as Attribute;
        if (!this.itemToAttributes[attribute.belongsTo]) {
          this.itemToAttributes[attribute.belongsTo] = [];
        }
        this.itemToAttributes[attribute.belongsTo].push(attribute.id);
      }
    });
  }

  clear() {
    this.clearItems();
    this.blockToNote = {};
  }

  getAttributes(item: Item): Attribute[] {
    const attributes = this.itemToAttributes[item.id];
    if (!attributes) {
      return [];
    }
    return attributes.map((id) => this.items[id]) as Attribute[];
  }

  getRelations(itemId: Uuid): Relation[] {
    const relations: Relation[] = [];
    Object.values(this.items).forEach((value) => {
      if (value.type === "relation") {
        const relation = value as Relation;
        if (relation.from === itemId || relation.to === itemId) {
          relations.push(relation);
        }
      }
    });
    return relations;
  }

  /**Get a note by id */
  getNote = (id: string) => {
    const item = this.items[id];
    if (item && item.type === "note") {
      return item as NoteItem;
    }
  };

  getNoteOrThrow = (id: string) => {
    const note = this.getNote(id);
    if (!note) {
      throw new Error(`Note ${id} not found`);
    }
    return note;
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

  getLabel = (id: string) => {
    const item = this.items[id];
    if (item && item.type === "label") {
      return item as LabelItem;
    }
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

  createNote = (): NoteId => {
    const note = new NoteItem({ lines: [{ id: uuid(), indent: 0 }] });
    note.lines.forEach((line) => {
      this.upsertBlock({ id: line.id });
    });
    return this.upsertNote(note, note.id);
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

  upsertUpvote = (upsert: Upsert<UpvoteItem>, upvoteId?: UpvoteId, belongsTo?: Uuid) => {
    const id = upvoteId || uuid();
    this.updateItems((items) => {
      const item = items[id] || new UpvoteItem({ id, belongsTo });
      if (item.type !== "attribute" || item.name !== "upvote") {
        throw new Error("Upvote not found");
      }
      const upvote = item as UpvoteItem;
      const newUpvote = typeof upsert === "function" ? upsert(upvote) : { ...upvote, ...upsert };
      return { [newUpvote.id]: newUpvote };
    });
  };

  upsertNoteIsParentRelation = (upsert: Upsert<NoteIsParentRelation>, relationId?: Uuid) => {
    const id = relationId || uuid();
    this.updateItems((items) => {
      const item = items[id] || new NoteIsParentRelation({ id });
      if (item.type !== "relation" || item.name !== "isParent") {
        throw new Error("Relation not found");
      }
      const relation = item as NoteIsParentRelation;
      const newRelation =
        typeof upsert === "function" ? upsert(relation) : { ...relation, ...upsert };
      return { [newRelation.id]: newRelation };
    });
  };
}

export class Note {
  private attributes: { upvote?: UpvoteItem };
  constructor(private noteItem: NoteItem, private notes: Notes) {
    this.attributes = {};
    const attrs = this.notes.getAttributes(noteItem);
    for (const attr of attrs) {
      if (attr.name === "upvote") {
        this.attributes.upvote = attr as UpvoteItem;
      }
    }
  }

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

  get upvotes() {
    return this.attributes.upvote?.value || 0;
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

  getLabels = () => {
    return this.notes.getLabels().filter((label) => label.noteIds.includes(this.noteItem.id));
  };

  upvote = () => {
    this.notes.upsertUpvote((upvote) => {
      return {
        ...upvote,
        value: upvote.value + 1,
        belongsTo: this.noteItem.id,
      };
    }, this.attributes.upvote?.id);
  };

  addChild = (id?: Uuid) => {
    const childId = id || this.notes.createNote();
    // Add child to same labels as parent
    this.getLabels().forEach((label) => {
      this.notes.upsertLabel((label) => {
        return {
          ...label,
          noteIds: [...label.noteIds, childId],
        };
      }, label.id);
    });
    // Add relation
    this.notes.upsertNoteIsParentRelation({
      to: this.noteItem.id,
      from: childId,
    });
    return childId;
  };

  getChildren = () => {
    const relations = this.notes.getRelations(this.noteItem.id);
    const isParentRels = relations.filter((relation) => {
      return relation.to === this.noteItem.id && relation.name === "isParent";
    });
    return isParentRels.map((isParentRel) => this.notes.getNoteOrThrow(isParentRel.from));
  };
}

export function useNotes(persist = false): Notes {
  const [items, updateItems, clearItems] = useItems<ItemTypes>({}, persist);
  return new Notes(items, updateItems, clearItems);
}
