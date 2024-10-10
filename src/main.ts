let fetchImplementation: any;

if (typeof window === 'undefined') {
  // Running in Node.js
  // const { default: fetchNode } = await import("node-fetch");
  // fetchImplementation = fetchNode;

  // mod.cjs
  fetchImplementation = (...args: unknown[]): Promise<any> =>
    import('node-fetch').then(({ default: fetch }) =>
      fetch(...(args as Parameters<typeof fetch>))
    );
} else {
  // Running in the browser
  fetchImplementation = window.fetch.bind(window);
}

export default fetchImplementation;
