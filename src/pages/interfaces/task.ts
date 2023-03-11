export interface TaskNode {
  text: string;
  depth: number;
  previousContext: string[];
  subtasks?: TaskNode[];
}