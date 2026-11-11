/** Text models that still exist on the Gemini API. gemini-1.5-flash has been shut down. */
export const DEFAULT_GEMINI_MODELS = ['gemini-3.5-flash-lite', 'gemini-2.5-flash'] as const

export function geminiModelCandidates(configured?: string): string[] {
  const custom = (configured ?? '').trim()
  if (!custom) return [...DEFAULT_GEMINI_MODELS]
  return [custom]
}

export function generationPrompt(body: { prompt?: unknown; topic?: unknown }): string {
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
  if (prompt) return prompt
  return typeof body.topic === 'string' ? body.topic.trim() : ''
}

export function parseModelJson(text: string): Record<string, unknown> | null {
  const trimmed = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  const candidates = [trimmed]
  const match = trimmed.match(/\{[\s\S]*\}/)
  if (match && match[0] !== trimmed) candidates.push(match[0])
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as unknown
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    } catch {
      continue
    }
  }
  return null
}
