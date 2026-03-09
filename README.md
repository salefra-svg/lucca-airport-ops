# lucca-airport-ops

Web app per il tracciamento operativo di arrivi e partenze dell'aeroporto di **Lucca Tassignano**.

## Funzionalità principali
- Form in italiano per registrare i movimenti con tutti i dati operativi:
  - Callsign, marca, tipo, esercente
  - Provenienza, destinazione, stato del movimento
  - Arrivo/partenza (data + ora locale + ora UTC)
  - Passeggeri in arrivo/partenza
  - Carburante (Nessuna, Jet A1, AVgas), richiesta taxi, altre richieste
- Tabella movimenti con azioni per ogni riga:
  - **Modifica**
  - **Elimina**
- Filtro per data sopra la tabella.
- Pulsante **Esporta CSV** per esportare i movimenti visibili (in base al filtro data attivo).
- Riepilogo giornaliero:
  - numero arrivi
  - numero partenze
  - totale movimenti
  - totale passeggeri in arrivo
  - totale passeggeri in partenza
- Ordinamento automatico per data/ora (più recenti prima).
- Salvataggio persistente in `localStorage` (`lucca-airport-ops.movements`).

## Avvio locale
Apri `index.html` direttamente nel browser oppure usa un server statico, ad esempio:

```bash
python3 -m http.server 4173
```

## Test manuali consigliati
1. Inserire un nuovo movimento e verificare la comparsa nella tabella.
2. Verificare che il record resti visibile dopo refresh pagina (persistenza `localStorage`).
3. Modificare un record esistente e controllare aggiornamento dati e stato.
4. Eliminare un record e verificare la rimozione.
5. Impostare un filtro data e verificare i risultati e il riepilogo giornaliero.
6. Inserire più record in date/orari diversi e verificare l'ordinamento automatico.
7. Applicare un filtro data, usare **Esporta CSV** e verificare che il file contenga solo i movimenti filtrati con intestazioni corrette.
