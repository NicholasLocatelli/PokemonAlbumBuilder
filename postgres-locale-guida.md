# Come usare PostgreSQL nel tuo ambiente locale

## Configurazione raccomandata (PostgreSQL per dati + memoria per sessioni)

Nel tuo file `.env` locale:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/pokemon_db
USE_MEMORY_SESSIONS=true
```

Questo ti darà:
- ✅ PostgreSQL per tutti i dati (utenti, album, carte)
- ✅ Memoria per le sessioni (evita errori di inizializzazione)
- ✅ Persistenza completa dei dati
- ✅ Nessun errore "IDX_session_expire esiste già"

## Se vuoi PostgreSQL anche per le sessioni

1. **Rimuovi la tabella sessioni esistente** (una volta sola):
```sql
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP INDEX IF EXISTS "IDX_session_expire";
```

2. **Nel file `.env` locale**:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/pokemon_db
# Non aggiungere USE_MEMORY_SESSIONS
```

## Verifica che PostgreSQL locale sia attivo

```bash
# Su Windows con PostgreSQL installato
pg_ctl status

# Oppure testa la connessione
psql -h localhost -U username -d pokemon_db
```

## Solo per sviluppo/test (tutto in memoria)

```env
# DATABASE_URL=postgresql://... (commentato)
```

L'app userà solo memoria per tutto (dati e sessioni).