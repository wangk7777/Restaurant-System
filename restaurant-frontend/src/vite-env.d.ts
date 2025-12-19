/// <reference types="vite/client" />

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

    // Use 'var process: any' to avoid "Cannot redeclare block-scoped variable 'process'"
    // and ensure compatibility across Node.js (vite.config.ts) and the browser.
    // This allows process.cwd() and process.env.API_KEY to be accessed without type errors.
    // In Node.js environments (like vite.config.ts), the real process object will be used.
    // In browser contexts, Vite's 'define' will handle the literal replacement of process.env.API_KEY.
    var process: any;
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
