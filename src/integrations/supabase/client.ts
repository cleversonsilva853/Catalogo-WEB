// Arquivo falso para satisfazer o Vite durante o build
// Até que todas as chamadas `supabase.from` sejam removidas

class SupabaseQueryBuilder {
  select() { return this; }
  eq() { return this; }
  gte() { return this; }
  lte() { return this; }
  in() { return this; }
  or() { return this; }
  limit() { return this; }
  single() { return Promise.resolve({ data: null, error: null }); }
  maybeSingle() { return Promise.resolve({ data: null, error: null }); }
  then(res: any) { res({ data: [], error: null }); }
  insert() { return Promise.resolve({ error: null }); }
  update() { return this; }
  delete() { return this; }
  neq() { return this; }
  order() { return this; }
}

export const supabase = {
  from: (table: string) => new SupabaseQueryBuilder(),
  channel: () => ({
    on: () => ({ subscribe: () => {} }),
  }),
  removeChannel: () => {},
  auth: {
    signInWithPassword: () => Promise.resolve({ error: null }),
    signUp: () => Promise.resolve({ error: null }),
    resetPasswordForEmail: () => Promise.resolve({ error: null }),
    signOut: () => Promise.resolve({ error: null }),
    getSession: () => Promise.resolve({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  storage: {
    from: () => ({
      upload: () => Promise.resolve({ error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    }),
  },
};
