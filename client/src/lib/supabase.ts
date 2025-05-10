import { createClient, SupabaseClient } from '@supabase/supabase-js';

// We'll create a function to initialize Supabase later after fetching credentials
let _supabase: SupabaseClient | null = null;

// Create a promise that will be resolved once we have initialized Supabase
let initPromise: Promise<SupabaseClient> | null = null;

// Function to get the Supabase instance, initializing it if needed
export async function getSupabase(): Promise<SupabaseClient> {
  if (_supabase) return _supabase;
  
  if (!initPromise) {
    initPromise = initializeSupabase();
  }
  
  return initPromise;
}

// Function to initialize Supabase with credentials
async function initializeSupabase(): Promise<SupabaseClient> {
  try {
    // Fetch credentials from our server endpoint
    const response = await fetch('/api/supabase-credentials');
    const data = await response.json();
    const supabaseUrl = data.supabaseUrl || '';
    const supabaseAnonKey = data.supabaseAnonKey || '';
    
    console.log('Initializing Supabase client with:', { supabaseUrl });
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase credentials');
    }
    
    // Create the client
    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      db: {
        schema: 'public',
      },
    });
    
    return _supabase;
  } catch (error) {
    console.error('Failed to initialize Supabase:', error);
    throw error;
  }
}

// Initialize right away
initializeSupabase().catch(err => console.error('Failed to initialize Supabase on startup:', err));

// For backward compatibility - create a simpler interface to avoid type errors
// This is a simplified interface just to make typescript happy
export const supabase = {
  auth: {
    signUp: async (params: { email: string, password: string }) => {
      const client = await getSupabase();
      return client.auth.signUp(params);
    },
    signInWithPassword: async (params: { email: string, password: string }) => {
      const client = await getSupabase();
      return client.auth.signInWithPassword(params);
    },
    signOut: async () => {
      const client = await getSupabase();
      return client.auth.signOut();
    },
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      // This is a special case because it returns a subscription
      let unsubscribeFn = () => {};
      
      // We need to make sure Supabase is initialized first
      getSupabase().then(client => {
        const { data } = client.auth.onAuthStateChange(callback);
        if (data && data.subscription && data.subscription.unsubscribe) {
          unsubscribeFn = data.subscription.unsubscribe;
        }
      });
      
      // Return a dummy subscription object with the unsubscribe function
      // that will be replaced once Supabase is initialized
      return { 
        data: { 
          subscription: { 
            unsubscribe: () => unsubscribeFn() 
          } 
        } 
      };
    },
    getUser: async () => {
      const client = await getSupabase();
      return client.auth.getUser();
    }
  },
  from: (table: string) => ({
    select: async (query: string) => {
      const client = await getSupabase();
      return client.from(table).select(query);
    },
    insert: async (data: any) => {
      const client = await getSupabase();
      return client.from(table).insert(data);
    },
    update: async (data: any) => {
      const client = await getSupabase();
      return client.from(table).update(data);
    },
    delete: async () => {
      const client = await getSupabase();
      return client.from(table).delete();
    }
  })
};

export default supabase;
