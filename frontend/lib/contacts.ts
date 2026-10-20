// Author of the project, shown in the footer, on /about and in the structured data.
export const DEVELOPER = {
  name: "Giuseppe Pio Ruocco",
  links: [
    { key: "github", label: "GitHub", url: "https://github.com/JosephPshine63" },
    { key: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/in/giuseppe-pio-ruocco-7b4367267/" },
    { key: "email", label: "Email", url: "mailto:dev.pioruocco@gmail.com" },
    { key: "portfolio", label: "Portfolio", url: "https://gprdev.com/" },
  ],
} as const;

export type DeveloperLink = (typeof DEVELOPER.links)[number];

export const PORTFOLIO_URL = DEVELOPER.links.find((link) => link.key === "portfolio")!.url;

/** Public profiles: everything except the email. */
export const PROFILE_LINKS = DEVELOPER.links.filter((link) => link.key !== "email");
