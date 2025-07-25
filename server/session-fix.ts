import session from "express-session";
import createMemoryStore from "memorystore";

/**
 * Creates a memory-based session store to avoid PostgreSQL connection issues
 * This prevents the "IDX_session_expire esiste già" error in all environments
 */
export function createSafeSessionStore(): session.Store {
  const MemoryStore = createMemoryStore(session);
  
  return new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  });
}