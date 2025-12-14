"use client";

import { useEffect } from "react";

/**
 * Global initialization guard to prevent multiple initializations
 */
let isInitialized = false;

/**
 * Type definitions for the Silktide Cookie Banner Manager
 */
declare global {
  interface Window {
    silktideCookieBannerManager?: {
      updateCookieBannerConfig: (config: CookieBannerConfig) => void;
    };
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, string>
    ) => void;
    dataLayer?: Array<Record<string, unknown>>;
  }
}

interface CookieBannerConfig {
  background: {
    showBackground: boolean;
  };
  cookieIcon: {
    position: string;
  };
  cookieTypes: Array<{
    id: string;
    name: string;
    description: string;
    required: boolean;
    onAccept?: () => void;
    onReject?: () => void;
  }>;
  text: {
    banner: {
      description: string;
      acceptAllButtonText: string;
      acceptAllButtonAccessibleLabel: string;
      rejectNonEssentialButtonText: string;
      rejectNonEssentialButtonAccessibleLabel: string;
      preferencesButtonText: string;
      preferencesButtonAccessibleLabel: string;
    };
    preferences: {
      title: string;
      description: string;
      creditLinkText: string;
      creditLinkAccessibleLabel: string;
    };
  };
}

/**
 * Safely calls gtag if it's available
 */
function safeGtag(
  command: string,
  targetId: string,
  config?: Record<string, string>
): void {
  if (typeof window !== "undefined" && window.gtag) {
    try {
      window.gtag(command, targetId, config);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[CookieBanner] gtag call failed:", error);
      }
    }
  }
}

/**
 * Safely pushes to dataLayer if it's available
 */
function safeDataLayerPush(data: Record<string, unknown>): void {
  if (typeof window !== "undefined" && window.dataLayer) {
    try {
      window.dataLayer.push(data);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[CookieBanner] dataLayer push failed:", error);
      }
    }
  }
}

/**
 * Initializes the Silktide Cookie Banner
 */
function initializeCookieBanner(): void {
  // Guard: Prevent multiple initializations
  if (isInitialized) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[CookieBanner] Already initialized, skipping");
    }
    return;
  }

  // Guard: Only run on client-side
  if (typeof window === "undefined") {
    return;
  }

  // Check if the script has loaded
  if (!window.silktideCookieBannerManager) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[CookieBanner] silktideCookieBannerManager not available yet"
      );
    }
    return;
  }

  try {
    // Configure the cookie banner
    window.silktideCookieBannerManager.updateCookieBannerConfig({
      background: {
        showBackground: false,
      },
      cookieIcon: {
        position: "bottomRight",
      },
      cookieTypes: [
        {
          id: "necessary",
          name: "Necessary",
          description:
            "<p>These cookies are necessary for the website to function properly and cannot be switched off. They help with things like logging in and setting your privacy preferences.</p>",
          required: true,
          onAccept: function () {
            console.log("Add logic for the required Necessary here");
          },
        },
        {
          id: "analytics",
          name: "Analytics",
          description:
            "<p>These cookies help us improve the site by tracking which pages are most popular and how visitors move around the site.</p>",
          required: false,
          onAccept: function () {
            if (typeof window !== "undefined" && window.gtag) {
              window.gtag("consent", "update", {
                analytics_storage: "granted",
              });
            }
            if (typeof window !== "undefined" && window.dataLayer) {
              window.dataLayer.push({
                event: "consent_accepted_analytics",
              });
            }
          },
          onReject: function () {
            if (typeof window !== "undefined" && window.gtag) {
              window.gtag("consent", "update", {
                analytics_storage: "denied",
              });
            }
          },
        },
      ],
      text: {
        banner: {
          description:
            '<p>We use cookies on our site to enhance your user experience, provide personalized content, and analyze our traffic. <a href="/cookie-policy" target="_blank">Cookie Policy.</a></p>',
          acceptAllButtonText: "Accept all",
          acceptAllButtonAccessibleLabel: "Accept all cookies",
          rejectNonEssentialButtonText: "Reject non-essential",
          rejectNonEssentialButtonAccessibleLabel: "Reject non-essential",
          preferencesButtonText: "Preferences",
          preferencesButtonAccessibleLabel: "Toggle preferences",
        },
        preferences: {
          title: "Customize your cookie preferences",
          description:
            "<p>We respect your right to privacy. You can choose not to allow some types of cookies. Your cookie preferences will apply across our website.</p>",
          creditLinkText: "Get this banner for free",
          creditLinkAccessibleLabel: "Get this banner for free",
        },
      },
    });

    // Mark as initialized after successful setup
    isInitialized = true;

    if (process.env.NODE_ENV === "development") {
      console.info("[CookieBanner] Initialized successfully");
    }
  } catch (error) {
    // Graceful degradation: Don't break the app if cookie banner fails
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    if (process.env.NODE_ENV === "development") {
      console.error("[CookieBanner] Initialization failed:", {
        error: errorMessage,
        environment: process.env.NODE_ENV,
      });
    }
  }
}

/**
 * Silktide Cookie Banner Component
 *
 * Privacy-compliant cookie consent banner implementation that:
 * - Loads the Silktide consent manager script and styles
 * - Configures cookie types (Necessary and Analytics)
 * - Integrates with Google Analytics consent API (if available)
 * - Only loads on client-side
 * - Handles errors gracefully
 *
 * The component loads the external script and CSS, then initializes
 * the cookie banner configuration once the script is available.
 */
export function CookieBanner() {
  useEffect(() => {
    // Only run on client-side
    if (typeof window === "undefined") {
      return;
    }

    // Load CSS
    const cssLink = document.createElement("link");
    cssLink.rel = "stylesheet";
    cssLink.id = "silktide-consent-manager-css";
    cssLink.href = "/cookie-banner/silktide-consent-manager.css";
    document.head.appendChild(cssLink);

    // Load and initialize script
    const script = document.createElement("script");
    script.src = "/cookie-banner/silktide-consent-manager.js";
    script.async = true;

    script.onload = () => {
      // Wait a bit for the script to fully initialize
      setTimeout(() => {
        initializeCookieBanner();
      }, 100);
    };

    script.onerror = () => {
      if (process.env.NODE_ENV === "development") {
        console.error(
          "[CookieBanner] Failed to load silktide-consent-manager.js"
        );
      }
    };

    document.body.appendChild(script);

    // Cleanup function
    return () => {
      // Remove script and CSS on unmount
      const existingScript = document.querySelector(
        'script[src="/cookie-banner/silktide-consent-manager.js"]'
      );
      if (existingScript) {
        existingScript.remove();
      }

      const existingCss = document.getElementById(
        "silktide-consent-manager-css"
      );
      if (existingCss) {
        existingCss.remove();
      }
    };
  }, []);

  // This component doesn't render anything
  return null;
}
