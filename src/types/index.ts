export interface Tile {
  id: number;
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
  data: number[][];
}

export interface TileMap {
  width: number;
  height: number;
  tileSize: number;
  layers: Layer[];
}
