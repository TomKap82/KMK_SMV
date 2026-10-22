# KMK SMV – Update (Firebase, Oktober 2026)

## Was ist neu?
- Ideen ohne Kategorie und ohne Filter (alte Ideen bleiben erhalten und sichtbar).
- Administratoren können Ideen und Aktionen über „Löschen (Admin)“ nach Bestätigung löschen. Die App löscht zuerst die zugehörigen Stimmen/Helfereinträge, anschließend das Hauptdokument.
- „Ankündigungen“ als dritter Tab: Datum und Freitext, nur durch Admin erstellbar und löschbar.
- Pro Nutzer sind mehrere Helferaufgaben innerhalb einer Aktion möglich. Die Registrierung bleibt pro Aufgabenbereich eindeutig. Alte Helfereinträge mit UID als Dokument-ID werden weiterhin angezeigt und können vom jeweiligen Nutzer entfernt werden.

## Wichtig vor dem Einspielen
1. **GitHub-Backup:** Repository `TomKap82/KMK_SMV` > Code > Download ZIP. Änderungen in den Firebase-Daten werden dadurch NICHT gesichert.
2. **Firestore-Backup:** Bestehende wichtige Inhalte vor Tests separat dokumentieren/exportieren. Ein Löschen ist endgültig.
3. Verwende weiterhin deine **funktionierende `firebase-config.js`** aus dem Repository. Sie NICHT durch eine leere Beispieldatei ersetzen.
4. `logo.png`, `icon-192.png`, `icon-512.png`, Firebase Auth und das Admin-Dokument `admins/<UID>` unverändert lassen.

## A – ZUERST Firestore-Regeln ersetzen
1. Firebase Console > Projekt KMKSMV > Firestore Database > **Regeln**.
2. Bestehende Regeln extern sichern.
3. Kompletten Inhalt von `firestore.rules` aus diesem Paket einfügen und **Veröffentlichen**.
4. Wenn das Veröffentlichen einen Syntaxfehler meldet, **nicht** die neue App hochladen; Fehlermeldung prüfen und beheben.

## B – Dateien in GitHub ersetzen
1. Repository https://github.com/TomKap82/KMK_SMV öffnen.
2. Im **Hauptverzeichnis** (neben `logo.png`) `Forum.html`, `app.js`, `sw.js`, `manifest.json` durch die vier gleichnamigen Dateien aus diesem Paket ersetzen. `firestore.rules` kannst du ebenfalls im Repository aktualisieren; entscheidend ist aber das Veröffentlichen in der Firebase-Konsole.
3. In GitHub im Tab **Code** > **Add file** > **Upload files** hochladen; Dateien direkt ins Hauptverzeichnis legen; **Commit changes**.
4. `firebase-config.js` **nicht überschreiben**. Bestehende Bilddateien bleiben. Alte `data.json` wird nicht gebraucht, kann als Archiv bestehen bleiben.
5. Deployment von GitHub Pages abwarten, App unter https://tomkap82.github.io/KMK_SMV/Forum.html öffnen. Falls alte Oberfläche erscheint, hart neu laden oder PWA Cache/Service Worker aktualisieren.

## C – Funktionsprüfung
1. Ohne Admin: neue Idee erstellen; sie muss auf zwei Geräten sichtbar sein. Keine Kategorien oder Filter mehr.
2. Abstimmen von zwei Geräten: separate Stimmen sichtbar.
3. Als Admin einloggen: Lösch-Buttons bei Ideen und Aktionen sichtbar; Ankündigung erstellen.
4. Testaktion mit `Aufbau (3), Verkauf (2)` anlegen. Mit demselben Browser/Nutzer erst bei Aufbau, dann bei Verkauf eintragen. Beide Einträge erscheinen. Eintrag in nur einem Bereich wieder entfernen.
5. Testidee und Testaktion als Admin nach Bestätigung löschen. Firestore > Daten kontrollieren, dass auch jeweilige `votes`/`helpers` entfernt sind.
6. Ankündigung mit Datum und Freitext erstellen, auf zweitem Gerät prüfen, anschließend als Admin löschen.

## Einschränkungen und Sicherheit
- Eine **anonyme** Firebase-Anmeldung verhindert nicht die Erstellung neuer Identitäten durch Browserwechsel oder Löschen lokaler Daten. Mehrfachabstimmungen über verschiedene Identitäten bleiben möglich.
- Die Anzahl freier Helferplätze wird in dieser Version **nur durch die App-Oberfläche** geprüft, nicht atomar durch eine serverseitige Transaktion mit durchgesetztem Zähler. Bei gleichzeitigen Anmeldungen sind Überbuchungen möglich.
- Firestore-Regeln erlauben das öffentliche Lesen; keine sensiblen Schülernamen/Klassendaten eintragen, bevor Datenschutz und schulische Freigaben geklärt sind.
- Administrator-Löschen erfolgt in mehreren Firestore-Schreibvorgängen; bei Netzwerkabbruch kann ein Teil bereits gelöscht sein. Dann erneut prüfen und Reste über die Firebase-Konsole entfernen.
- Die Löschtaste ist nur Admins sichtbar; Berechtigungen werden auch durch Firestore-Regeln geprüft.
- „Kategorie“ wird bei neuen Ideen nicht mehr gespeichert. Ältere Dokumente mit Kategorie bleiben dennoch lesbar. Keine Datenmigration notwendig.

## Fehlerhilfe
- `permission-denied`: aktuelle Regeln in Firebase wirklich veröffentlichen; Admin UID prüfen.
- Alte Ansicht: `Strg+Shift+R` bzw. aktualisierten Service Worker verwenden.
- `Verbinde mit Firebase …`: Entwicklerwerkzeuge > Konsole und Netzwerk öffnen; prüfen, dass vorhandene `firebase-config.js` unverändert geblieben ist.
- Neue Änderungen erscheinen nicht: Prüfen, ob GitHub Pages die aktuelle Version von `Forum.html` und `app.js` bereitstellt.
