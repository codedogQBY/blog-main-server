export interface SiteConfig {
  title: string;
  subtitle: string;
  description: string;
  icpNumber: string;
  wechatQrcode: string;
  startTime: string;
  englishTitle: string;
  heroTitle: {
    first: string;
    second: string;
  };
  socialLinks: {
    github?: string;
    email?: string;
  };
  seoDefaults: {
    title: string;
    description: string;
    keywords: string[];
  };
} 