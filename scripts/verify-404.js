#!/usr/bin/env node
/**
 * Script to verify 404.html generation and location
 * Run after: BASE_PATH=/portfolio npm run build
 */

const fs = require('fs');
const path = require('path');

const REPO_NAME = process.env.BASE_PATH?.replace(/^\//, '') || 'portfolio';
const OUT_DIR = path.join(process.cwd(), 'out');

// #region agent log
fetch('http://127.0.0.1:7243/ingest/198c5c55-2524-45ed-b90b-05a4e1c6069f', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    location: 'verify-404.js:start',
    message: 'Starting 404.html verification',
    data: { repoName: REPO_NAME, outDir: OUT_DIR },
    timestamp: Date.now(),
    sessionId: 'debug-session',
    runId: 'verify-404',
    hypothesisId: 'A'
  })
}).catch(() => {});
// #endregion

function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  let content = null;
  let size = 0;
  
  if (exists) {
    const stats = fs.statSync(filePath);
    size = stats.size;
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch (e) {
      content = `[Error reading file: ${e.message}]`;
    }
  }

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/198c5c55-2524-45ed-b90b-05a4e1c6069f', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: 'verify-404.js:checkFile',
      message: `Checking ${description}`,
      data: { filePath, exists, size, hasContent: !!content, contentPreview: content?.substring(0, 200) },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'verify-404',
      hypothesisId: exists ? 'B' : 'A'
    })
  }).catch(() => {});
  // #endregion

  return { exists, size, content };
}

function find404Files(dir) {
  const results = [];
  
  function search(currentDir) {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory()) {
          search(fullPath);
        } else if (entry.name === '404.html') {
          const relativePath = path.relative(OUT_DIR, fullPath);
          const stats = checkFile(fullPath, `Found 404.html at ${relativePath}`);
          results.push({ path: relativePath, fullPath, ...stats });
        }
      }
    } catch (e) {
      // Skip directories we can't read
    }
  }
  
  search(dir);
  return results;
}

console.log('🔍 Verifying 404.html generation...');
console.log(`Repository name: ${REPO_NAME}`);
console.log(`Out directory: ${OUT_DIR}\n`);

// Check root location
const root404 = checkFile(path.join(OUT_DIR, '404.html'), '404.html at root');

// Check basePath location
const basePath404 = checkFile(
  path.join(OUT_DIR, REPO_NAME, '404.html'),
  `404.html at out/${REPO_NAME}/404.html`
);

// Search for all 404.html files
console.log('\n📂 Searching for all 404.html files...');
const all404Files = find404Files(OUT_DIR);

// #region agent log
fetch('http://127.0.0.1:7243/ingest/198c5c55-2524-45ed-b90b-05a4e1c6069f', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    location: 'verify-404.js:results',
    message: '404.html search results',
    data: {
      rootExists: root404.exists,
      basePathExists: basePath404.exists,
      allFilesFound: all404Files.map(f => ({ path: f.path, size: f.size })),
      rootContentPreview: root404.content?.substring(0, 500),
      basePathContentPreview: basePath404.content?.substring(0, 500)
    },
    timestamp: Date.now(),
    sessionId: 'debug-session',
    runId: 'verify-404',
    hypothesisId: 'C'
  })
}).catch(() => {});
// #endregion

// Analyze content
if (root404.exists && root404.content) {
  const hasCustomContent = root404.content.includes('NotFoundContent') || 
                          root404.content.includes('Page not found') ||
                          root404.content.includes('404');
  const hasAssetPaths = root404.content.includes('/_next/') || 
                       root404.content.includes(`/${REPO_NAME}/_next/`);
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/198c5c55-2524-45ed-b90b-05a4e1c6069f', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: 'verify-404.js:contentAnalysis',
      message: 'Analyzing root 404.html content',
      data: {
        hasCustomContent,
        hasAssetPaths,
        containsNotFoundContent: root404.content.includes('NotFoundContent'),
        containsPageNotFound: root404.content.includes('Page not found'),
        assetPathMatches: root404.content.match(/\/[_a-zA-Z0-9\/-]*\/_next\/[^"'\s]*/g) || []
      },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'verify-404',
      hypothesisId: 'D'
    })
  }).catch(() => {});
  // #endregion
}

// Print summary
console.log('\n📊 Summary:');
console.log(`Root (out/404.html): ${root404.exists ? '✓ EXISTS' : '✗ NOT FOUND'} ${root404.exists ? `(${root404.size} bytes)` : ''}`);
console.log(`BasePath (out/${REPO_NAME}/404.html): ${basePath404.exists ? '✓ EXISTS' : '✗ NOT FOUND'} ${basePath404.exists ? `(${basePath404.size} bytes)` : ''}`);

if (all404Files.length > 0) {
  console.log(`\nFound ${all404Files.length} total 404.html file(s):`);
  all404Files.forEach(file => {
    console.log(`  - ${file.path} (${file.size} bytes)`);
  });
} else {
  console.log('\n⚠️  No 404.html files found anywhere!');
}

if (root404.exists && root404.content) {
  const isCustom = root404.content.includes('NotFoundContent') || root404.content.includes('Page not found');
  console.log(`\nContent check: ${isCustom ? '✓ Custom content detected' : '⚠️  May be default Next.js 404'}`);
  
  const assetPaths = root404.content.match(/\/[_a-zA-Z0-9\/-]*\/_next\/[^"'\s]*/g) || [];
  if (assetPaths.length > 0) {
    console.log(`Asset paths found: ${assetPaths.length}`);
    console.log(`  Sample: ${assetPaths[0]}`);
  }
}

console.log('\n');
