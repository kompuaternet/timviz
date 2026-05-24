module.exports = {
  ci: {
    collect: {
      startServerCommand: "NODE_OPTIONS=--no-experimental-webstorage npm run dev",
      startServerReadyPattern: "Ready",
      url: [
        "http://127.0.0.1:3000/ru",
        "http://127.0.0.1:3000/ru/catalog",
        "http://127.0.0.1:3000/ru/businesses/google-runo",
        "http://127.0.0.1:3000/ru/for-business"
      ],
      numberOfRuns: 1,
      settings: {
        preset: "desktop",
        chromeFlags: "--no-sandbox --disable-dev-shm-usage"
      }
    },
    assert: {
      preset: "lighthouse:no-pwa",
      assertions: {
        "categories:performance": ["warn", { minScore: 0.7 }],
        "categories:accessibility": ["warn", { minScore: 0.9 }],
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        "categories:seo": ["warn", { minScore: 0.9 }]
      }
    },
    upload: {
      target: "filesystem",
      outputDir: ".lighthouseci"
    }
  }
};
