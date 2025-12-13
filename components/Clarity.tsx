"use client";

import { useEffect } from "react";
import clarity from "@microsoft/clarity";

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

/**
 * Initializes Microsoft Clarity with security and privacy safeguards
 * 
 * Security features:
 * - Input validation prevents XSS/injection attacks
 * - Initialization guard prevents duplicate initialization
 * - Enhanced DNT support respects user privacy
 * - Graceful error handling prevents app crashes
 * 
 * Privacy features:
 * - Respects Do Not Track headers
 * - Uses GDPR-compliant consent API (consentV2)
 * - Only loads on client-side
 */
function initializeClarity(): void {
  // Guard: Prevent multiple initializations
  if (isInitialized) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Clarity] Already initialized, skipping");
    }
    return;
  }

  // Guard: Only run on client-side
  if (typeof window === "undefined") {
    return;
  }

  // Privacy: Respect Do Not Track
  if (shouldRespectDNT()) {
    if (process.env.NODE_ENV === "development") {
      console.info("[Clarity] Do Not Track enabled, skipping initialization");
    }
    return;
  }

  // Security: Validate project ID
  const projectId = getValidatedProjectId();
  if (!projectId) {
    return;
  }

  try {
    // Initialize Clarity
    clarity.init(projectId);

    // Set GDPR-compliant consent
    // Note: For stricter compliance, wait for user consent before calling this
    clarity.consentV2(CONSENT_CONFIG);

    // Mark as initialized after successful setup
    isInitialized = true;

    if (process.env.NODE_ENV === "development") {
      console.info("[Clarity] Initialized successfully");
    }
  } catch (error) {
    // Graceful degradation: Don't break the app if Clarity fails
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (process.env.NODE_ENV === "development") {
      console.error("[Clarity] Initialization failed:", {
        error: errorMessage,
        projectId: projectId.substring(0, 5) + "...", // Log partial ID for debugging
        environment: process.env.NODE_ENV,
      });
    }
    
    // In production, fail silently to prevent user-facing errors
  }
}

/**
 * Microsoft Clarity Analytics Component
 * 
 * Privacy-compliant implementation that:
 * - Respects Do Not Track (DNT) headers (enhanced detection)
 * - Uses GDPR-compliant consent API (consentV2)
 * - Only loads on client-side
 * - Validates and sanitizes project ID input
 * - Prevents duplicate initialization
 * - Handles errors gracefully
 * 
 * Security features:
 * - Input validation prevents XSS/injection attacks
 * - Initialization guards prevent race conditions
 * - Defense in depth with multiple validation layers
 * - Requires project ID via environment variable (not hardcoded)
 * 
 * Configuration:
 * - Set NEXT_PUBLIC_CLARITY_PROJECT_ID in your environment variables
 * - Never commit project IDs to version control
 * 
 * For GDPR compliance, you may want to:
 * - Show a cookie consent banner
 * - Call clarity.consentV2() based on user preferences
 * - Only initialize after user consent (if required by your jurisdiction)
 */
export function Clarity() {
  useEffect(() => {
    initializeClarity();

    // Cleanup function (though Clarity doesn't provide a cleanup method)
    // The effect dependency array ensures this only runs once per mount
    return () => {
      // Clarity doesn't expose a cleanup method
      // The isInitialized guard prevents re-initialization on re-renders
    };
  }, []);

  // This component doesn't render anything
  return null;
}
