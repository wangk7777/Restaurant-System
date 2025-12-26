

import * as React from 'react';

/**
 * Declare the process.env global object to satisfy the Google GenAI SDK requirements.
 * Vite handles the actual replacement via the 'define' config in vite.config.ts.
 */
declare global {
    namespace NodeJS {
        interface ProcessEnv {
            // Use string | undefined to match standard Node.js ProcessEnv and avoid type mismatch errors.
            [key: string]: string | undefined;
            API_KEY: string;
        }
    }

    // Fix: Removed the redundant 'var process' declaration to resolve "Cannot redeclare block-scoped variable 'process'".
    // Augmenting the NodeJS namespace is sufficient to provide types for process.env.
}

declare module '*.svg' {
    export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement> & { title?: string }>;
}

interface ImportMetaEnv {
    readonly API_KEY: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

export {};