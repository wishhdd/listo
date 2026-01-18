export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  position: number;
  updatedAt: number;
}

export interface TodoList {
  id: string;
  title: string;
  items: TodoItem[];
  createdAt: number;
  themeColor: string;
  updatedAt: number;
  ownerId?: number;
  members?: number[];
}

export interface User {
  userId: number;
  userName: string;
  role?: string;
  message?: string;
}
