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
  position?: number;
}

export interface User {
  userId: number;
  userName: string;
  role?: string;
  message?: string;
}

export interface ServerTodoList {
  id: string;
  title: string;
  owner_id: number;
  members: number[];
  updated_at: number | string;
  created_at?: number | string;
}

export interface ServerTodoItem {
  id: string;
  list_id: string;
  text: string;
  is_completed: boolean;
  position: number;
  updated_at: number | string;
}
