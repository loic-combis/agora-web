import { Scaffold } from "@/components/scaffold";

const breadcrumbs = [{ label: "Figures Publiques", href: "/persons" }];

export default function PersonsPage({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Scaffold title="Figures Publiques" breadcrumbs={breadcrumbs}>
      {children}
    </Scaffold>
  );
}
