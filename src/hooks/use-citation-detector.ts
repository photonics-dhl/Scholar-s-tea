'use client';

import { useState, useCallback } from 'react';
import { detectCitationIntent, extractPotentialCitations, shouldTriggerVerification } from '@/lib/ai/citation-detector';

interface CitationIntentResult {
  hasIntent: boolean;
  confidence: number;
  extractedCitations: string[];
  needsVerification: boolean;
}

export function useCitationDetector() {
  const [result, setResult] = useState<CitationIntentResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const analyze = useCallback((text: string) => {
    setAnalyzing(true);

    const intentResult = detectCitationIntent(text);
    const extractedCitations = extractPotentialCitations(text);
    const needsVerification = shouldTriggerVerification(text);

    setResult({
      hasIntent: intentResult.hasCitation,
      confidence: intentResult.overallConfidence,
      extractedCitations,
      needsVerification,
    });

    setAnalyzing(false);
    return result;
  }, []);

  const reset = useCallback(() => {
    setResult(null);
  }, []);

  return {
    result,
    analyzing,
    analyze,
    reset,
    shouldShowCitationPrompt: result?.needsVerification && result.extractedCitations.length > 0,
  };
}
