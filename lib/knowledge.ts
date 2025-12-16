import fs from 'fs';
import path from 'path';

export interface KnowledgeFile {
  filename: string;
  content: string;
  path: string;
}

/**
 * Recursively read all markdown files from the knowledge directory
 */
export function loadKnowledge(): KnowledgeFile[] {
  const knowledgeDir = path.join(process.cwd(), 'knowledge');
  const files: KnowledgeFile[] = [];

  if (!fs.existsSync(knowledgeDir)) {
    console.warn('⚠️ Knowledge directory not found');
    return files;
  }

  function readDirectory(dir: string, relativePath: string = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(relativePath, entry.name);

      if (entry.isDirectory()) {
        readDirectory(fullPath, relPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          files.push({
            filename: entry.name,
            content,
            path: relPath,
          });
          console.log(`📄 Loaded: ${relPath}`);
        } catch (error) {
          console.error(`❌ Error reading ${fullPath}:`, error);
        }
      }
    }
  }

  readDirectory(knowledgeDir);
  console.log(`✅ Loaded ${files.length} knowledge file(s)`);
  return files;
}

/**
 * Format knowledge files into a string for Claude's system prompt
 */
export function formatKnowledgeForPrompt(knowledgeFiles: KnowledgeFile[]): string {
  if (knowledgeFiles.length === 0) {
    return '';
  }

  let formatted = '\n\n# Knowledge Base\n\n';
  formatted += 'Use the following guidelines and principles when analyzing designs:\n\n';

  for (const file of knowledgeFiles) {
    formatted += `## ${file.filename.replace('.md', '')}\n\n`;
    formatted += file.content;
    formatted += '\n\n---\n\n';
  }

  return formatted;
}

