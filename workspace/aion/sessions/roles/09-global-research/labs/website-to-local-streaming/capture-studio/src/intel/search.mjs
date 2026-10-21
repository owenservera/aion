// Incremental, removable BM25 corpus index. Local evidence only; no embeddings or dependencies.
import { textTokens, normalizeText, stableStringify } from './similarity.mjs';

function documentText(value, depth = 0) {
  if (depth > 12 || value === null || value === undefined) return '';
  if (typeof value !== 'object') return String(value);
  return Object.entries(value).map(([key, v]) => (Array.isArray(value) ? '' : key + ' ') + documentText(v, depth + 1)).join(' ');
}

export class CorpusSearchIndex {
  constructor({ k1 = 1.2, b = 0.75, maxTokens = 20000 } = {}) {
    this.k1 = Number.isFinite(k1) && k1 > 0 ? k1 : 1.2;
    this.b = Number.isFinite(b) ? Math.max(0, Math.min(1, b)) : 0.75;
    this.maxTokens = Number.isInteger(maxTokens) && maxTokens > 0 ? maxTokens : 20000;
    this.documents = new Map(); this.postings = new Map(); this.totalLength = 0;
  }
  add(id, document, { text, source, boost = 1 } = {}) {
    id = String(id); this.remove(id);
    const content = text ?? documentText(document);
    const all = textTokens(content), tokens = all.slice(0, this.maxTokens), frequencies = new Map();
    for (const token of tokens) frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
    const row = { id, document, text: String(content), source: source ?? document?.source ?? null,
      boost: Number.isFinite(boost) ? Math.max(0, boost) : 1, length: tokens.length, frequencies,
      truncated: all.length > tokens.length };
    this.documents.set(id, row); this.totalLength += row.length;
    for (const [token, frequency] of frequencies) {
      if (!this.postings.has(token)) this.postings.set(token, new Map());
      this.postings.get(token).set(id, frequency);
    }
    return this;
  }
  remove(id) {
    id = String(id); const row = this.documents.get(id); if (!row) return false;
    for (const token of row.frequencies.keys()) {
      const posting = this.postings.get(token); posting.delete(id);
      if (!posting.size) this.postings.delete(token);
    }
    this.totalLength -= row.length; this.documents.delete(id); return true;
  }
  search(query, { limit = 20, requireAll = false, filter, phraseBoost = 0.3 } = {}) {
    const terms = [...new Set(textTokens(query))];
    if (!terms.length || !this.documents.size) return [];
    const candidates = new Map(), N = this.documents.size, avg = this.totalLength / N || 1;
    for (const term of terms) {
      const posting = this.postings.get(term); if (!posting) continue;
      const idf = Math.log(1 + (N - posting.size + 0.5) / (posting.size + 0.5));
      for (const [id, frequency] of posting) {
        const row = this.documents.get(id), hit = candidates.get(id) ?? { row, score: 0, matchedTerms: [] };
        hit.score += idf * frequency * (this.k1 + 1) / (frequency + this.k1 * (1 - this.b + this.b * row.length / avg));
        hit.matchedTerms.push(term); candidates.set(id, hit);
      }
    }
    const phrase = normalizeText(query);
    return [...candidates.values()].filter(({ row, matchedTerms }) => (!requireAll || matchedTerms.length === terms.length)
      && (!filter || filter(row.document, row.source)))
      .map(({ row, score, matchedTerms }) => {
        const exactPhrase = normalizeText(row.text).includes(phrase);
        const words = terms.map((term) => row.text.toLowerCase().indexOf(term)).filter((i) => i >= 0);
        const at = words.length ? Math.min(...words) : 0;
        return { id: row.id, score: +((score + (exactPhrase ? Math.max(0, phraseBoost) : 0)) * row.boost).toFixed(6),
          matchedTerms, coverage: matchedTerms.length / terms.length, exactPhrase,
          source: row.source, document: row.document, snippet: row.text.slice(Math.max(0, at - 70), at + 180),
          indexTruncated: row.truncated };
      }).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
      .slice(0, Number.isInteger(limit) && limit > 0 ? limit : 20);
  }
  stats() { return { documents: this.documents.size, terms: this.postings.size, tokens: this.totalLength,
    truncatedDocuments: [...this.documents.values()].filter((d) => d.truncated).length }; }
}

export function indexCorpus(samples, options) {
  const index = new CorpusSearchIndex(options), repeats = new Map();
  for (const sample of samples) {
    const source = sample.source ?? {};
    const base = stableStringify([source.session, source.sid, source.seq, source.domId, source.group, source.index]);
    const ordinal = repeats.get(base) ?? 0; repeats.set(base, ordinal + 1);
    index.add(base + ':' + ordinal, sample, { text: documentText(sample.value ?? sample.attrs ?? sample), source });
  }
  return index;
}

export function rankCorpus(samples, query, options = {}) { return indexCorpus(samples, options).search(query, options); }
