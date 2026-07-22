import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { Home01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Fragment } from "react/jsx-runtime";

export interface ScaffoldBreadcrumb {
  label: string;
  href: string;
}

export function Scaffold({
  children,
  breadcrumbs,
  title,
  subtitle,
}: Readonly<{
  children: React.ReactNode;
  breadcrumbs?: ScaffoldBreadcrumb[];
  title?: string;
  subtitle?: string;
}>) {
  return (
    <div className="min-h-dvh w-full mx-auto max-w-5xl p-4 md:p-8 lg:p-12 flex flex-col gap-8">
      {(breadcrumbs || title || subtitle) && (
        <div className="w-full flex flex-col gap-1 mt-8">
          {breadcrumbs && (
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">
                    <HugeiconsIcon
                      icon={Home01Icon}
                      size={16}
                      strokeWidth={1.5}
                      aria-hidden
                    />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                {breadcrumbs.map(({ label, href }, i) => {
                  const isLast = i === breadcrumbs.length - 1;

                  return (
                    <Fragment key={href}>
                      <BreadcrumbItem key={href}>
                        <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                      </BreadcrumbItem>
                      {!isLast && <BreadcrumbSeparator />}
                    </Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          )}
          {title && <h1 className="text-3xl">{title}</h1>}
          {subtitle && (
            <div className="text-xs text-muted-foreground">{subtitle}</div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
