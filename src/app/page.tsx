import { Scaffold } from "@/components/scaffold";

const breadcrumbs: { label: string; href: string }[] = [];

export default function HomePage({ children }: { children: React.ReactNode }) {
  return (
    <Scaffold
      title="Home"
      subtitle="Welcome to the Agora Web application."
      breadcrumbs={breadcrumbs}
    >
      {children}
    </Scaffold>
  );
}
