import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import SafeContent from '../components/SafeContent';

describe('SafeContent Component (XSS Prevention & Markdown Rendering)', () => {
  it('renders standard markdown elements safely', () => {
    const markdown = '# Main Heading\n\n**Bold text** and *italic text*\n\n`inline code`';
    const { container } = render(<SafeContent content={markdown} />);

    expect(container.querySelector('h1')).not.toBeNull();
    expect(container.querySelector('h1').textContent).toBe('Main Heading');
    expect(container.querySelector('strong').textContent).toBe('Bold text');
    expect(container.querySelector('em').textContent).toBe('italic text');
    expect(container.querySelector('code').textContent).toBe('inline code');
  });

  it('CRITICAL SECURITY: strips malicious script tags to prevent Stored XSS', () => {
    const maliciousInput = '# Hello\n\n<script>alert("XSS")</script>\nSafe paragraph.';
    const { container } = render(<SafeContent content={maliciousInput} />);

    expect(container.querySelector('script')).toBeNull();
    expect(container.innerHTML).not.toContain('<script>');
    expect(container.innerHTML).not.toContain('alert("XSS")');
    expect(container.textContent).toContain('Safe paragraph.');
  });

  it('CRITICAL SECURITY: strips onerror and event handlers from HTML elements', () => {
    const maliciousImg = 'Check this: <img src="invalid-image.jpg" onerror="alert(\'pwned\')" />';
    const { container } = render(<SafeContent content={maliciousImg} />);

    expect(container.innerHTML).not.toContain('onerror');
    expect(container.innerHTML).not.toContain('alert');
  });

  it('CRITICAL SECURITY: sanitizes dangerous javascript: URIs', () => {
    const maliciousLink = '<a href="javascript:alert(1)">Click me</a>';
    const { container } = render(<SafeContent content={maliciousLink} />);

    const link = container.querySelector('a');
    if (link) {
      expect(link.getAttribute('href')).not.toBe('javascript:alert(1)');
    }
  });

  it('returns null when content is empty or undefined', () => {
    const { container } = render(<SafeContent content="" />);
    expect(container.firstChild).toBeNull();
  });
});
