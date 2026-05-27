import sanitizeHtml from 'sanitize-html'

/**
 * HTML sanitization for the rich-text description editor ([ui-6b]).
 *
 * Pure-CJS server-only path via sanitize-html. The original
 * isomorphic-dompurify implementation lazy-loaded jsdom which lazy-loaded
 * html-encoding-sniffer@6 which transitively depends on @exodus/bytes
 * (ESM-only) — Node's CommonJS require() chokes on the ESM module and
 * crashes every route that imports this file. Hotfix rolled back to a
 * DOM-less HTML parser (sanitize-html uses htmlparser2 under the hood).
 *
 * Allowlist (D5 from [ui-6b]):
 *   Tags:   p, br, strong, em, b, i, ul, ol, li, a
 *   Attrs:  a[href, target, rel]
 *   Schemes for href: http, https, mailto, tel — javascript: and data:
 *           are rejected by omission. allowedSchemesAppliedToAttributes
 *           pins the scheme check to <a href> specifically.
 *
 * Link safety: transformTags.a spreads incoming attribs then force-
 *   overwrites target='_blank' and rel='noopener noreferrer nofollow'.
 *   Attacker-supplied target/rel are clobbered. nofollow prevents Google
 *   ranking manipulation; noopener+noreferrer prevent tab-nabbing.
 *
 * sanitize-html applies the scheme filter BEFORE transformTags runs, so
 * an href='javascript:...' is dropped before the transform can preserve
 * it. Belt and suspenders.
 */

const ALLOWLIST: sanitizeHtml.IOptions = {
  allowedTags: ['p', 'br', 'strong', 'em', 'b', 'i', 'ul', 'ol', 'li', 'a'],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesAppliedToAttributes: ['href'],
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        target: '_blank',
        rel: 'noopener noreferrer nofollow',
      },
    }),
  },
}

const STRIP_ALL: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
}

/**
 * Sanitize TipTap HTML output against the description allowlist.
 * Strips disallowed tags + attrs, forces link safety attrs, rejects
 * javascript:/data: in href.
 */
export function sanitizeDescription(html: string): string {
  return sanitizeHtml(html, ALLOWLIST)
}

/**
 * Plain-text length of HTML content — used for the 2000-char server-side
 * limit (D4). Strips ALL markup, collapses whitespace, returns count.
 * Whitespace-collapse matches TipTap CharacterCount's behavior so the
 * client-side count display and server-side enforcement stay in sync.
 */
export function descriptionPlainTextLength(html: string): number {
  const text = sanitizeHtml(html, STRIP_ALL)
  return text.replace(/\s+/g, ' ').trim().length
}
