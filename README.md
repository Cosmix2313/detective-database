Template frontend statico per un **database investigativo** stile Fort Carson (login demo + dashboard protetta).

## Avvio locale (consigliato)

Apri un terminale nella cartella del progetto e usa **uno** di questi comandi:

### Windows (PowerShell / CMD)

```powershell
py -m http.server 8080
```

Se `py` non funziona, prova:

```powershell
python -m http.server 8080
```

### Linux / macOS / WSL

```bash
python3 -m http.server 8080
```

Poi apri: <http://localhost:8080>

---

## Risoluzione errore su Windows: "Python non è stato trovato... Microsoft Store"

Se vedi il messaggio:

> "Python non è stato trovato; eseguire senza argomenti da installare dal Microsoft Store..."

significa quasi sempre che Windows sta usando l'**alias App Execution** invece dell'installazione Python reale.

Prova in questo ordine:

1. Verifica Python:

   ```powershell
   py --version
   python --version
   ```

2. Se `py --version` funziona, usa sempre:

   ```powershell
   py -m http.server 8080
   ```

3. Se `python --version` apre il messaggio Microsoft Store:
   - Vai in **Impostazioni > App > Impostazioni app avanzate > Alias di esecuzione dell'app**.
   - Disattiva gli alias di `python.exe` e `python3.exe`.
   - Chiudi e riapri il terminale.

4. Controlla che il Python installato sia nel PATH e riprova:

   ```powershell
   python -m http.server 8080
   ```

---

## Credenziali demo login

- Agent ID: `FC-214`
- Passcode: `fortcarson`

Definite in `app.js` (solo demo frontend, nessuna sicurezza reale).

## Note

- Questo progetto è **solo frontend statico**.
- Lo stato login è salvato in `localStorage` del browser.
- Per produzione serve backend + autenticazione reale.
