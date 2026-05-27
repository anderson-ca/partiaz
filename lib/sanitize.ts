import DOMPurify from 'isomorphic-dompurify'

/**
 * HTML sanitization for the rich-text description editor ([ui-6b]).
 *
 * Single source of truth for the allowlist — same function runs on
 * server (Server Actions, where the trust boundary actually lives) and
 * could run on client if a future preview-without-save flow needs it.
 * isomorphic-dompurify wraps DOMPurify; on the server it uses jsdom,
 * on the client it uses native DOM.
 *
 * Allowlist (D5):
 *   Tags:   p, br, strong, em, b, i, ul, ol, li, a
 *   Attrs:  href, target, rel  (target + rel are force-set by the hook
 *           below regardless of input — see afterSanitizeAttributes)
 *
 * URI schemes for href:
 *   Explicit ALLOWED_URI_REGEXP requires http(s) / mailto / tel / or
 *   a relative path. javascript: and data: URLs are both rejected —
 *   DOMPurify defaults already strip these, but pinning the regex
 *   protects against upstream default changes (defense-in-depth flagged
 *   in the [ui-6b] decision points).
 *
 * Link safety:
 *   Every <a> tag gets target="_blank" rel="noopener noreferrer nofollow"
 *   force-applied via the afterSanitizeAttributes hook. User-supplied
 *   target/rel are overwritten. nofollow prevents Google ranking
 *   manipulation; noopener+noreferrer prevent tab-nabbing.
 */

// Module-load side effect: configure the link-safety hook once. Hooks
// are global to the DOMPurify instance. removeAllHooks first so module
// reloads (e.g., HMR) don't compound multiple hook registrations.
DOMPurify.removeAllHooks?.()
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  // Element-vs-Text distinction via tagName presence — avoids referencing
  // the global Element constructor which isn't defined in plain Node
  // contexts (e.g., unit-test scripts running without jsdom polyfill).
  if (
    'tagName' in node &&
    typeof node.tagName === 'string' &&
    node.tagName === 'A'
  ) {
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer nofollow')
  }
})

const SANITIZE_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'ul', 'ol', 'li', 'a'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[/.])/i,
}

const STRIP_ALL_CONFIG = {
  ALLOWED_TAGS: [] as string[],
  ALLOWED_ATTR: [] as string[],
  KEEP_CONTENT: true,
}

/**
 * Sanitize TipTap HTML output against the description allowlist.
 * Strips disallowed tags + attrs, forces link safety attrs, rejects
 * javascript: and data: schemes in href.
 */
export function sanitizeDescription(html: string): string {
  return DOMPurify.sanitize(html, SANITIZE_CONFIG)
}

/**
 * Plain-text length of HTML content — used for the 2000-char limit
 * enforcement on the server side (D4). Strips ALL markup, decodes
 * entities, collapses whitespace, returns character count.
 *
 * Using DOMPurify with KEEP_CONTENT + zero allowed tags is the
 * single-source-of-truth approach: same parser, same edge cases as
 * the real sanitizer. Regex-based strip would diverge on entity
 * decoding and HTML5 parser quirks.
 */
export function descriptionPlainTextLength(html: string): number {
  const text = DOMPurify.sanitize(html, STRIP_ALL_CONFIG)
  return text.replace(/\s+/g, ' ').trim().length
}
