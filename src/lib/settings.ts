import { getServerSiteSettings } from "./server-utils";
import { SiteSettingsType, FooterSettingsType, LogoSettingsType } from "@/interfaces";

// Type alias for SiteSettings
export type SiteSettings = SiteSettingsType;

export async function getSiteSettings(): Promise<SiteSettingsType> {
  // Use the server-side function that handles Prisma calls properly
  return getServerSiteSettings();
}

export async function getFooterSettings(): Promise<FooterSettingsType> {
  const settings = await getServerSiteSettings();
  return {
    siteName: settings.siteName,
    footerDescription: settings.footerDescription,
    footerBottomText: settings.footerBottomText,
    footerInstitutionalTitle: settings.footerInstitutionalTitle,
    
    // Social media fields
    socialFacebook: settings.socialFacebook,
    socialTwitter: settings.socialTwitter,
    socialInstagram: settings.socialInstagram,
    socialDiscord: settings.socialDiscord,
    socialYoutube: settings.socialYoutube,
    socialFacebookVisible: settings.socialFacebookVisible,
    socialTwitterVisible: settings.socialTwitterVisible,
    socialInstagramVisible: settings.socialInstagramVisible,
    socialDiscordVisible: settings.socialDiscordVisible,
    socialYoutubeVisible: settings.socialYoutubeVisible,
    
    // Contact information fields
    contactEmail: settings.contactEmail,
    contactPhone: settings.contactPhone,
    contactWhatsapp: settings.contactWhatsapp,
    contactAddress: settings.contactAddress,
  };
}

export async function getLogoSettings(): Promise<LogoSettingsType> {
  const settings = await getServerSiteSettings();
  return {
    logoWhiteText: settings.logoWhiteText,
    logoAccentText: settings.logoAccentText,
    logoWhiteColor: settings.logoWhiteColor,
    logoAccentColor: settings.logoAccentColor,
  };
} 