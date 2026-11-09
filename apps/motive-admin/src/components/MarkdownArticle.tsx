import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ReactNode } from 'react';
import { slugify } from '../lib/util';

function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (node && typeof node === 'object' && 'props' in node) return textOf((node as { props: { children?: ReactNode } }).props.children);
  return '';
}

export default function MarkdownArticle({ content }: { content: string }) {
  return (
    <div className="article-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h2 id={slugify(textOf(children))}>{children}</h2>,
          h2: ({ children }) => <h2 id={slugify(textOf(children))}>{children}</h2>,
          h3: ({ children }) => <h3 id={slugify(textOf(children))}>{children}</h3>,
          p: ({ children, node }) => {
            const only = node?.children?.length === 1 && (node.children[0] as { tagName?: string }).tagName === 'img';
            return only ? <>{children}</> : <p>{children}</p>;
          },
          img: ({ src, alt }) => (
            <figure>
              <img src={src} alt={alt ?? ''} loading="lazy" />
              {alt && <figcaption>{alt}</figcaption>}
            </figure>
          ),
          a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer">{children}</a>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
