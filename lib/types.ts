/**
 * Shared type definitions
 */

export type DimensionKey = 'visual' | 'hierarchy' | 'accessibility' | 'interaction' | 'ux' | 'content';

export type Rating = 'Good' | 'Strong' | 'Fair' | 'Needs Work' | null;

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface Assessment {
  overall: Rating;
  visualDesign: Rating;
  hierarchy: Rating;
  accessibility: Rating;
  interaction: Rating;
  ux: Rating;
  content: Rating;
}

export interface ImageData {
  base64: string;
  fullUrl: string;
}
