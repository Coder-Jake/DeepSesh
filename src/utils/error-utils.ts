import { FunctionsHttpError } from '@supabase/supabase-js';

/**
 * Extracts a detailed error message from a Supabase FunctionsHttpError.
 * If the error is a FunctionsHttpError and contains a JSON response body with an 'error' field,
 * it returns that specific error message. Otherwise, it returns the generic error message.
 * @param error The error object caught from a Supabase Edge Function invocation.
 * @returns A promise that resolves to a more descriptive error message string.
 */
export async function getEdgeFunctionErrorMessage(error: any): Promise<string> {
  if (error instanceof FunctionsHttpError && error.context?.response) {
    try {
      // Clone the response because it can only be read once
      const clonedResponse = error.context.response.clone();
      const errorBody = await clonedResponse.json();
      return errorBody.error || `Edge Function Error: ${error.context.response.status} - ${error.message}`;
    } catch (parseError) {
      const clonedResponseText = await error.context.response.clone().text();
      console.error("Failed to parse Edge Function error response as JSON. Raw text:", clonedResponseText, "Parse error:", parseError);
      return `Edge Function Error: ${error.context.response.status} - ${clonedResponseText || error.message}`;
    }
  }
  return error.message || String(error);
}