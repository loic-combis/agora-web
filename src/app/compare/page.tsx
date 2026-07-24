import { Scaffold } from "@/components/scaffold";

const breadcrumbs = [{ label: "Comparaison", href: "/compare" }];

export default function ComparePage({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Scaffold
      title="Comparaison"
      breadcrumbs={breadcrumbs}
      subtitle="Compare les textes de loi et leurs évolutions dans le temps."
    >
      {children}
    </Scaffold>
  );
}
