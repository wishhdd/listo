export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export interface TodoList {
  id: string;
  title: string;
  items: TodoItem[];
  createdAt: number;
  themeColor: string;
}
