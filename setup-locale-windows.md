# Configurazione Database Locale Windows

## Problema attuale
Nel tuo database PostgreSQL locale manca la colonna `email` nella tabella `users`, causando l'errore 500 durante la registrazione.

## Soluzione rapida

### 1. Esegui lo script SQL di aggiornamento
Nel tuo client PostgreSQL (pgAdmin, psql, o altro):

```bash
# Connettiti al database
psql -h localhost -U tuo_username -d pokemon_db

# Esegui lo script
\i fix-database-locale.sql
```

Oppure copia e incolla il contenuto del file `fix-database-locale.sql` nel tuo client PostgreSQL.

### 2. Configurazione .env locale
Nel tuo file `.env` locale:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/pokemon_db
USE_MEMORY_SESSIONS=true
POKEMON_TCG_API_KEY=your-key-here
SENDGRID_API_KEY=your-key-here  
SESSION_SECRET=your-secret-here
```

### 3. Riavvia il server
Dopo aver aggiornato il database, riavvia il server locale.

## Verifica
Testa la registrazione di un nuovo utente. Dovrebbe funzionare senza errori 500.

## Alternative se continui ad avere problemi

### Opzione A: Reset completo database
Se vuoi ripartire da zero:
```sql
DROP DATABASE IF EXISTS pokemon_db;
CREATE DATABASE pokemon_db;
```
Poi esegui lo script di setup.

### Opzione B: Solo memoria (per test rapidi)
Nel `.env` locale commenta DATABASE_URL:
```env
# DATABASE_URL=postgresql://...
```
L'app userà solo memoria (dati non persistenti ma funzionante).