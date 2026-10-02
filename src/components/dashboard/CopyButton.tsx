import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

/** Copies `text` to the clipboard and says so for a moment. */
export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            type="button"
            onClick={async () => {
                try {
                    await navigator.clipboard.writeText(text);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                } catch {
                    // Clipboard blocked (insecure context, permissions): nothing useful to show.
                }
            }}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs shrink-0"
            style={{ background: 'var(--db-surface)', minHeight: 0 }}
        >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copied' : label}
        </button>
    );
}
