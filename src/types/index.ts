export interface Tile {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  isCollision: boolean;
  data: (string | null)[][]; // Matriz dinâmica que cresce conforme necessário
}

export interface TileMap {
  width: number; // Será calculado dinamicamente
  height: number; // Será calculado dinamicamente
  tileSize: number;
  layers: Layer[];
}
