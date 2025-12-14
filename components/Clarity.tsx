"use client";

import { useEffect } from "react";
import clarity from "@microsoft/clarity";

declare global {
  interface WindowEventMap {
    analyticsConsentGranted: CustomEvent<{ cookieType: string }>;
    analyticsConsentRejected: CustomEvent<{ cookieType: string }>;
  }
}

/**
 * Constants
 */
const PROJECT_ID_ENV_VAR = "NEXT_PUBLIC_CLARITY_PROJECT_ID";

/**
 * Clarity project ID validation regex
 * Clarity project IDs are alphanumeric strings, typically 6-20 characters
 * This prevents injection attacks and ensures valid format
 */
const CLARITY_PROJECT_ID_PATTERN = /^[a-zA-Z0-9]{6,20}$/;

/**
 * Consent configuration for GDPR compliance
 */
const CONSENT_CONFIG = {
  ad_Storage: "denied" as const, // Clarity doesn't use ad storage, but we deny for privacy
  analytics_Storage: "granted" as const, // Required for Clarity analytics
} as const;

/**
 * Global initialization guard to prevent multiple initializations
 * This ensures Clarity only initializes once, even if component re-renders
 */
let isInitialized = false;

const COOKIE_CONSENT_PREFIX = "silktideCookieChoice_";
const ANALYTICS_COOKIE_ID = "analytics";

function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return false;
  }

  const consentKey = `${COOKIE_CONSENT_PREFIX}${ANALYTICS_COOKIE_ID}`;
  return localStorage.getItem(consentKey) === "true";
}

/**
 * Validates a Clarity project ID format
 * 
 * Security: Prevents XSS/injection attacks by ensuring only valid alphanumeric IDs
 * 
 * @param id - The project ID to validate
 * @returns true if the ID matches Clarity's expected format
 */
function isValidClarityProjectId(id: string): boolean {
  if (!id || typeof id !== "string") {
    return false;
  }
  
  const trimmed = id.trim();
  return trimmed.length > 0 && CLARITY_PROJECT_ID_PATTERN.test(trimmed);
}

/**
 * Checks if the browser's Do Not Track (DNT) setting is enabled
 * 
 * Privacy: Respects user privacy preferences as specified in the DNT specification
 * Handles all valid DNT values: "1", "yes", "YES"
 * 
 * @returns true if DNT is enabled, false otherwise
 */
function shouldRespectDNT(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  const dnt = navigator.doNotTrack;
  
  // Handle all valid DNT string values according to specification
  // navigator.doNotTrack returns string | null, so we only check string values
  if (dnt === null || dnt === undefined) {
    return false;
  }
  
  const dntLower = String(dnt).toLowerCase();
  return dntLower === "1" || dntLower === "yes";
}

/**
 * Safely gets and validates the Clarity project ID from environment variables
 * 
 * Security: 
 * - Requires project ID to be set via environment variable (not hardcoded)
 * - Validates and sanitizes the project ID before use
 * - Prevents exposure of project IDs in public repositories
 * 
 * @returns Validated project ID or null if invalid/missing
 */
function getValidatedProjectId(): string | null {
  const envProjectId = process.env[PROJECT_ID_ENV_VAR];
  
  // Security: Require environment variable - no hardcoded fallback
  if (!envProjectId) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[Clarity] Project ID not found. Please set ${PROJECT_ID_ENV_VAR} in your environment variables.`
      );
    }
    return null;
  }
  
  // Sanitize: trim whitespace
  const sanitized = envProjectId.trim();
  
  // Validate format
  if (!isValidClarityProjectId(sanitized)) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Clarity] Invalid project ID format:",
        sanitized.length > 0 ? sanitized.substring(0, 10) + "..." : "empty"
      );
    }
    return null;
  }
  
  return sanitized;
}

function initializeClarity(): void {
  if (isInitialized) {
    return;
  }

  if (typeof window === "undefined") {
    return;
  }

  if (shouldRespectDNT()) {
    return;
  }

  if (!hasAnalyticsConsent()) {
    return;
  }

  const projectId = getValidatedProjectId();
  if (!projectId) {
    return;
  }

  try {
    clarity.init(projectId);
    clarity.consentV2(CONSENT_CONFIG);
    isInitialized = true;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[Clarity] Initialization failed:", error);
    }
  }
}

/**
 * Microsoft Clarity Analytics Component
 * 
 * Only initializes after user accepts analytics cookies via cookie banner (GDPR compliant).
 * Requires NEXT_PUBLIC_CLARITY_PROJECT_ID environment variable.
 */
export function Clarity() {
  useEffect(() => {
    initializeClarity();

    const handleConsentGranted = () => {
      if (!isInitialized) {
        initializeClarity();
      }
    };

    window.addEventListener("analyticsConsentGranted", handleConsentGranted);

    const handleStorageChange = (e: StorageEvent) => {
      const consentKey = `${COOKIE_CONSENT_PREFIX}${ANALYTICS_COOKIE_ID}`;
      if (e.key === consentKey && e.newValue === "true") {
        initializeClarity();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    const checkConsentInterval = setInterval(() => {
      if (!isInitialized && hasAnalyticsConsent()) {
        initializeClarity();
        clearInterval(checkConsentInterval);
      }
    }, 500);

    return () => {
      window.removeEventListener("analyticsConsentGranted", handleConsentGranted);
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(checkConsentInterval);
    };
  }, []);

  return null;
}
