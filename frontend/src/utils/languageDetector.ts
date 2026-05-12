const languagePatterns: Record<string, RegExp[]> = {
  python: [
    /^(from\s+\w+\s+import|import\s+\w+)/m,
    /^(def\s+\w+\s*\(|class\s+\w+\s*:)/m,
    /^(if\s+__name__\s*==\s*['"]__main__['"])/m,
    /print\s*\(/,
    /self\./,
    /@\w+\s*$/m,
  ],
  javascript: [
    /\bconst\s+\w+\s*=/,
    /\blet\s+\w+\s*=/,
    /\bvar\s+\w+\s*=/,
    /function\s+\w+\s*\(/,
    /=>\s*{/,
    /console\.(log|error|warn)/,
    /require\s*\(/,
    /module\.exports/,
    /async\s+function/,
  ],
  typescript: [
    /:\s*(string|number|boolean|any|void|never|unknown)\b/,
    /interface\s+\w+/,
    /type\s+\w+\s*=/,
    /<\w+>/,
    /as\s+(string|number|boolean|any)/,
    /:\s*\w+\[\]/,
    /React\.FC/,
  ],
  tsx: [
    /<\w+[^>]*>/,
    /<>/,
    /<\/\w+>/,
    /useState</,
    /useEffect</,
    /React\.Component/,
  ],
  html: [
    /^<!DOCTYPE\s+html>/im,
    /<html[^>]*>/i,
    /<head[^>]*>/i,
    /<body[^>]*>/i,
    /<div[^>]*>/i,
    /<span[^>]*>/i,
    /<img\s+src=/i,
    /<a\s+href=/i,
  ],
  css: [
    /^\s*\{[\w-]+\s*:/m,
    /@media\s/,
    /@import\s/,
    /\.([\w-]+)\s*{/,
    /#[\w-]+\s*{/,
    /:\s*(flex|grid|block|inline|none)\s*;/,
    /margin|padding|border|color|background/,
  ],
  cpp: [
    /#include\s*</,
    /std::/,
    /cout\s*<</,
    /cin\s*>>/,
    /nullptr/,
    /class\s+\w+\s*{/,
    /::\w+\(/,
    /template\s*</,
  ],
  c: [
    /#include\s*</,
    /int\s+main\s*\(/,
    /printf\s*\(/,
    /scanf\s*\(/,
    /malloc\s*\(/,
    /sizeof\s*\(/,
    /^#define\s/m,
  ],
  csharp: [
    /using\s+System/,
    /namespace\s+\w+/,
    /class\s+\w+\s*(:|{)/,
    /public\s+static\s+void\s+Main/,
    /Console\.Write/,
    /var\s+\w+\s*=/,
    /async\s+Task/,
    /await\s+/,
  ],
  java: [
    /public\s+class\s+/,
    /public\s+static\s+void\s+main/,
    /System\.out\.print/,
    /import\s+java\./,
    /private\s+\w+\s+\w+\s*[;=]/,
    /@Override/,
  ],
  php: [
    /<\?php/,
    /\$\w+\s*=/,
    /function\s+\w+\s*\(/,
    /echo\s+/,
    /->/,
    /::/,
    /array\s*\(/,
  ],
  go: [
    /^package\s+\w+/m,
    /func\s+\w+\s*\(/,
    /import\s+\(/,
    /fmt\./,
    /:=\s/,
    /go\s+func/,
    /defer\s+/,
  ],
  rust: [
    /^fn\s+\w+/m,
    /let\s+mut\s+/,
    /impl\s+\w+/,
    /pub\s+fn/,
    /use\s+std::/,
    /println!\s*\(/,
    /match\s+\w+\s*{/,
    /->\s*\w+/,
  ],
  ruby: [
    /^def\s+\w+/m,
    /^class\s+\w+/m,
    /end$/m,
    /puts\s+/,
    /require\s+/,
    /attr_accessor/,
    /@\w+\s*=/,
  ],
  lua: [
    /^function\s+\w+/m,
    /end$/m,
    /local\s+/,
    /print\s*\(/,
    /require\s*\(/,
    /\[\[.*\]\]/,
  ],
  sql: [
    /^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|FROM|WHERE)/im,
    /JOIN\s+\w+\s+ON/i,
    /GROUP\s+BY/i,
    /ORDER\s+BY/i,
    /HAVING\s+/i,
  ],
  bash: [
    /^#!/m,
    /^#!/,
    /\becho\s+/,
    /\bif\s+\[\[?/,
    /\$\{?\w+\}?/,
    /\bthen\b/,
    /\bfi\b/,
    /\bfor\s+\w+\s+in\b/,
    /\bdone\b/,
  ],
  powershell: [
    /\$\w+\s*=/,
    /Write-Host/,
    /Get-\w+/,
    /Set-\w+/,
    /-Object\b/,
    /\|/,
    /\[/,
    /\]/,
    /foreach\s*{/,
  ],
  json: [
    /^\s*{[\s\S]*"[\w-]+":\s*/,
    /^\s*\[[\s\S]*{/,
  ],
  yaml: [
    /^\s*[\w-]+:\s*$/m,
    /^\s*-\s+\w+/m,
    /:\s*(true|false|null)\s*$/m,
  ],
  markdown: [
    /^#{1,6}\s+/m,
    /^\*\*\w+\*\*/m,
    /^\[.*\]\(.*\)/m,
    /^```/m,
  ],
  dockerfile: [
    /^FROM\s+/m,
    /^RUN\s+/m,
    /^COPY\s+/m,
    /^WORKDIR\s+/m,
    /^EXPOSE\s+/m,
    /^CMD\s+/m,
  ],
  kotlin: [
    /^fun\s+\w+/m,
    /val\s+\w+\s*=/,
    /var\s+\w+\s*=/,
    /println\s*\(/,
    /class\s+\w+(\s*\(|\s*:)/,
    /companion\s+object/,
  ],
  swift: [
    /^func\s+\w+/m,
    /let\s+\w+\s*=/,
    /var\s+\w+\s*=/,
    /print\s*\(/,
    /class\s+\w+\s*:/,
    /struct\s+\w+/,
    /@objc/,
  ],
  xml: [
    /^<\?xml\s+/m,
    /<[\w-]+[^>]*>.*<\/[\w-]+>/,
    /xmlns=/,
  ],
  makefile: [
    /^[A-Z_]+[\w]*\s*=/m,
    /^\t[\w-]+:/m,
    /^Makefile/m,
    /\$\{?\w+\}?/,
  ],
  cmd: [
    /^(echo|set|cd|dir|del|mkdir|rmdir|ipconfig|netstat|ping|curl|wget|type|findstr)\s/mi,
    /%\w+%/,
    /^\s*@echo\s/mi,
    /^setlocal\s/mi,
    /^endlocal\s/mi,
  ],
}

const languageNames: Record<string, string> = {
  python: 'Python',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  tsx: 'TSX',
  html: 'HTML',
  css: 'CSS',
  cpp: 'C++',
  c: 'C',
  csharp: 'C#',
  java: 'Java',
  php: 'PHP',
  go: 'Go',
  rust: 'Rust',
  ruby: 'Ruby',
  lua: 'Lua',
  sql: 'SQL',
  bash: 'Bash',
  powershell: 'PowerShell',
  json: 'JSON',
  yaml: 'YAML',
  markdown: 'Markdown',
  dockerfile: 'Dockerfile',
  kotlin: 'Kotlin',
  swift: 'Swift',
  xml: 'XML',
  makefile: 'Makefile',
  cmd: 'CMD',
}

export function detectLanguage(code: string): string {
  const scores: Record<string, number> = {}

  for (const [lang, patterns] of Object.entries(languagePatterns)) {
    scores[lang] = 0
    for (const pattern of patterns) {
      if (pattern.test(code)) {
        scores[lang]++
      }
    }
  }

  let maxScore = 0
  let detectedLang = 'text'

  for (const [lang, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score
      detectedLang = lang
    }
  }

  if (maxScore < 2) {
    return 'text'
  }

  return languageNames[detectedLang] || 'text'
}