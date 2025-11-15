export type Post = {
  id: number;
  authorId: string;
  content: string;
  comments?: number;
  likes?: number;
};

export type Comment = {
  id: number;
  postId: number;
  authorId: string;
  content: string;
  likes?: number;
};
