import { Scaffold } from "@/components/scaffold";
import { personDisplayName } from "@/lib/github";

export default async function PersonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const name = await personDisplayName(slug);

  const breadcrumbs = [
    { label: "Figures Publiques", href: "/persons" },
    { label: name, href: `/persons/${slug}` },
  ];

  return (
    <Scaffold title={name} breadcrumbs={breadcrumbs}>
      <></>
    </Scaffold>
  );
}
