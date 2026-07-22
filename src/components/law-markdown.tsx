import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Render law Markdown body text with modest, dependency-free styling. */
export function LawMarkdown({ children }: { children: string }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed [&_strong]:font-semibold">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ ...props }) => (
            <a
              {...props}
              className="text-primary underline underline-offset-2"
              target="_blank"
              rel="noreferrer"
            />
          ),
          ul: ({ ...props }) => <ul {...props} className="ml-5 list-disc space-y-1" />,
          ol: ({ ...props }) => <ol {...props} className="ml-5 list-decimal space-y-1" />,
          blockquote: ({ ...props }) => (
            <blockquote
              {...props}
              className="border-l-2 pl-3 text-muted-foreground italic"
            />
          ),
          table: ({ ...props }) => (
            <div className="overflow-x-auto">
              <table {...props} className="w-full border-collapse text-xs" />
            </div>
          ),
          th: ({ ...props }) => <th {...props} className="border px-2 py-1 text-left" />,
          td: ({ ...props }) => <td {...props} className="border px-2 py-1 align-top" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
