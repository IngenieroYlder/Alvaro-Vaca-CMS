export interface PaginaMeta {
  browserTitle?: string;
  browserDescription?: string;
  hero?: {
    badge?: string;
    title?: string;
    description?: string;
    ctaPrimary?: { text: string; url: string };
    ctaSecondary?: { text: string; url: string };
    image?: string;
    mobileImage?: string;
  };
  bio?: {
    title?: string;
    description?: string;
    image?: string;
    linkText?: string;
    linkUrl?: string;
  };
  propuestas?: Array<{
    title: string;
    description: string;
    icon: string;
    color: string;
  }>;
  [key: string]: any; // Allow other properties
}
