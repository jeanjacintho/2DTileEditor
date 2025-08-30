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
  data: (string | null)[][];
}

export interface TileMap {
  width: number;
  height: number;
  tileSize: number;
  layers: Layer[];
}
