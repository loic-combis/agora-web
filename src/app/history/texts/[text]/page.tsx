import { Scaffold } from "@/components/scaffold";
import { listTextHistory, type TextHistoryEntry } from "@/lib/github";

// Raw dump for now — every day this text changed (its version timeline), newest
// first. Each entry maps to that day's per-text diff. UI comes later.
export default async function TextHistoryPage({
  params,
}: {
  params: Promise<{ text: string }>;
}) {
  const { text } = await params;

  let history: TextHistoryEntry[] = [];
  let error: string | null = null;
  try {
    history = await listTextHistory(text);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const name = history[0]?.record.name ?? text;
  const breadcrumbs = [
    { label: "Historique", href: "/history" },
    { label: "Textes", href: "/history/texts" },
    { label: name, href: `/history/texts/${text}` },
  ];

  return (
    <Scaffold
      title={name}
      breadcrumbs={breadcrumbs}
      subtitle={`Historique du texte ${text} — ${history.length} jour(s) de changement.`}
    >
      <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
        {JSON.stringify(error ? { error } : { text, name, history }, null, 2)}
      </pre>
    </Scaffold>
  );
}
