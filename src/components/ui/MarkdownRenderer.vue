<template>
  <div class="markdown-content" v-html="renderedHtml"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { marked } from 'marked';

interface Props {
  content: string;
}

const props = defineProps<Props>();

// Configure marked for better rendering
marked.setOptions({
  breaks: true, // Convert line breaks to <br>
  gfm: true, // GitHub Flavored Markdown
});

const renderedHtml = computed(() => {
  if (!props.content) return '';
  
  // Remove specific date patterns
  let cleanContent = props.content
    .replace(/October 26, 2023/gi, '')
    .replace(/Date:\s*October 26, 2023/gi, '')
    .replace('Date:', '')
    .replace(/Generated on:\s*October 26, 2023/gi, '')
    .replace(/As of October 26, 2023/gi, '')
    .replace(/On October 26, 2023/gi, '')
    .replace(/^(?:Generated on|Date:|As of|On) [A-Za-z]+ \d{1,2}, \d{4}(?: at \d{1,2}:\d{2}(?: [AP]M)?)?[\n\r]+/i, '')
    .replace(/^\d{4}-\d{2}-\d{2}(?: \d{2}:\d{2}(?::\d{2})?)?[\n\r]+/, '');
  
  // Render the cleaned markdown
  return marked(cleanContent);
});
</script>

<style scoped>
.markdown-content {
  line-height: 1.7;
  color: #334155;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  font-weight: 700;
  color: #1e293b;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  line-height: 1.3;
}

.markdown-content :deep(h1) {
  font-size: 1.875rem;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0.5rem;
}

.markdown-content :deep(h2) {
  font-size: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 0.25rem;
}

.markdown-content :deep(h3) {
  font-size: 1.25rem;
}

.markdown-content :deep(h4) {
  font-size: 1.125rem;
}

.markdown-content :deep(h5) {
  font-size: 1rem;
}

.markdown-content :deep(h6) {
  font-size: 0.875rem;
  color: #64748b;
}

.markdown-content :deep(p) {
  margin-bottom: 1rem;
}

.markdown-content :deep(p:last-child) {
  margin-bottom: 0;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 1rem 0;
  padding-left: 1.5rem;
}

.markdown-content :deep(li) {
  margin-bottom: 0.5rem;
}

.markdown-content :deep(blockquote) {
  margin: 1rem 0;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-left: 4px solid #427AA1;
  border-radius: 0 8px 8px 0;
  font-style: italic;
  color: #475569;
}

.markdown-content :deep(code) {
  background: #f1f5f9;
  color: #e11d48;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 0.875em;
  font-weight: 600;
}

.markdown-content :deep(pre) {
  margin: 1rem 0;
  padding: 1rem;
  background: #1e293b;
  color: #f8fafc;
  border-radius: 8px;
  overflow-x: auto;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
}

.markdown-content :deep(pre code) {
  background: none;
  color: inherit;
  padding: 0;
  font-size: inherit;
}

.markdown-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.markdown-content :deep(th) {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  font-weight: 700;
  color: #1e293b;
}

.markdown-content :deep(tr:last-child td) {
  border-bottom: none;
}

.markdown-content :deep(a) {
  color: #427AA1;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.markdown-content :deep(a:hover) {
  color: #2c5282;
  text-decoration: underline;
}

.markdown-content :deep(strong) {
  font-weight: 700;
  color: #1e293b;
}

.markdown-content :deep(em) {
  font-style: italic;
  color: #475569;
}

.markdown-content :deep(hr) {
  border: none;
  height: 2px;
  background: linear-gradient(90deg, #e2e8f0 0%, #cbd5e1 50%, #e2e8f0 100%);
  margin: 2rem 0;
  border-radius: 1px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .markdown-content :deep(pre) {
    font-size: 0.75rem;
    padding: 0.75rem;
  }
  
  .markdown-content :deep(th),
  .markdown-content :deep(td) {
    padding: 0.5rem;
  }
  
  .markdown-content :deep(blockquote) {
    padding: 0.75rem 1rem;
  }
}
</style>
