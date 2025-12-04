"use server";

import { getAccessToken } from "@/lib/auth-helper";

/**
 * Example: Call your NestJS backend with the Keycloak access token
 * 
 * Your NestJS backend should validate the token with Keycloak:
 * - NestJS configuration: @nestjs/passport + passport-jwt
 * - JWT strategy that verifies the token against Keycloak
 */

interface BackendResponse {
  data: any;
  error?: string;
}

/**
 * Generic function to call your NestJS backend
 */
export async function callNestJSBackend(
  endpoint: string,
  options?: RequestInit
): Promise<BackendResponse> {
  try {
    // Get the Keycloak access token
    const accessToken = await getAccessToken();

    if (!accessToken) {
      return {
        data: null,
        error: "No access token available. Please login first.",
      };
    }

    // Call your NestJS backend with the token in the Authorization header
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options?.headers,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend API error (${response.status}):`, errorText);
      return {
        data: null,
        error: `API Error: ${response.status} - ${errorText}`,
      };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error("Error calling backend:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Example: Get user profile from your NestJS backend
 */
export async function getUserProfile() {
  return callNestJSBackend("/api/users/profile");
}

/**
 * Example: Create a resource in your NestJS backend
 */
export async function createResource(data: any) {
  return callNestJSBackend("/api/resources", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Example: Upload a file to your NestJS backend
 */
export async function uploadFile(file: File) {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return { data: null, error: "Not authenticated" };
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/files/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        // Do NOT set Content-Type for multipart/form-data - the browser does it automatically
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error("File upload error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}
