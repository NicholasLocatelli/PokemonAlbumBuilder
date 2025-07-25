// File per aiutare con l'ambiente locale Windows
// Elimina completamente le sessioni PostgreSQL per evitare errori

// 1. Nel tuo ambiente locale, aggiungi al file .env:
// USE_MEMORY_SESSIONS=true

// 2. Oppure, per evitare completamente PostgreSQL per le sessioni:
// Commenta o rimuovi DATABASE_URL dal file .env locale:
// # DATABASE_URL=postgresql://...

console.log("Per risolvere l'errore locale:");
console.log("1. Nel file .env locale, commenta DATABASE_URL:");
console.log("   # DATABASE_URL=postgresql://...");
console.log("2. Oppure aggiungi: USE_MEMORY_SESSIONS=true");
console.log("3. Riavvia il server");