import { Scaffold } from "@/components/scaffold";

const breadcrumbs = [{ label: "Historique", href: "/history" }];

// Index placeholder: a text's history is reached per-id at /history/texts/:text
// (from the "Historique du texte" link on each card in the feed). There is no
// cheap "list every text" source, so this landing stays intentionally empty.
export default function TextsIndexPage() {
  return (
    <Scaffold
      title="Historique des textes"
      breadcrumbs={breadcrumbs}
      subtitle="Choisis un texte depuis l'historique pour voir toutes ses versions."
    >
      <></>
    </Scaffold>
  );
}
