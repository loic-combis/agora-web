import { Scaffold } from "@/components/scaffold";
import { getDay } from "@/lib/github";

// Raw dump for now — the whole day's diff (commit vs its parent). UI comes later.
export default async function CompareDatePage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;

  let data: unknown;
  try {
    data = await getDay(date);
  } catch (e) {
    data = { error: e instanceof Error ? e.message : String(e) };
  }

  const breadcrumbs = [
    { label: "Comparaison", href: "/compare" },
    { label: date, href: `/compare/${date}` },
  ];

  return (
    <Scaffold
      title={date}
      breadcrumbs={breadcrumbs}
      subtitle={`Diff du ${date} (tous les textes).`}
    >
      <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
        {JSON.stringify(data, null, 2)}
      </pre>
    </Scaffold>
  );
}
