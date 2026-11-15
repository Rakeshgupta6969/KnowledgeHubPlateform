import React from 'react';
import DOMPurify from 'dompurify';

/**
 * Basic markdown to HTML converter with strict XSS sanitization via DOMPurify.
 * Supports:
 * - Headings (# H1, ## H2, ### H3)
 * - Bold (**text**) and Italic (*text*)
 * - Unordered lists (- item, * item)
 * - Blockquotes (> quote)
 * - Code blocks (```code```) and inline code (`code`)
 * - Paragraphs and line breaks
 */
function parseMarkdownToHtml(markdown = '') {
  if (!markdown) return '';

  let html = markdown;

  // Code blocks: ```code```
  html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-slate-100 p-3 rounded-lg overflow-x-auto text-xs font-mono my-3"><code>$1</code></pre>');

  // Inline code: `code`
  html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-pink-600">$1</code>');

  // Headings: # H1, ## H2, ### H3
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-base font-bold text-gray-900 mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold text-gray-900 mt-5 mb-2.5">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-xl font-extrabold text-gray-900 mt-6 mb-3">$1</h1>');

  // Blockquotes: > quote
  html = html.replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-blue-500 pl-4 py-1 my-3 text-gray-600 italic bg-blue-50/40 rounded-r">$1</blockquote>');

  // Bold & Italic: **bold**, *italic*
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

  // Unordered list items: - item or * item
  html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li class="ml-4 list-disc text-gray-700 my-1">$1</li>');

  // Wrap lines with paragraphs if not already wrapped in block tag
  const lines = html.split('\n\n');
  const wrapped = lines
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (
        trimmed.startsWith('<h1') ||
        trimmed.startsWith('<h2') ||
        trimmed.startsWith('<h3') ||
        trimmed.startsWith('<pre') ||
        trimmed.startsWith('<blockquote') ||
        trimmed.startsWith('<li')
      ) {
        return trimmed;
      }
      return `<p class="my-2.5 text-gray-700 leading-relaxed">${trimmed}</p>`;
    })
    .join('\n');

  return wrapped;
}

export default function SafeContent({ content, className = '' }) {
  if (!content) return null;

  // 1. Convert markdown to HTML structure
  const rawHtml = parseMarkdownToHtml(content);

  // 2. Strict sanitization to prevent Stored XSS
  const cleanHtml = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'b', 'i', 'strong', 'em', 'u', 'strike',
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
      'span', 'div', 'br', 'hr', 'a',
    ],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class'],
  });

  return (
    <div
      className={`prose max-w-none text-sm ${className}`}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
}
