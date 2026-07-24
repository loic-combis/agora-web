import { Scaffold } from "@/components/scaffold";
import { getDay } from "@/lib/github";

// Raw dump for now — the day's diff scoped to one text: its parsed `Text:` record
// plus the patches of every file under `<nature>/<LEGITEXT>/…`. UI comes later.
export default async function CompareDateTextPage({
  params,
}: {
  params: Promise<{ date: string; text: string }>;
}) {
  const { date, text } = await params;

  let data: unknown;
  try {
    const day = await getDay(date);
    // Paths are `<nature>/<LEGITEXT>/<LEGISCTA>/…/<CID>.md` — the text id is segment 1.
    const files = day.files.filter((f) => f.filename.split("/")[1] === text);
    const record =
      day.changeset.records.find((r) => r.legitext === text) ?? null;
    data = {
      date,
      text,
      record,
      files,
      // getDay returns only the first page (≤100 files); flag when the day is larger.
      truncated: day.truncated,
      totalFilesInDay: day.totalFiles,
    };
  } catch (e) {
    data = { error: e instanceof Error ? e.message : String(e) };
  }

  const breadcrumbs = [
    { label: "Comparaison", href: "/compare" },
    { label: date, href: `/compare/${date}` },
    { label: text, href: `/compare/${date}/${text}` },
  ];

  return (
    <Scaffold
      title={`${text} — ${date}`}
      breadcrumbs={breadcrumbs}
      subtitle={`Diff du ${date} pour le texte ${text}.`}
    >
      <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
        {JSON.stringify(data, null, 2)}
      </pre>
    </Scaffold>
  );
}
