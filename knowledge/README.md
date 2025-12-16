# README

## Knowledge Directory

This directory contains markdown files that provide context to the AI when analyzing designs.

### How it Works

1. All `.md` files in this directory (and subdirectories) are automatically loaded
2. The content is included in Claude's system prompt
3. Claude uses this knowledge to provide more specific, informed feedback

### What to Include

Good examples of knowledge files:
- Design principles and guidelines
- Brand-specific design standards
- Typography rules
- Color palette guidelines
- Accessibility requirements
- Component usage guidelines
- Interaction patterns

### File Organization

You can organize files however you like:
- Flat structure: All files in `/knowledge/`
- Nested: Create subdirectories like `/knowledge/components/`, `/knowledge/branding/`
- All markdown files will be discovered and loaded

### Tips

- Keep files focused on specific topics
- Use clear, descriptive filenames
- Write in markdown format
- Be specific and actionable
- Update as your design system evolves

### Example Structure

```
knowledge/
├── design-principles.md
├── typography.md
├── color-contrast.md
├── components/
│   ├── buttons.md
│   └── forms.md
└── brand/
    ├── voice-tone.md
    └── visual-identity.md
```

