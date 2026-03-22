export type PoliticalLean = "far-left" | "lean-left" | "center" | "lean-right" | "far-right";

export type AllSidesRating = {
  outlet: string;
  lean: PoliticalLean;
};

export type BiasDimensions = {
  emotionalTone: number;      // 0–100
  sourceDiversity: number;
  framing: number;
  omissionRisk: number;
  factualGrounding: number;
};

export type BiasHighlightKind = "charged-language" | "source-count" | "omission" | "framing";

export type BiasHighlight = {
  kind: BiasHighlightKind;
  /** Substring of summary.text to annotate */
  phrase: string;
  detail?: string;
};

export type ArticleBiasReport = {
  outlet: AllSidesRating;

  /** Continuous 0–100 score; 0 = far left, 50 = center, 100 = far right */
  politicalLeanScore: number;

  biasDimensions: BiasDimensions;

  /** Loaded/charged phrases flagged in the article text */
  flaggedPhrases: string[];

  summary: {
    /** Brief AI-generated bias summary */
    text: string;
    /** Inline annotations referencing spans in `text` */
    highlights: BiasHighlight[];
  };
};
