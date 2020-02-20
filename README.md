# OLAF: Open Linked Authority Files

Una piattaforma di crowdsourcing per allineare in modo semiautomatico basi di dati diverse.

## Installazione e avvio

Per installare: `npm install`   
Per avviare: `npm start`   

Ulteriori dettagli in merito alla posizione di OLAF e alle configurazioni 
**nginx** fare riferimento alla [Wiki di Athena](https://wiki.synapta.io/index.php/Athena)

## Flusso di configurazione

La configurazione di Olaf avviene mediante la creazione di directory e file associati
a un certo nome utente che determinano il comportamento dell'applicazione.   
Questi vengono importati automaticamente nella view finale durante il rendering.   

Il meccanismo si basa sulla sovrascrittura delle funzioni in base all'ordine dei 
file importati durante il flusso di esecuzione.

### Directory app/config

Struttura del file .json di configurazione:

```
{

  "limit" : [int or null],
  "selection": ["left" or "right"],
  "matching": ["toggle" or "import"],
  "fields": {

    "*Nome campo*": {
      "input": "*Identificativo campo custom in ingresso*",
      "wikidata": ["*Identificativo wikidata in ingresso*" or null],
      "viaf": ["*Identificativo VIAF in ingresso*" or null],
      "group": ["*Gruppo a cui il campo appartiene*" or null],
      "limit": [int or null],
      "label": ["*Label del campo*" or null],
      "select": [true or false],
      "format": {
        ...
      }
    },

    ...

}
```

Di seguito una legenda dei campi di configurazione:

* **limit**: Numero massimo di autori selezionabili.
* **selection**: Lato deafault della selezione. Se "left" preseleziona 
                 tutti i campi in arrivo dall'esterno. Se "right" preseleziona
                 i campi in arrivo da Wikidata e VIAF
* **matching**: Comportamento del bottone di selezione di un campo. Se "toggle"
                è possibile selezionare e deselezionare un dato campo se cliccato
                ripetutamente. Altrimenti no.

Il campo fields ospita una mappa che associa a ogni informazione proveniente
dall'esterno un identificativo interno.   

Mappa **Nome campo** a **Identificativo custom**, **Identificativo Wikidata** 
e **Identificativo VIAF**.   

I campi successivi:

* **group**: È una stringa che identifica il gruppo a cui appartiene il dato campo.
* **limit**: Il numero massimo di istanze che un campo può avere
* **label**: La label del dato campo
* **select**: Codifica se un campo deve essere selezionabile in fase, appunto, di
              selezione.
              
Il campo **format** è più complesso.
Contiene una regex per parsificare il dato in ingresso e un formato per tradurlo.
Rispettivamente *in* e *out*.   
Check contiene un vettore di regex che consentono il controllo della validità di
un campo.

```
"format": {
    "in": "regex",
    "out": "regex",
    "check": ["regex", "regex" ...]
}
```

Un esempio di questo campo è (per Beweb):

```
"format": {
    "in": "^(\\d{4})-(\\d{2})-(\\d{2})$",
    "out": "$3/$2/$1",
    "check": ["^\\d{2}/\\d{2}/\\d{4}$", "^\\d{4}$"]
}
```

### Directory users

La struttura di questa directory è la seguente:

```
users > *Nome utente*
```

Ogni sottodirectory di users è dedicata a un utente distinto e deve contenere
obbligatoriamente due file **parsers** e **queries**.   

La definizione di un nuovo utente prevede la scrittura di due nuovi file nei quali
all'interno sono definite le medesime funzioni degli altri file, richiamate dal file
**routes** nella directory principale.

### Directory app/js/author

La struttura di questa directory è la seguente:

```
author > rendering > *Nome utente*
author > *Nome utente*
```

Ogni file di author può essere dedicato a un utente distinto e può contenere
eventualmente un file con lo stesso nome dell'utente al quale è associato.   

Ognuno di questi file può sovrascrivere una funzione definita in **author/static** e di
**author/rendering/static**
