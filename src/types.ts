export type Post = {
  id: number;
  authorId: string;
  content: string;
  comments?: number;
  likes?: number;
};

