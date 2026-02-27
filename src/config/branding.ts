import { defaults } from "./defaults";

export interface BrandingConfig {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  primaryColor: string;
  primaryLight: string;
  primaryDark: string;
  footerText: string;
  privacyNotice: string;
  ogImage: string;
}

export function getBranding(): BrandingConfig {
  return {
    siteName: process.env.NEXT_PUBLIC_SITE_NAME || defaults.siteName,
    siteDescription:
      process.env.NEXT_PUBLIC_SITE_DESCRIPTION || defaults.siteDescription,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || defaults.siteUrl,
    primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR || defaults.primaryColor,
    primaryLight:
      process.env.NEXT_PUBLIC_PRIMARY_LIGHT || defaults.primaryLight,
    primaryDark: process.env.NEXT_PUBLIC_PRIMARY_DARK || defaults.primaryDark,
    footerText: process.env.NEXT_PUBLIC_FOOTER_TEXT || defaults.footerText,
    privacyNotice:
      process.env.NEXT_PUBLIC_PRIVACY_NOTICE || defaults.privacyNotice,
    ogImage: process.env.NEXT_PUBLIC_OG_IMAGE || defaults.ogImage,
  };
}
