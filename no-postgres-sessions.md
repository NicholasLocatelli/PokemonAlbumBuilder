# Configurazione per ambiente locale senza errori PostgreSQL

Per evitare l'errore "IDX_session_expire esiste già" nel tuo ambiente locale Windows:

## Nel file `.env` locale:

```env
# Commenta o rimuovi DATABASE_URL per usare solo memoria
# DATABASE_URL=postgresql://...

# Mantieni le altre configurazioni
POKEMON_TCG_API_KEY=your-key-here
SENDGRID_API_KEY=your-key-here
SESSION_SECRET=your-secret-here
```

## Alternativa con PostgreSQL locale:

Se vuoi usare PostgreSQL locale, assicurati di:

1. Eliminare la tabella delle sessioni esistente:
```sql
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP INDEX IF EXISTS "IDX_session_expire";
```

2. Riavviare l'applicazione

## Configurazione attuale:
- Su Replit: PostgreSQL per dati + memoria per sessioni
- In locale: Solo memoria (se DATABASE_URL è commentato)