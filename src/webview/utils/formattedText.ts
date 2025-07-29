/* eslint-disable @typescript-eslint/no-explicit-any */
import Mustache from 'mustache';
import hljs from 'highlight.js';
import 'highlight.js/styles/default.css';

function buildSyntaxHighlighter(language: string) {
  return function () {
    return function (text: string, render: (text: string) => string) {
      const renderedText = render(text);
      if (
        [
          'html',
          'xml',
          'csharp',
          'java',
          'javascript',
          'ruby',
          'python',
          'php',
          'go',
        ].includes(language)
      ) {
        return (
          '<pre class="code-block" >' +
          hljs.highlight(renderedText, { language }).value +
          '</pre>'
        );
      }
      return hljs.highlightAuto(renderedText).value;
    };
  };
}

export const customMustacheTags = {
  nl: '<br/>',

  codeString() {
    return (text: string, render: (text: string) => string) =>
      `<span class='code-string'>${render(text)}</span>`;
  },

  block() {
    return (text: string, render: any) => `<div>${render(text)}</div>`;
  },

  blockQuote() {
    return (text: string, render: any) =>
      `<blockquote>${render(text)}</blockquote>`;
  },

  code() {
    return (text: string, render: any) => `<code>${render(text)}</code>`;
  },

  emphasize() {
    return (text: string, render: any) => `<u>${render(text)}</u>`;
  },

  exampleText() {
    return (text: string, render: any) => `<b>${render(text)}</b>`;
  },

  header() {
    return (text: string, render: any) => `<h3>${render(text)}</h3>`;
  },

  link() {
    return (text: string, render: any) => {
      const [url, linkText] = render(text).split('$$LINK_DELIM$$');
      return `<a href="${url}">${linkText}</a>`;
    };
  },

  paragraph() {
    return (text: string, render: any) => `<p>${render(text)}</p>`;
  },

  orderedList() {
    return (text: string, render: any) => `<ol>${render(text)}</ol>`;
  },

  unorderedList() {
    return (text: string, render: any) => `<ul>${render(text)}</ul>`;
  },

  listElement() {
    return (text: string, render: any) => `<li>${render(text)}</li>`;
  },

  table() {
    return (text: string, render: any) =>
      `<table class='tbl-evidence'>${render(text)}</table>`;
  },

  tableRow() {
    return (text: string, render: any) => `<tr>${render(text)}</tr>`;
  },

  tableCell() {
    return (text: string, render: any) => `<td>${render(text)}</td>`;
  },

  redacted() {
    return (text: string) =>
      `<span class="break-word"><span class="bold-important">${text}</span></span>`;
  },

  badConfig() {
    return (text: string, render: any) =>
      `<font color='red'>${render(text)}</font>`;
  },

  goodConfig() {
    return (text: string, render: any) =>
      `<font color='green'>${render(text)}</font>`;
  },

  // Syntax highlight code blocks
  csharpBlock: buildSyntaxHighlighter('csharp'),
  javaBlock: buildSyntaxHighlighter('java'),
  javascriptBlock: buildSyntaxHighlighter('javascript'),
  rubyBlock: buildSyntaxHighlighter('ruby'),
  pythonBlock: buildSyntaxHighlighter('python'),
  phpBlock: buildSyntaxHighlighter('php'),
  goBlock: buildSyntaxHighlighter('go'),
  htmlBlock: buildSyntaxHighlighter('html'),
  xmlBlock: buildSyntaxHighlighter('xml'),
};

export function renderContent(content: string) {
  return Mustache.render(content, customMustacheTags);
}
