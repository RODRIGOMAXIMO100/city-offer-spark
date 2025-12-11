import { useState, useEffect } from 'react';
import { List, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [items, setItems] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Extract headings from HTML content
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headings = doc.querySelectorAll('h2, h3');
    
    const tocItems: TOCItem[] = [];
    headings.forEach((heading, index) => {
      const id = `heading-${index}`;
      const text = heading.textContent || '';
      const level = parseInt(heading.tagName.charAt(1));
      tocItems.push({ id, text, level });
    });
    
    setItems(tocItems);
  }, [content]);

  useEffect(() => {
    // Add IDs to actual headings in the DOM
    const articleContent = document.querySelector('.blog-content');
    if (!articleContent) return;

    const headings = articleContent.querySelectorAll('h2, h3');
    headings.forEach((heading, index) => {
      heading.id = `heading-${index}`;
    });

    // Observer for active section
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -80% 0px' }
    );

    headings.forEach((heading) => observer.observe(heading));

    return () => observer.disconnect();
  }, [items]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  if (items.length < 2) return null;

  return (
    <nav className="bg-card border border-border rounded-xl p-4 sticky top-24">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between w-full text-sm font-semibold text-foreground mb-3"
      >
        <span className="flex items-center gap-2">
          <List className="h-4 w-4 text-primary" />
          Índice
        </span>
        <ChevronUp className={cn(
          "h-4 w-4 transition-transform",
          isCollapsed && "rotate-180"
        )} />
      </button>
      
      {!isCollapsed && (
        <ul className="space-y-1">
          {items.map((item) => (
            <li
              key={item.id}
              className={cn(
                "transition-all duration-200",
                item.level === 3 && "ml-3"
              )}
            >
              <button
                onClick={() => scrollToHeading(item.id)}
                className={cn(
                  "text-left text-sm py-1.5 px-2 rounded-md w-full truncate transition-all",
                  "hover:bg-muted hover:text-foreground",
                  activeId === item.id
                    ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                    : "text-muted-foreground"
                )}
              >
                {item.text}
              </button>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
