# Documentazione — GreenEco Operations

| | |
|---|---|
| **Applicazione** | GreenEco Operations (web-app, installabile su telefono) |
| **Stato** | Prototipo dimostrativo — dati di prova |
| **Versione raccolta** | 1.0 |

GreenEco Operations raccoglie alcuni strumenti operativi aziendali. Questo
documento **indicizza i manuali** disponibili per la valutazione del Consulente
del lavoro: ciascun modulo ha un proprio manuale dettagliato, allegato a parte.

---

## Da dove iniziare

**Documento: «Guida rapida — GreenEco Operations»** *(separato, schematico)*

Una panoramica **a colpo d'occhio** di tutta l'app: un **diagramma di flusso** per
ogni funzione (accesso, timbrature, straordinari, automezzi, multe, cassetto,
categorie e permessi) e una tabella **«chi vede cosa»**. Da leggere per primo;
i manuali qui sotto entrano nel dettaglio.

---

## Moduli e documenti

### 1. Timbrature Presenze
**Documento: «Manuale — Modulo Timbrature Presenze»** *(separato, con schermate)*

Rilevazione delle presenze con il modello «dichiara attività» (**viaggio /
lavoro / pausa / fine giornata**), calcolo del **cartellino mensile** con
evidenza separata dello **straordinario**, **funzionamento senza connessione**
(buffer di sicurezza) e **misure di attendibilità** delle timbrature.

### 2. Sanzioni sui mezzi
**Documento: «Manuale — Sanzioni sui mezzi»** *(separato, con schermate)*

Gestione delle **multe** addebitabili al dipendente che aveva il mezzo:
registrazione e **attribuzione automatica** dal passaggio di consegna, **allegato
della scansione del verbale** (archivio privato), **notifica** al dipendente e
**presa visione/contestazione**.

### 3. Cassetto del dipendente

Spazio personale con **Cedolini**, **Multe** e **Sanzioni disciplinari**. I
documenti sono **strettamente privati**: l'Ufficio paghe li carica e ogni
dipendente vede **solo i propri** (archivio privato con link a scadenza). Schema
di flusso nella **Guida rapida**, § 6.

### 4. Categorie & Permessi

Le **categorie** (reparti) decidono cosa ogni utente vede e può fare, tramite
**flag** granulari accendibili/spegnibili. **Ogni modifica è confermata con la
password** dell'utente abilitato. Schemi di flusso nella **Guida rapida**, § 7.

---

## Avvertenze comuni

- **Stato dello strumento:** prototipo/dimostratore con **dati di prova**; non
  ancora idoneo a trattare dati reali del personale in produzione. In roadmap:
  autenticazione robusta, isolamento dei dati a livello di database, periodo di
  conservazione, backup automatici.
- **Profili normativi:** i trattamenti descritti (geolocalizzazione,
  identificazione del conducente, eventuali trattenute) vanno improntati a
  **proporzionalità**, preceduti da **informativa** ed eventuale **accordo
  sindacale o autorizzazione dell'ITL** (art. 4 L. 300/1970), oltre alle basi del
  **GDPR**.
- **Valore dei dati:** i valori e i calcoli prodotti sono **di supporto** e non
  costituiscono un cartellino con valore legale.
- Le sezioni **«Da definire»** nei singoli manuali raccolgono i punti aperti da
  concordare con il Consulente.

---

## Elenco dei file

- `manuale-indice.html` — questo documento
- `manuale-rapido.html` (e `.md`) — **Guida rapida** (schemi di flusso)
- `manuale-timbrature.html` (e `.md`) — Timbrature Presenze
- `manuale-sanzioni.html` (e `.md`) — Sanzioni sui mezzi

*I file `.html` sono autoconsistenti (immagini incorporate): si aprono nel
browser e, da Stampa → «Salva come PDF», si ottiene la copia da consegnare.*
