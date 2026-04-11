export interface ComarcaSVG {
  id: string;
  nom: string;
  path: string;
  labelX: number;
  labelY: number;
}

export const COMARQUES_SVG: ComarcaSVG[] = [
  {
    id: 'valles-occidental',
    nom: 'Vallès Occidental',
    path: 'M 155 195 L 185 188 L 200 200 L 195 220 L 165 225 Z',
    labelX: 175,
    labelY: 208,
  },
  {
    id: 'valles-oriental',
    nom: 'Vallès Oriental',
    path: 'M 195 175 L 230 168 L 245 180 L 240 205 L 200 200 L 185 188 Z',
    labelX: 215,
    labelY: 188,
  },
  {
    id: 'barcelones',
    nom: 'Barcelonès',
    path: 'M 175 220 L 195 220 L 200 235 L 178 237 Z',
    labelX: 186,
    labelY: 229,
  },
  {
    id: 'baix-llobregat',
    nom: 'Baix Llobregat',
    path: 'M 145 220 L 175 220 L 178 237 L 170 255 L 148 248 Z',
    labelX: 162,
    labelY: 238,
  },
  {
    id: 'maresme',
    nom: 'Maresme',
    path: 'M 200 175 L 245 155 L 260 170 L 245 180 L 230 168 Z',
    labelX: 230,
    labelY: 168,
  },
  {
    id: 'osona',
    nom: 'Osona',
    path: 'M 195 130 L 245 118 L 260 140 L 245 155 L 200 150 Z',
    labelX: 228,
    labelY: 137,
  },
  {
    id: 'bages',
    nom: 'Bages',
    path: 'M 130 155 L 165 148 L 185 165 L 185 188 L 155 195 L 128 178 Z',
    labelX: 157,
    labelY: 172,
  },
  {
    id: 'anoia',
    nom: 'Anoia',
    path: 'M 110 210 L 145 200 L 155 195 L 165 225 L 148 248 L 112 235 Z',
    labelX: 137,
    labelY: 220,
  },
  {
    id: 'garraf',
    nom: 'Garraf',
    path: 'M 148 248 L 170 255 L 165 272 L 145 268 Z',
    labelX: 157,
    labelY: 261,
  },
  {
    id: 'alt-penedes',
    nom: 'Alt Penedès',
    path: 'M 112 235 L 148 248 L 145 268 L 118 262 Z',
    labelX: 132,
    labelY: 253,
  },
  {
    id: 'bergueda',
    nom: 'Berguedà',
    path: 'M 128 110 L 175 100 L 185 130 L 165 148 L 130 155 Z',
    labelX: 155,
    labelY: 128,
  },
  {
    id: 'selva',
    nom: 'Selva',
    path: 'M 260 140 L 300 130 L 310 158 L 280 172 L 260 165 L 245 155 Z',
    labelX: 282,
    labelY: 152,
  },
  {
    id: 'girones',
    nom: 'Gironès',
    path: 'M 280 115 L 315 108 L 325 130 L 300 130 L 260 140 L 265 118 Z',
    labelX: 298,
    labelY: 122,
  },
  {
    id: 'tarragonès',
    nom: 'Tarragonès',
    path: 'M 150 268 L 178 262 L 185 282 L 160 290 Z',
    labelX: 168,
    labelY: 278,
  },
  {
    id: 'baix-camp',
    nom: 'Baix Camp',
    path: 'M 178 262 L 210 255 L 215 278 L 185 282 Z',
    labelX: 197,
    labelY: 270,
  },
  {
    id: 'conca-barbera',
    nom: 'Conca de Barberà',
    path: 'M 145 248 L 178 262 L 175 245 L 158 235 Z',
    labelX: 162,
    labelY: 248,
  },
  {
    id: 'urgell',
    nom: 'Urgell',
    path: 'M 100 200 L 130 192 L 145 200 L 130 225 L 100 218 Z',
    labelX: 117,
    labelY: 208,
  },
  {
    id: 'segarra',
    nom: 'Segarra',
    path: 'M 100 175 L 130 168 L 145 178 L 130 192 L 100 185 Z',
    labelX: 117,
    labelY: 182,
  },
  {
    id: 'pallars-jussà',
    nom: 'Pallars Jussà',
    path: 'M 80 120 L 128 110 L 130 140 L 108 152 L 78 145 Z',
    labelX: 104,
    labelY: 132,
  },
  {
    id: 'ribera-ebre',
    nom: "Ribera d'Ebre",
    path: 'M 200 268 L 232 260 L 238 280 L 210 285 Z',
    labelX: 218,
    labelY: 273,
  },
];
