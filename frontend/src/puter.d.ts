// Type declarations for puter.js CDN library
// https://js.puter.com/v2/
// Loaded via <script> tag in index.html — no npm package needed.

export {};

declare global {
  // eslint-disable-next-line no-var
  var puter:
    | {
        ai: {
          chat(
            prompt: string,
            options?: { model?: string; stream?: boolean },
          ): Promise<{ message: { role: string; content: string } }>;
        };
      }
    | undefined;
}
