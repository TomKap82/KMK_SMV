# KMK-SMV – Firebase-Version

## Inhalt

- `Forum.html`: Oberfläche im bisherigen dunklen Layout.
- `app.js`: Live-Synchronisierung über Firestore (`onSnapshot`), anonyme Teilnahme, Admin-Anmeldung.
- `firebase-config.js`: Firebase-Web-Konfiguration (vor Inbetriebnahme ausfüllen).
- `firestore.rules`: Datenzugriff, Validierung und Berechtigungen.
- `firebase.json`: Konfiguration für optionalen Rules-Deploy über die Firebase CLI.
- `sw.js`, `manifest.json`: PWA.
- Die vorhandenen Repository-Bilddateien `logo.png`, `icon-192.png`, `icon-512.png` **aus dem alten Repository übernehmen**. Sie sind nicht im ZIP enthalten.

## 1. Firebase-Projekt anlegen

1. https://console.firebase.google.com aufrufen und Projekt erstellen.
2. Unter **Projekteinstellungen > Deine Apps** eine **Web-App** registrieren.
3. Die Web-Konfigurationswerte in `firebase-config.js` eintragen (`apiKey`, `authDomain`, `projectId`, `appId`). Dies ist eine öffentliche Web-Konfiguration, **kein Service-Account-Schlüssel**.
4. Unter **Authentication > Sign-in method** `Anonym` **und** `E-Mail/Passwort` aktivieren.
5. Unter **Authentication > Settings > Authorized domains** die Domain der veröffentlichten App überprüfen (bei GitHub Pages `TomKap82.github.io`); falls nicht vorhanden, hinzufügen.
6. **Firestore Database** erstellen und passende EU-Region auswählen, sofern für die Schule geeignet. Sicherheitsregeln sofort wie unten konfigurieren.

## 2. Firestore-Regeln veröffentlichen

In **Firestore Database > Rules** den Inhalt von `firestore.rules` einfügen und veröffentlichen.

Alternativ, nach Installation von Node und Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules
```

**Nie** `allow read, write: if true` produktiv verwenden.

## 3. Admin-Zugang anlegen

1. In **Authentication > Users > Add user** einen E-Mail/Passwort-Benutzer anlegen.
2. Die UID dieses Benutzers kopieren.
3. In der Firestore-Konsole die Sammlung `admins` anlegen.
4. Ein Dokument mit **Dokument-ID gleich der kopierten UID** erstellen; Feld z. B. `role` = `admin`.
5. Im Forum über **Admin Login** anmelden. Danach wird **Aktion erstellen** sichtbar.

Wichtig: Niemand kann über die Web-App selbst ein `admins`-Dokument erstellen, weil die Regeln das verbieten.

## 4. Dateien auf GitHub Pages veröffentlichen

Im Repository `TomKap82/KMK_SMV` auf dem `main`-Branch die vorhandenen Dateien `Forum.html`, `sw.js`, `manifest.json` durch die neuen Versionen ersetzen. `app.js`, `firebase-config.js`, `firestore.rules`, `firebase.json` neu hinzufügen. Die drei ursprünglichen PNG-Dateien behalten. Die alte `data.json` wird **nicht** für Live-Daten verwendet; sie kann als leerer Altbestand verbleiben und später entfernt werden.

Repository > Settings > Pages: GitHub Pages auf gewünschten Branch/Ordner konfigurieren, falls noch nicht aktiv. Aufruf: `https://tomkap82.github.io/KMK_SMV/Forum.html` (falls Pages aus `main`/root bereitgestellt wird).

## 5. Test mit zwei Geräten

1. Auf Gerät A Forum öffnen, neue Idee einreichen.
2. Auf Gerät B Forum öffnen: Idee muss ohne Seitenneuladen erscheinen.
3. Auf A **Dafür** drücken, auf B erscheint die Stimme.
4. Auf B ebenfalls abstimmen: Summe erhöht sich, ohne A zu überschreiben.
5. Admin erstellt eine Aktion; auf beiden Geräten erscheint sie.
6. Teste Helfereinträge und das Entfernen eigener Einträge.
7. Bei Problemen: Browser-Entwicklerkonsole und Statuszeile beachten, Firestore-Regeln sowie erlaubte Domain prüfen.

## Bekannte Grenzen dieser ersten Version

- **Anonyme Konten sind keine starke Personenidentität.** Ein Nutzer kann mit anderem Browserprofil/gelöschtem Browserspeicher ein weiteres anonymes Konto erstellen und erneut abstimmen. Für eine verbindliche Wahl: schulisches Login / verwaltete Nutzerkonten und stärkere Sicherheitsregeln.
- Die **maximale Helferanzahl ist nur in der Oberfläche geprüft**, nicht atomar in den Firestore-Regeln. Bei zeitgleichen Eintragungen können Plätze überbucht werden. Für harte Platzgrenzen sind Firestore-Transaktionen mit geeignetem Datenmodell plus geprüften Regeln oder eine serverseitige Cloud Function notwendig.
- Ideen darf jeder angemeldete anonyme Besucher erstellen. Das ist nicht spamfest. Für öffentlichen produktiven Schuleinsatz Empfehlung: moderierte Ideen, App Check, Zugangsbeschränkung, Lösch- und Sperrkonzept.
- Helferkürzel und Ideentexte sind **öffentlich lesbar**, sobald die Website erreichbar ist. Keine Klarnamen oder personenbezogenen Schuldaten ohne abgestimmtes Datenschutzkonzept sammeln. Firestore speichert auch Zeitstempel und Nutzer-UIDs. Schulleitung/Datenschutzbeauftragte einbeziehen.
- Es gibt noch keine Moderationsoberfläche zum Löschen von Ideen/Aktionen. Admins können über die Firebase-Konsole verwalten.
- Firestore-Daten sind online synchronisiert. Die PWA-Shell wird zwischengespeichert, **keine voll funktionsfähige Offline-Datenbank** ist implementiert.
- Die Anzeige lädt die Stimmen und Helfer über Unterkollektionen (pro Idee/Aktion ein Listener). Für viele Inhalte sollte das Datenmodell effizienter werden.
- Drittanbieter-CDNs für Tailwind und Lucide werden wie im bisherigen Projekt geladen; für eine produktive Schul-App sollten diese lokal bzw. über einen Build eingebunden und Datenschutz/CSP geprüft werden.

## Migration bisheriger Inhalte

Deine bisherige `data.json` war leer (`ideas: []`, `actions: []`). Sollte sie zwischenzeitlich gefüllt sein, nicht blind überschreiben: Manuelle Migration in die neuen Firestore-Sammlungen notwendig.

## Schutz der alten App

Beim Umstieg unbedingt den alten **Admin-Sync-Button** und die GitHub-Token-Eingabe entfernen. Falls in der Vergangenheit ein GitHub-Token auf untrusted Geräten verwendet wurde, widerrufen/rotieren.
