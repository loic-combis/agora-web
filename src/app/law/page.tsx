import { Scaffold } from "@/components/scaffold";

const breadcrumbs = [{ label: "Loi", href: "/law" }];

export default function LawPage({ children }: { children: React.ReactNode }) {
  return (
    <Scaffold
      title="Loi"
      subtitle="Loi Française applicable."
      breadcrumbs={breadcrumbs}
    >
      {children}
    </Scaffold>
  );
}
