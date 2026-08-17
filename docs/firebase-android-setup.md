# Firebase Android Setup

Cette note correspond a la configuration Android/Firebase de `Smith-Heffa Paygate` a partir des empreintes Google Play visibles le 17 aout 2026.

Important:

- Les empreintes Google Play servent a Firebase / Google Sign-In / OAuth.
- Le fichier `/.well-known/assetlinks.json` pour Android App Links doit utiliser le certificat de deploiement qui signe effectivement l'application installable.
- Dans ce repo, `assetlinks.json` utilise le SHA-256 `6C:89:D3:EE:4A:9F:6C:71:96:43:EF:66:67:24:EE:37:75:8C:72:27:90:89:F7:50:BA:AA:26:C6:34:7B:E8:8A`.

## Application cible

- Firebase project: `smith-heffa-paygate-mobile`
- Android package: `com.smithheffa.paygate`
- Fichier Android actuel: [android/app/google-services.json](/Users/user/Desktop/Smith-Heffa-Paygate/android/app/google-services.json)

## Empreintes Google Play a enregistrer dans Firebase

### Cle classique

- SHA-256: `DC:0A:78:29:63:0F:3A:73:ED:4F:F3:F0:FA:A5:73:1C:58:3E:6E:E4:C6:43:18:8F:12:46:8B:D5:99:73:8D:9F`
- SHA-1: `45:FC:AA:F9:88:2D:86:0A:73:75:14:75:E2:9E:DB:9A:65:1B:66:90`

### Cle post-quantique

- SHA-256: `E2:76:8F:2C:58:67:4E:DA:10:D9:4B:69:38:8E:05:76:1F:91:51:7E:3A:84:36:D7:E5:EB:D9:A0:25:31:B0:B5`
- SHA-1: `DB:CB:9D:71:A7:D3:1A:72:83:B4:38:0F:0B:87:97:DF:74:93:F9:3B`

## Etat actuel du repo

- Le projet Android est deja branche au bon package `com.smithheffa.paygate`.
- Le projet Firebase est deja reference dans `google-services.json`.
- Le `google-services.json` courant contient encore un ancien hash Android:
  - `f2172a295e0f348046e652b213013507d2581d4e`

## Action a faire dans Firebase Console

1. Ouvrir `Firebase Console` pour le projet `smith-heffa-paygate-mobile`.
2. Aller dans `Project settings` puis dans l'application Android `com.smithheffa.paygate`.
3. Ajouter au minimum les empreintes de la cle classique:
   - `SHA-1` = `45:FC:AA:F9:88:2D:86:0A:73:75:14:75:E2:9E:DB:9A:65:1B:66:90`
   - `SHA-256` = `DC:0A:78:29:63:0F:3A:73:ED:4F:F3:F0:FA:A5:73:1C:58:3E:6E:E4:C6:43:18:8F:12:46:8B:D5:99:73:8D:9F`
4. Si Firebase accepte plusieurs empreintes de signature Play, ajouter aussi la cle post-quantique:
   - `SHA-1` = `DB:CB:9D:71:A7:D3:1A:72:83:B4:38:0F:0B:87:97:DF:74:93:F9:3B`
   - `SHA-256` = `E2:76:8F:2C:58:67:4E:DA:10:D9:4B:69:38:8E:05:76:1F:91:51:7E:3A:84:36:D7:E5:EB:D9:A0:25:31:B0:B5`
5. Telecharger ensuite le nouveau `google-services.json`.
6. Remplacer [android/app/google-services.json](/Users/user/Desktop/Smith-Heffa-Paygate/android/app/google-services.json) par celui telecharge.
7. Rebuild Android pour que les nouveaux certificats OAuth/Google Sign-In soient pris en compte.

## Pourquoi je ne modifie pas `google-services.json` a la main

Le champ `certificate_hash` est genere par Firebase. Le changer localement ne met pas a jour la config OAuth cote Google et ne suffit pas pour Google Sign-In, Dynamic Links, App Check ou certains flows Firebase.
