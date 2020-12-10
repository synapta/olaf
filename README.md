# OLAF: Open Linked Authority Files

Una piattaforma di crowdsourcing per allineare in modo semiautomatico basi di dati diverse.

## Installazione e avvio

Se necessario, creare un file `.env` per impostare le seguenti variabili:

```
PORT=3646
DATABASE_URI=sqlite:db.sqlite
SESSION_SECRET=secret
MAILGUN_KEY=
```

In alternativa a SQLite è possibile utilizzare PostgreSQL:

```
DATABASE_URI=postgres://user:password@localhost:5432/database
```

- Per installare: `npm ci`
- Per creare il database: `npm run db`
- Per avviare: `npm start`   
