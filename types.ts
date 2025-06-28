
export type Determination = 'Likely AI-Generated' | 'Likely Human-Generated' | 'Inconclusive';

export interface AnalysisResult {
  determination: Determination;
  confidence: number;
  rationale: string;
}
