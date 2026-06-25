# Manuale preliminare — Modulo "Timbrature Presenze"

**GreenEco — Sistema di rilevazione presenze del personale**

Documento tecnico-funzionale per la valutazione preliminare del Consulente del Lavoro,
in vista di un accordo sindacale e dell'eventuale adozione dello strumento.

| | |
|---|---|
| **Versione documento** | 0.1 — bozza preliminare |
| **Data** | 25 giugno 2026 |
| **Ambito** | Esclusivamente il modulo "Timbrature Presenze" |
| **Stato dello strumento** | Prototipo dimostrativo (non ancora in esercizio con dati reali) |
| **Destinatario** | Consulente del Lavoro di GreenEco |

> **Avvertenza.** Il presente documento ha natura **tecnico-descrittiva**: illustra come funziona
> lo strumento e quali dati tratta, allo scopo di fornire al Consulente del Lavoro gli elementi
> necessari alla valutazione. **Non costituisce parere legale** né una valutazione di conformità:
> le determinazioni giuridiche (base giuridica del trattamento, applicabilità e modalità dell'art. 4
> dello Statuto dei Lavoratori, contenuto dell'informativa, necessità ed esito di una DPIA, periodo
> di conservazione, utilizzabilità a fini disciplinari) competono al Consulente del Lavoro e, ove
> previsto, al Responsabile della Protezione dei Dati, di concerto con le rappresentanze sindacali.

---

## 1. Scopo dello strumento

Il modulo "Timbrature Presenze" consente al personale di GreenEco di registrare **entrate e uscite**
dal servizio tramite un'applicazione web utilizzabile da smartphone (o computer), e all'azienda di
disporre di un **riepilogo mensile** delle ore lavorate, con distinzione tra **ore ordinarie** e
**ore straordinarie**.

Le finalità perseguite (da confermare e circoscrivere con il Consulente del Lavoro) sono:

1. **Rilevazione della presenza** e dell'orario di lavoro effettivo del personale;
2. **Gestione amministrativa** delle ore ai fini di paga, con evidenza separata dello straordinario;
3. **Verifica della presenza presso il luogo di lavoro/cantiere** al momento della timbratura
   (funzione di geolocalizzazione, opzionale e attivabile — v. § 5).

> **Nota metodologica.** La definizione puntuale delle finalità è il presupposto di tutto l'impianto
> giuridico (base giuridica, proporzionalità, informativa). Si richiede al Consulente di validare o
> ridefinire le finalità sopra elencate, in particolare in merito alla geolocalizzazione.

---

## 2. Soggetti coinvolti

| Ruolo nello strumento | Chi è | Cosa può fare |
|---|---|---|
| **Dipendente** | Lavoratore | Timbra la propria entrata/uscita; vede **solo** le proprie timbrature. |
| **Manager / Preposto** | Responsabile di squadra | Vede lo stato "in servizio" e le timbrature **del proprio team**; consulta e scarica il cartellino mensile dei propri collaboratori. |
| **Amministratore** | Ufficio del personale / titolare delegato | Vede e scarica le timbrature e i cartellini di **tutto il personale**; gestisce gli utenti; esporta i dati. |

**Ruoli ai fini privacy (da formalizzare):**

- **Titolare del trattamento:** GreenEco (società datrice di lavoro).
- **Responsabili del trattamento (esterni):** i fornitori dell'infrastruttura tecnica che ospitano i
  dati e l'applicazione (servizio di database/hosting e piattaforma di pubblicazione). Andranno
  individuati e nominati ex art. 28 GDPR, con verifica del luogo di conservazione dei dati (UE/extra-UE).
- **Soggetti autorizzati:** amministratore e manager, da istruire e autorizzare al trattamento.

---

## 3. Come funziona la timbratura (lato dipendente)

1. Il dipendente accede all'applicazione con le proprie credenziali.
2. Apre la sezione **"Timbrature Presenze"**.
3. **Alla prima timbratura** viene mostrata un'**informativa** che il lavoratore deve leggere prima di
   procedere (v. § 6 e § 9 — Allegato A: la versione attuale è un **segnaposto** da sostituire con il
   testo validato).
4. Compare una schermata con lo **stato corrente** ("FUORI SERVIZIO" / "IN SERVIZIO") e un unico
   pulsante grande:
   - se è fuori servizio → **"Timbra ENTRATA"**;
   - se è in servizio → **"Timbra USCITA"**.
5. Premendo il pulsante, **solo in quel momento** l'applicazione richiede la posizione al dispositivo
   (v. § 5) e registra la timbratura con data e ora.
6. Lo storico mostra le proprie timbrature, ciascuna con orario e — se disponibile — un collegamento
   alla posizione su mappa.

**Caratteristiche rilevanti ai fini della valutazione:**

- La rilevazione della posizione avviene **esclusivamente all'atto della singola timbratura**: **non**
  esiste alcun tracciamento continuo o in background.
- Se il dipendente **nega** il permesso di posizione, o il dato non è disponibile, **la timbratura
  viene comunque registrata "senza posizione"**: la timbratura non è impedita.

---

## 4. Dati trattati

Per ciascuna timbratura il sistema registra i seguenti dati (tabella `time_clockings`):

| Dato | Descrizione | Note |
|---|---|---|
| Identificativo timbratura | Codice univoco interno | — |
| Identificativo lavoratore | Riferimento all'anagrafica dipendente | Pseudonimo/ID, collegato all'anagrafica |
| Tipo | "Entrata" o "Uscita" | — |
| Data e ora | Istante della timbratura | Con fuso orario |
| Latitudine / Longitudine | Posizione al momento della timbratura | **Solo se** consentita/disponibile; può essere assente |
| Accuratezza | Margine di errore stimato della posizione (metri) | Indicativo |

**Dati NON trattati da questo modulo:** non vengono raccolti dati biometrici, non vengono registrati
spostamenti tra una timbratura e l'altra, non viene effettuato alcun monitoraggio dell'attività del
dispositivo o della navigazione.

> **Da definire con il Consulente:** il **periodo di conservazione** dei dati di timbratura e di
> posizione (proposta tecnica di default da concordare, es. distinzione tra dato presenza ai fini paga
> e dato di posizione, con conservazione di quest'ultimo ridotta al minimo necessario).

---

## 5. Geolocalizzazione — principi adottati

La geolocalizzazione è il punto di maggiore attenzione giuridica e merita una trattazione specifica.
Lo strumento è stato progettato secondo il principio di **minimizzazione** (privacy by design):

- **Rilevazione puntuale, non continuativa:** la posizione è acquisita **solo nell'istante della
  timbratura**, non prima e non dopo. Non c'è tracciamento del percorso né localizzazione periodica.
- **Finalità circoscritta:** verificare che la timbratura avvenga presso il luogo di lavoro/cantiere.
- **Non bloccante e degradabile:** la mancata concessione del permesso non impedisce la timbratura
  (che resta valida "senza posizione"), evitando di costringere il lavoratore a cedere il dato.
- **Trasparenza:** all'utente è mostrato un avviso esplicito ("la posizione è rilevata solo ora,
  all'atto della timbratura") e l'accesso all'informativa.
- **Dato grezzo minimo:** vengono salvate coordinate e accuratezza puntuali, senza arricchimenti.

**Opzioni configurabili da concordare** (attualmente non implementate, ma previste come evoluzione):

- **Geolocalizzazione disattivabile** del tutto, qualora non ritenuta necessaria/proporzionata;
- **Verifica per area** (geofencing): registrare solo se la timbratura è dentro un raggio definito
  attorno a una sede/cantiere, eventualmente memorizzando **solo l'esito** ("dentro/fuori area") e non
  le coordinate puntuali — soluzione più rispettosa della minimizzazione;
- **Tolleranza/arrotondamento** della posizione.

> **Punto centrale per l'accordo sindacale.** La presenza di una funzione di geolocalizzazione, anche
> se puntuale e non continuativa, può configurare lo strumento come potenzialmente idoneo al
> **controllo a distanza dell'attività dei lavoratori** ai sensi dell'**art. 4 della Legge 300/1970
> (Statuto dei Lavoratori)**. Si richiede al Consulente la valutazione circa (a) la riconducibilità
> dello strumento al comma 1 (impianti dai quali derivi anche la possibilità di controllo a distanza,
> che richiedono **accordo con la RSU/RSA o autorizzazione dell'Ispettorato Territoriale del Lavoro**)
> oppure al comma 2 (strumenti utilizzati per rendere la prestazione e di registrazione degli accessi
> e presenze, esenti da accordo), e (b) l'incidenza della componente di geolocalizzazione su tale
> qualificazione.

---

## 6. Riepilogo mensile e calcolo delle ore (lato manager/amministratore)

Oltre alla vista in tempo reale ("in servizio ora", timbrature recenti), il sistema produce un
**cartellino mensile** per ciascun dipendente.

- **Selezione** del mese (corrente o precedenti) e del dipendente.
- **Una riga per ogni giorno** del mese, con: prima entrata, ultima uscita, **ore lavorate**,
  **ore ordinarie** e — in colonna separata — **ore straordinarie**.
- **Soglia giornaliera** delle ore ordinarie **impostabile** (valore predefinito 8 ore): oltre la
  soglia, le ore sono conteggiate come straordinario.
- **Le ore straordinarie NON sono arrotondate:** è riportato il **tempo effettivo** (precisione al
  minuto a video, valore esatto nei file esportati). Esempio: 1 ora e 30 minuti resta 1:30, non viene
  arrotondato a unità.
- **Esportazione** del cartellino in formato CSV (compatibile con Excel), per singolo dipendente o in
  un unico file per tutto il personale.

**Criterio di calcolo (trasparente e verificabile):** le timbrature di entrata e uscita vengono
accoppiate in ordine cronologico; ogni coppia entrata→uscita costituisce un intervallo di lavoro, la
cui durata è sommata nel giorno in cui è svolta (un turno a cavallo della mezzanotte è ripartito tra i
due giorni). Le ore ordinarie del giorno sono il minimo tra ore lavorate e soglia; le straordinarie
sono l'eccedenza.

> **Da definire con il Consulente:** se il calcolo dello straordinario debba avvenire su base
> **giornaliera** (come oggi) o **settimanale/contrattuale**, e il trattamento di festivi, notturni,
> permessi e assenze. Lo strumento attuale calcola lo **straordinario giornaliero** ed espone un dato
> **di supporto**, non un cartellino con valore legale (v. § 8).

---

## 7. Gestione delle anomalie

Il sistema **segnala** ma non "indovina" le situazioni irregolari, per non alterare i dati:

- **"manca uscita"** — una nuova entrata senza che la precedente sia stata chiusa;
- **"manca entrata"** — un'uscita senza entrata corrispondente;
- **"ancora in servizio"** — entrata non ancora chiusa da un'uscita.

> **Da definire:** la procedura di **rettifica/giustificazione** delle anomalie (chi può correggere,
> con quale tracciabilità delle modifiche), aspetto rilevante sia ai fini gestionali sia di garanzia
> per il lavoratore.

---

## 8. Stato attuale dello strumento e percorso verso la produzione

Per correttezza verso il Consulente si dichiara con trasparenza lo **stato di avanzamento**.

**Stato attuale: prototipo dimostrativo.** Lo strumento è funzionante e pubblicato, ma è da intendersi
ad oggi come **dimostratore**: utilizzato con **dati di prova**, **non ancora idoneo a trattare dati
reali del personale** in produzione. In particolare:

- l'accesso è gestito con un meccanismo provvisorio, **non ancora basato su autenticazione robusta**;
- le regole di **isolamento dei dati a livello di database** (per cui ciascuno acceda solo ai dati di
  propria competenza) **non sono ancora applicate in modo forte**;
- l'**informativa** mostrata è un **segnaposto** (Allegato A) da sostituire con il testo validato;
- il meccanismo attuale di "consenso" all'avvio **è da rivedere** (v. nota nel § 9).

**Requisiti tecnici per l'esercizio (roadmap):**

1. Autenticazione reale degli utenti e isolamento forte dei dati (controlli a livello di database);
2. Backup automatici e procedura di ripristino documentata;
3. Definizione e applicazione del periodo di conservazione;
4. Registro dei trattamenti, nomine dei responsabili esterni, verifica ubicazione dei dati;
5. Eventuale DPIA (valutazione d'impatto) se ritenuta necessaria per la geolocalizzazione.

**Requisiti giuridico-organizzativi (di competenza del Consulente / azienda / sindacato):**

1. **Procedura ex art. 4 L. 300/1970**: accordo con la RSU/RSA oppure autorizzazione dell'ITL, ove
   applicabile;
2. **Base giuridica** del trattamento ai sensi dell'art. 6 GDPR (di norma per il rapporto di lavoro
   **non** il consenso, ma l'esecuzione del contratto / obbligo legale / legittimo interesse —
   valutazione del Consulente/DPO);
3. **Informativa ex art. 13 GDPR** e **informativa sulle modalità d'uso e sui controlli** ex art. 4,
   co. 3, Statuto dei Lavoratori, quale condizione per l'utilizzabilità dei dati anche a fini
   disciplinari;
4. Valutazione di **proporzionalità e necessità** della geolocalizzazione rispetto alle finalità.

---

## 9. Quadro normativo di riferimento (per la valutazione)

Si elencano, a titolo ricognitivo e non esaustivo, le fonti rilevanti che il Consulente vorrà
considerare:

- **Art. 4, Legge 20 maggio 1970, n. 300 (Statuto dei Lavoratori)** — impianti e strumenti dai quali
  derivi la possibilità di controllo a distanza; necessità di accordo sindacale o autorizzazione ITL;
  obbligo di informativa sulle modalità d'uso e sui controlli (co. 3).
- **Regolamento (UE) 2016/679 (GDPR)** e **D.lgs. 196/2003** come adeguato — principi di liceità,
  minimizzazione, limitazione della conservazione (art. 5); base giuridica (art. 6); informativa
  (art. 13); valutazione d'impatto (art. 35) ove il trattamento presenti rischi elevati, ipotesi
  frequentemente associata alla **geolocalizzazione sistematica dei lavoratori**.
- **Provvedimenti e linee guida del Garante per la protezione dei dati personali** in materia di
  geolocalizzazione e controllo dei lavoratori.
- **CCNL applicato** e disciplina contrattuale dell'orario di lavoro e dello straordinario.

> **Sintesi dei punti che richiedono una decisione esterna allo strumento:**
> 1. Qualificazione ex art. 4 e relativa procedura (accordo sindacale / autorizzazione ITL);
> 2. Base giuridica del trattamento e revisione dell'attuale meccanismo di "consenso";
> 3. Necessità/proporzionalità ed eventuale riconfigurazione della geolocalizzazione (es. solo
>    esito "dentro/fuori area");
> 4. Periodo di conservazione dei dati;
> 5. Necessità di una DPIA;
> 6. Procedura di rettifica delle timbrature e regole d'uso;
> 7. Valore (di supporto o legale) attribuito al cartellino e criterio di calcolo dello straordinario.

---

## Allegato A — Bozza/segnaposto di informativa al lavoratore

> **Testo attualmente mostrato nell'app — DA SOSTITUIRE.** È un segnaposto privo di valore: il testo
> definitivo dovrà essere redatto/validato dal Consulente del Lavoro e dal DPO e includere almeno:
> titolare e contatti, finalità, base giuridica, categorie di dati (incl. posizione), modalità di
> raccolta (puntuale all'atto della timbratura), destinatari/responsabili e ubicazione dei dati,
> periodo di conservazione, diritti dell'interessato e modalità di esercizio, riferimento all'accordo
> ex art. 4 e alle regole d'uso.

## Allegato B — Schema dei dati di una timbratura

```
timbratura {
  id                  identificativo univoco
  dipendente          riferimento all'anagrafica (ID)
  tipo                "entrata" | "uscita"
  data_ora            istante della timbratura (con fuso orario)
  latitudine          opzionale (solo se consentita/disponibile)
  longitudine         opzionale (solo se consentita/disponibile)
  accuratezza_m       opzionale (margine di errore in metri)
}
```

## Allegato C — Esempio illustrativo di cartellino mensile (dati fittizi)

| Giorno | Entrata | Uscita | Ore lavorate | Ore ordinarie | Ore straordinarie | Note |
|---|---|---|---|---|---|---|
| Lun 01 | 08:00 | 17:00 | 8:00 | 8:00 | 0:00 | |
| Mar 02 | 08:00 | 18:30 | 9:30 | 8:00 | 1:30 | |
| Mer 03 | 08:05 | — | 0:00 | 0:00 | 0:00 | manca uscita |
| … | | | | | | |
| **Totali** | | | **17:30** | **16:00** | **1:30** | |

*(Soglia ore ordinarie/giorno: 8,00. Le ore straordinarie sono il tempo effettivo, non arrotondato.)*

---

*Documento predisposto a supporto della valutazione preliminare. Le scelte giuridiche e organizzative
indicate come "da definire" sono rimesse al Consulente del Lavoro di GreenEco, di concerto con le
rappresentanze sindacali e, ove nominato, con il Responsabile della Protezione dei Dati.*
