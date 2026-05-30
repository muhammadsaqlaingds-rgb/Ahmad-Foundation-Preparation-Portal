import React from "react";

/**
 * Securely formats mathematical powers in text (e.g. 2^3, x^y, 10^{15})
 * into a list of JSX elements with <sup> tags for rendering in Next.js/React.
 * 
 * Supported notations:
 * - base^exponent (e.g., 2^3, x^y)
 * - base^{exponent} (e.g., 2^{10}, x^{y+1})
 */
export function renderFormattedText(text: string): React.ReactNode {
    if (!text) return "";

    // Regex matches:
    // Group 1: base (any letters, numbers, or dots)
    // Group 2: exponent part
    // Group 3: exponent if written inside curly braces {exponent}
    // Group 4: exponent if written directly after ^ without braces
    const regex = /([a-zA-Z0-9.]+)\^({([^}]+)}|([a-zA-Z0-9.+-]+))/g;

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
        const matchIndex = match.index;
        const base = match[1];
        const exponent = match[3] || match[4];

        // Add the plain text before the match (if any)
        if (matchIndex > lastIndex) {
            elements.push(text.substring(lastIndex, matchIndex));
        }

        // Add the formatted base and exponent as a superscript element
        elements.push(
            <span key={matchIndex} className="inline-block">
                {base}
                <sup className="text-[0.75em] align-super leading-none font-semibold">{exponent}</sup>
            </span>
        );

        lastIndex = regex.lastIndex;
    }

    // Add any remaining trailing text
    if (lastIndex < text.length) {
        elements.push(text.substring(lastIndex));
    }

    return elements.length > 0 ? elements : text;
}
