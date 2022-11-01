type BlockId = string;
type NoteId = string;

export type Block = {
  id: BlockId;
  type: string;
  text: string;
};

export type Note = {
  id: NoteId;
  title: string | null;
  blocks: { id: BlockId; indent: number }[];
  createdAt: number;
  updatedAt: number;
};
