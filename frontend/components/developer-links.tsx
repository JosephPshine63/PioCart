import { Globe, Mail } from "lucide-react";
import { GitHubIcon, LinkedInIcon } from "@/components/brand-icons";
import { DEVELOPER, type DeveloperLink } from "@/lib/contacts";
import { cn } from "@/lib/utils";

const ICONS: Record<DeveloperLink["key"], React.ComponentType<{ className?: string }>> = {
  github: GitHubIcon,
  linkedin: LinkedInIcon,
  email: Mail,
  portfolio: Globe,
};

/** The author's contacts; profiles carry rel="me" so they are linked to the same person. */
export function DeveloperLinks({ showLabels = false, className }: { showLabels?: boolean; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-1", className)}>
      {DEVELOPER.links.map((link) => {
        const Icon = ICONS[link.key];
        const external = link.key !== "email";
        return (
          <li key={link.key}>
            <a
              href={link.url}
              aria-label={showLabels ? undefined : link.label}
              title={showLabels ? undefined : link.label}
              {...(external ? { target: "_blank", rel: "me noopener" } : {})}
              className={cn(
                "inline-flex items-center gap-2 rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                showLabels ? "h-9 border px-3 text-sm" : "size-9 justify-center",
              )}
            >
              <Icon className="size-4" />
              {showLabels && link.label}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
