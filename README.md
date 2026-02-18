# Ohvalecity-WIKI

Wiki stile GitBook per il server RP Minecraft **OhvaleCity** (tema rosso) con:

- 🔎 Ricerca live su FAQ, regolamento e guide.
- 📜 Sezione regolamento RP City (no RDM/VDM, azioni con senso) modificabile.
- 🟢 Stato server con numero player online.
- 🛠️ Pannello admin (protetto da password demo) per aggiornare host, regole e FAQ.

## Avvio locale

Puoi usare un server statico qualunque. Esempio con Python:

```bash
python3 -m http.server 8080
```

Poi apri: <http://localhost:8080>

## Password admin demo

- Password predefinita: `ohvale-admin`
- File: `app.js` (`ADMIN_PASSWORD`)

> Nota: il pannello admin salva nel `localStorage` del browser. Per una versione produzione serve backend + autenticazione reale.
