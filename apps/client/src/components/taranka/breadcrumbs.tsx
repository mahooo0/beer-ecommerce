import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumbs" className="font-taranka-body text-sm text-[#9E9B90]">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="transition-colors hover:text-brand-red-500"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "text-ink-900" : ""}>{item.label}</span>
              )}
              {!isLast && (
                <ChevronRight className="size-3.5 text-[#B5B2A7]" strokeWidth={1.75} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
