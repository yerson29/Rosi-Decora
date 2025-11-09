export interface Furniture {
  name: string;
  description: string;
  price: string;
  link: string;
  imageUrl?: string; // New: Optional URL for the furniture image
}

export interface ImageBase64 {
  data: string;
  mimeType: string;
}

export interface Iteration {
    prompt: string;
    imageUrl: string;
    imageBase64: ImageBase64 | null; // Can be null for archived projects
}

export interface StyleVariation {
  style_name: string;
  description: string;
  color_palette: string[];
  furniture_recommendations: Furniture[];
  imageUrl: string;
  imageBase64: ImageBase64 | null; // Can be null for archived projects
  iterations: Iteration[];
}

export interface Project {
  id: string;
  name: string;
  originalImage: string; // This will now store the full data: URL for persistence
  originalImageBase64: ImageBase64 | null; // Can be null for archived projects
  analysis: string;
  styleVariations: StyleVariation[];
  createdAt: string;
}

export interface FavoriteDesign {
  id: string;
  projectId: string;
  projectName: string;
  favoritedAt: string;
  styleVariation: StyleVariation;
}

export type AppView = 'upload' | 'project' | 'archive' | 'favorites';