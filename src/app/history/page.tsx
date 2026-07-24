import { Scaffold } from "@/components/scaffold";
import { listTags } from "@/lib/github";
import { HistoryPage as HistoryPageData } from "@/lib/types";
import HistoryFeed from "./history-feed";

async function loadHistory(): Promise<HistoryPageData> {
  try {
    return await listTags(10);
  } catch {
    // Token-resilient: render an empty state rather than failing the build.
    return { entries: [], nextCursor: null };
  }
}

const breadcrumbs = [{ label: "Historique", href: "/history" }];

export default async function HistoryPage() {
  const { entries, nextCursor } = await loadHistory();
  return (
    <Scaffold
      title="Historique des lois"
      breadcrumbs={breadcrumbs}
      subtitle="Evolution des textes et articles de loi dans le temps."
    >
      <HistoryFeed initialEntries={entries} initialCursor={nextCursor} />
    </Scaffold>
  );
}
