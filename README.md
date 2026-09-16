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

## Firebase

1. Kopirajte .env.example u .env.
2. Upišite FIREBASE_API_KEY i FIREBASE_PROJECT_ID.
3. U Firebase Authentication uključite Email/Password i Anonymous.
4. Izradite Firestore Database.
5. Objavite pravila iz firestore.rules.

## Pokretanje

Otvorite **mapu MojeFinancijeNative** u VS Codeu (File → Open Folder). U Run and Debug odaberite **Moje Financije — pokreni aplikaciju** i pritisnite zeleni trokut ili F5. Prvo pokretanje instalira potrebne pakete u terminalu. Otvaranje `src/app.mjs` i pritiskanje gumba Run Code pokreće obični Node i preskače Qt; koristite opisanu F5 konfiguraciju ili dvoklik na `POKRENI.cmd`. Ako se instalacija zaustavi na preuzimanju Qt-a ili izgradnji izvornog modula, pošaljite tekst pogreške iz terminala.

Alternativno, dvokliknite `POKRENI.cmd` u Exploreru. Instalirajte Node.js i CMake prije prvog pokretanja. Iz terminala:

    npm install
    npm start

NodeGUI pri prvoj instalaciji preuzima Qt komponente pa instalacija može trajati nekoliko minuta. Konfiguracija ne otvara preglednik.

## Napomena o EXE datoteci

NodeGUI koristi izvorne Qt biblioteke. Za pouzdanu Windows distribuciju projekt treba izgraditi na Windows računalu. Gumb Run and Debug sada pokreće `src/app.mjs` putem priložene VS Code konfiguracije.

## GitHub

Izvorni kod je u privatnom repozitoriju `platakai/MojeFinancijeNative`. Za rad iz VS Codea odaberite **Clone Repository** i klonirajte `https://github.com/platakai/MojeFinancijeNative.git`. Za Firebase kopirajte svoju `.env` datoteku u korijen klonirane mape; ona, baze podataka i `node_modules` nisu uključeni u Git. Preuzeti ZIP služi pokretanju dvoklikom i nema Git metapodatke; za daljnje commitove radite u kloniranoj mapi.
