import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getSupabase } from "./supabase";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Get the current auth token from Supabase
async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const supabase = await getSupabase();
    const { data } = await supabase.auth.getSession();
    
    if (data?.session?.access_token) {
      return {
        "Authorization": `Bearer ${data.session.access_token}`
      };
    }
    
    return {};
  } catch (error) {
    console.error("Failed to get auth token:", error);
    return {};
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Get auth headers
  const authHeaders = await getAuthHeaders();
  
  // Prepare headers
  const headersObj: Record<string, string> = {};
  if (data) {
    headersObj["Content-Type"] = "application/json";
  }
  
  // Add auth headers
  Object.assign(headersObj, authHeaders);
  
  const res = await fetch(url, {
    method,
    headers: headersObj,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get auth headers
    const authHeaders = await getAuthHeaders();
    
    const res = await fetch(queryKey[0] as string, {
      headers: Object.keys(authHeaders).length > 0 ? authHeaders : undefined,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 30000, // Set to 30 seconds instead of Infinity
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
