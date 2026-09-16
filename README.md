# Moje Financije Native

Izvorna desktop aplikacija napisana u JavaScriptu pomoću NodeGUI/Qt-a. Ne koristi HTML, CSS, Chromium, web preglednik niti localhost za prikaz sučelja. Podaci se uvijek spremaju u lokalni SQLite, a zatim sinkroniziraju s Cloud Firestoreom.

## Podržano

- prijava i registracija e-mailom i lozinkom unutar aplikacije
- anonimna gostujuća prijava unutar aplikacije
- lokalni SQLite i rad bez interneta (odaberite "Samo lokalno, bez prijave")
- Firebase Authentication putem službenog REST API-ja
- sinkronizacija s Cloud Firestoreom
- nadzorna ploča, transakcije, budžeti i CSV izvoz
- odvojeni podaci prema korisničkom Firebase UID-u

Google prijava nije uključena jer Google OAuth zahtijeva preglednik ili ugrađeni web-prikaz, što je protiv zadanog ograničenja.

