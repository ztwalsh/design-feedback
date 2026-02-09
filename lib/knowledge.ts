import fs from 'fs';
import path from 'path';

export interface KnowledgeFile {
  filename: string;
  content: string;
  path: string;
}

/**
 * Priority knowledge files to load (most important for design feedback)
 * Add paths relative to /knowledge directory
 */
const PRIORITY_FILES = [
  // Core content design principles
  'content-design/fundamentals/content-principles.md',
  'content-design/fundamentals/active-voice.md',
  'content-design/fundamentals/reading-level.md',
  'content-design/accessibility.md',
  'content-design/choosing-tone.md',
  // Key interface content guidelines
  'content-design/interface-content-elements/error-messages.md',
  'content-design/interface-content-elements/empty-states.md',
  'content-design/interface-content-elements/input-fields.md',
  'content-design/interface-content-elements/placeholder-text.md',
  'content-design/interface-content-elements/confirmation-messages.md',
  // Grammar essentials
  'content-design/grammar/casing-and-capitalization.md',
  'content-design/grammar/punctuation.md',
];

/**
 * Max total characters to load (to keep context reasonable)
 */
const MAX_TOTAL_CHARS = 15000;

// Cache for knowledge files to avoid repeated file system reads
let cachedKnowledge: KnowledgeFile[] | null = null;

/**
 * Load only essential knowledge files to keep context efficient
 * Results are cached after first load for performance
 */
export function loadKnowledge(): KnowledgeFile[] {
  // Return cached results if available
  if (cachedKnowledge !== null) {
    return cachedKnowledge;
  }

  const knowledgeDir = path.join(process.cwd(), 'knowledge');
  const files: KnowledgeFile[] = [];
  let totalChars = 0;

  if (!fs.existsSync(knowledgeDir)) {
    console.warn('⚠️ Knowledge directory not found');
    cachedKnowledge = files;
    return files;
  }

  // First, load priority files
  for (const relativePath of PRIORITY_FILES) {
    const fullPath = path.join(knowledgeDir, relativePath);

    if (fs.existsSync(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');

        // Check if we'd exceed the limit
        if (totalChars + content.length > MAX_TOTAL_CHARS) {
          console.log(`⏹️ Stopping at ${files.length} files (char limit)`);
          break;
        }

        files.push({
          filename: path.basename(relativePath),
          content,
          path: relativePath,
        });
        totalChars += content.length;
        console.log(`📄 Loaded: ${relativePath}`);
      } catch (error) {
        console.error(`❌ Error reading ${fullPath}:`, error);
      }
    }
  }

  // Also load any .md files in the root knowledge directory
  try {
    const rootEntries = fs.readdirSync(knowledgeDir, { withFileTypes: true });
    for (const entry of rootEntries) {
      if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md') {
        const fullPath = path.join(knowledgeDir, entry.name);
        try {
          const content = fs.readFileSync(fullPath, 'utf8');

          if (totalChars + content.length > MAX_TOTAL_CHARS) {
            break;
          }

          // Skip if already loaded via priority
          if (!files.some(f => f.path === entry.name)) {
            files.push({
              filename: entry.name,
              content,
              path: entry.name,
            });
            totalChars += content.length;
            console.log(`📄 Loaded (root): ${entry.name}`);
          }
        } catch (error) {
          console.error(`❌ Error reading ${fullPath}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error reading knowledge directory:', error);
  }

  console.log(`✅ Loaded ${files.length} knowledge file(s) (~${Math.round(totalChars/1000)}k chars)`);

  // Cache the results
  cachedKnowledge = files;
  return files;
}

/**
 * Clear the knowledge cache (useful for testing or hot-reloading)
 */
export function clearKnowledgeCache(): void {
  cachedKnowledge = null;
}

/**
 * Format knowledge files into a string for Claude's system prompt
 */
export function formatKnowledgeForPrompt(knowledgeFiles: KnowledgeFile[]): string {
  if (knowledgeFiles.length === 0) {
    return '';
  }

  let formatted = '\n\n---\n## Reference Guidelines\n';

  for (const file of knowledgeFiles) {
    const title = file.filename.replace('.md', '').replace(/-/g, ' ');
    formatted += `\n### ${title}\n`;
    formatted += file.content.trim();
    formatted += '\n';
  }

  return formatted;
}

