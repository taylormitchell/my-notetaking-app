export type Block = {
  id: string;
  type: string;
  text: string;
};

export type Note = {
  id: string;
  title: string | null;
  blocks: string[];
  createdAt: number;
  updatedAt: number;
};
