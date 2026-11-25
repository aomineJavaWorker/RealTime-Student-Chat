# Student Chat personas datu un sīkdatņu audits

## 1. Projekta apraksts

**2026. gada 25. novembris.** Student Chat ļauj studentam reģistrēties izvēlētajā kursā, sarakstīties ar kursa dalībniekiem un atjaunot piekļuvi kontam ar apstiprinātu e-pasta adresi.

Sākotnējā audita pamatā ir lokālās `main` versijas `d002378` [modeļi](../src/models), [maršruti](../src/routes), [servisi](../src/services), [servera un Socket.IO iestatījumi](../server.js) un [pārlūka kods](../public/js). Lokālajā pārbaudē darbojās īstais lietotnes serveris un atsevišķa MongoDB 8.0.12 testa instance. Izmantojām izdomātus kontus. [Testa pasta aizstājējs](../tests/support/reset-server.cjs) nodeva kodus testa procesam. Vēstules uz ārējām pastkastēm nesūtījām.

6.1. posmā atkārtoti pārbaudījām pieteikšanos un tēmas izvēli lokālajā darba versijā. Tās rezultāti ir 5. un 6. nodaļā. Sākotnējā auditā pārlūkā pārbaudījām lokālo vietni un publicētās vietnes publiskās lapas. Atlas produkcijas ierakstus, rezerves kopijas un pakalpojumu sniedzēju kontu paneļus nepārbaudījām. Pārbaudes robežas katrai videi norādītas 5. un 7. nodaļā.

## 2. Apstrādātie personas dati

Tabulā **serveris** nozīmē Student Chat lietotni Render vidē, **datubāze** nozīmē projektā norādīto MongoDB Atlas. Šīs infrastruktūras piekļuves tiesības ir jāapstiprina administratoram. Lietotnes administrators ar attiecīgām piekļuves tiesībām var piekļūt arī datiem, kurus citi studenti saskarnē neredz.

| Personas dati | Datu ieguves avots | Apstrādes nolūks | Glabāšanas vieta | Glabāšanas ilgums | Datu saņēmēji |
|---|---|---|---|---|---|
| Lietotājvārds, tā normalizētā forma, lietotāja ID, izvēlētais kurss | Students ievada vārdu un izvēlas kursu. Serveris izveido meklēšanas atslēgu un ID | Atrast kontu, noteikt tā kursu, parādīt autoru un sarakstes partnerus | Datubāze, `users` | Kontam nav automātiskas dzēšanas | Serveris, datubāze, pats students. Kursabiedri redz vārdu un var saņemt ID sava kursa dalībnieku sarakstā |
| Konta izveides un pēdējo izmaiņu laiks (`createdAt`, `updatedAt`) | Mongoose, veidojot un mainot ierakstu | Konta informācija un izmaiņu uzskaite | `users` | Kopā ar kontu | Serveris, datubāze. Izveides datums pieejams pašam studentam |
| E-pasts, apstiprinājuma statuss, jaunā adrese, kas gaida apstiprināšanu, adreses izmaiņu versija | Reģistrācijas vai profila forma, apstiprinājuma rezultāts | Pārbaudīt pastkastes pieejamību, droši nomainīt adresi, atrast kontu paroles atjaunošanai | `users.email`, `emailVerified`, `pendingEmail`, `emailRevision` | Pašreizējie dati līdz aizstāšanai vai konta dzēšanai. Gaidīšanas termiņš aprakstīts 4. nodaļā | Serveris, datubāze, pats students. Nosūtīšanai izvēlēto adresi saņem Brevo un pasta piegādes dalībnieki. Kursabiedriem adreses un statusu nerāda |
| Ievadītā parole un tās atkārtojums attiecīgajās formās, paroles jaucējvērtība | Students ievada paroli, serveris aprēķina bcrypt jaucējvērtību ar izmaksu parametru 12 | Pieteikšanās, paroles maiņa, adreses maiņas apstiprināšana | Ievades lauki un pieprasījuma apstrādes atmiņa. Datubāzē `users.passwordHash` | Ievadītā parole vajadzīga darbības laikā. Jaucējvērtība līdz nomaiņai vai konta dzēšanai | Pārlūks un serveris. Datubāze saņem jaucējvērtību |
| Kursa ziņas ID, teksts, autors, kurss, izveides un atjaunināšanas laiks, rediģēšanas laiks | Autors un lietotne | Piegādāt ziņu kursam, parādīt vēsturi un rediģēšanas atzīmi | `messages` | Bez automātiska termiņa. Autors var dzēst savu kursa ziņu | Serveris, datubāze, attiecīgā kursa dalībnieki |
| Norāde uz ziņu, uz kuru atbildēts, reakcijas veids un reaģētāja ID | Atbildes autors vai reakcijas pievienotājs | Parādīt sarunas kontekstu un reakcijas | `messages.replyTo`, `messages.reactions` | Kopā ar attiecīgo ziņu. Reakciju var mainīt vai noņemt | Serveris, datubāze, attiecīgā kursa dalībnieki |
| Privātās ziņas ID, teksts, sūtītāja un saņēmēja ID, kurss, izveides un atjaunināšanas laiks | Sūtītājs izvēlas kursabiedru un raksta ziņu, sistēma pievieno metadatus | Piegādāt privāto ziņu, attēlot sarunas un to vēsturi | `directmessages` | Bez automātiska termiņa. Privātās ziņas dzēšanas vai rediģēšanas maršruta nav | Serveris, datubāze, abi sarakstes dalībnieki. Pārējais kurss šo sarunu nesaņem |
| Parakstīts sesijas identifikators, servera sesijas ID, lietotāja ID, vārds, kurss, sesijas versija un termiņš | Serveris pēc reģistrācijas vai pieteikšanās | Atpazīt studentu nākamajā pieprasījumā un Socket.IO savienojumā, atsaukt novecojušu piekļuvi | Pārlūkā sīkdatne. Datubāzē `sessions` ar serializētu sesiju un `expires`. Konta versija ir `users.sessionVersion` | Sīkdatne ir spēkā pārlūka sesijas laikā vai pēc lietotāja izvēles līdz 7 dienām. Servera sesijai piemēro 4. nodaļas kritērijus. Konta versija saglabājas ar kontu | Paša pārlūks saņem parakstīto ID, serveris un datubāze apstrādā sesijas datus |
| E-pasta koda aizsargātie dati, lietotāja ID, nejauša vērtība, HMAC pārbaudes vērtība, adreses versija, kļūdu skaits, izmantošanas un piegādes kļūdas atzīmes, termiņi | Serveris ģenerē kodu un pārbauda lietotāja ievadi | Pārbaudīt adresi, ierobežot atkārtotus sūtījumus un minēšanas mēģinājumus | `emailverifications`. Pats kods ir vēstulē un īslaicīgi apstrādes atmiņā | Kods līdz 10 minūtēm, ierakstam TTL. Pasta kopijām citi termiņi | Serveris un datubāze apstrādā pārbaudes datus. Brevo, saņēmēja pasta pakalpojums un adresāts saņem vēstuli ar kodu |
| Paroles atjaunošanas adreses HMAC, lietotāja ID, ja tāds atrasts, ar pašreizējo paroli saistīta pārbaudes vērtība, nejauša vērtība, koda vai vienreizējas atļaujas HMAC, mēģinājumi un termiņi | Ievadītā adrese, servera ģenerēts kods, koda pārbaude | Dot vienreizēju atļauju nomainīt paroli. Vienādi atbildēt arī par nezināmu vai neapstiprinātu adresi | `passwordresets`. Pati atļauja ir atbildē un atvērtās lapas JavaScript atmiņā | Kodam līdz 10 minūtēm, pēc pareiza koda atļaujai jaunas 10 minūtes. Sk. 4. nodaļu | Serveris, datubāze. Atļauju saņem pieprasītāja pārlūks. Tikai atbilstoša apstiprināta konta gadījumā pasta piegādes dalībnieki saņem kodu |
| Pieprasījuma IP adrese, no IP vai adreses atvasināta loga atslēga, darbībai atbilstošs skaitītājs | Tīkla pieprasījums un ievadītā adrese. Ražošanas režīmā Express uzticas vienam starpniekservera posmam | Ierobežot pārmērīgu kodu sūtīšanu un pārbaudi | IP ir pieprasījuma apstrādē. `verificationrequestlimits` satur HMAC atslēgu, skaitu un `expiresAt` | Fiksēts 10 minūšu logs un TTL. Render lietotnes žurnāliem ir 7 dienu termiņš | Render un serveris redz savienojuma datus. Datubāze šajā kolekcijā saņem atvasinātās atslēgas |
| Savienojuma ID, lietotāja ID, vārds, kurss, tiešsaistes un rakstīšanas statuss | Socket.IO savienojums un kursa ziņas ievades notikumi | Parādīt, kurš ir tiešsaistē un kurš pašlaik raksta | Servera operatīvajā atmiņā `onlineUsers` un `typingSockets`. Atsevišķi savienojuma notikumi nonāk žurnālos | Līdz statusa beigām, atvienošanai vai procesa beigām. Žurnāliem ir atsevišķs termiņš | Serveris. Attiecīgais kurss saņem lietotāja ID un vārdu statusa sarakstā |
| Savienojuma metadati un vēstules piegādes dati | Pārlūks, serveris un pakalpojumu sniedzēji | Ielādēt lapu, noformējumu un skriptus, piegādāt vēstules, diagnosticēt kļūdas | Render žurnāli, CDN infrastruktūra, Brevo žurnāli | Render lietotnes žurnāliem 7 dienas, Brevo žurnāliem viens mēnesis. Koda 10 minūšu termiņš neizdzēš vēstuli no pastkastes | Saņēmēji pa datu plūsmām aprakstīti 7. nodaļā |

**Ko var saistīt ar cilvēku?** E-pasts, lietotājvārds, konkrēta konta kurss, sarakste un aktivitātes ir personas dati. Lietotāja ID, sesijas ID un ar atslēgu aprēķināts HMAC ir netieši identifikatori. Ja tos var sasaistīt ar personu vai tās darbību, arī pseidonimizēti dati ir aizsargājami. Paroles jaucējvērtība ir ar konkrētu kontu saistīti piekļuves dati. Kursa numurs un nosaukums kolekcijā `courses` ir kopīgs katalogs. Arī atsevišķa tēmas vērtība `light` vai `dark` pati par sevi cilvēku neidentificē.

## 3. Personas datu ieguves avoti

- **No paša studenta.** Jaunam kontam vajadzīgs lietotājvārds, e-pasts, parole un kurss. Ja šo datu trūkst, reģistrācija neizdodas. Agrākiem kontiem var nebūt e-pasta. Pieteikšanās izmanto vārdu, kursu un paroli. Paroles atjaunošanai pa e-pastu vajadzīga apstiprināta adrese.
- **No sarakstes dalībniekiem.** Autors ievada ziņu un izvēlas privātās ziņas adresātu. Citi dalībnieki var atbildēt, reaģēt vai savā tekstā pieminēt citu cilvēku. Brīvā tekstā lietotājs var atklāt arī sensitīvu informāciju, piemēram, par veselību.
- **No lietotnes un savienojuma.** Identifikatorus, laika atzīmes, pārbaudes vērtības, pieprasījumu skaitu un tiešsaistes statusu izveido sistēma. IP rodas tīkla savienojumā. Tēmas sākotnējo izskatu nosaka pārlūka iestatījums. Izvēlēto gaišo vai tumšo tēmu lietotne saglabā cilnes sesijas krātuvē. Ilgākai saglabāšanai vietnes lokālajā krātuvē students izdara atsevišķu izvēli.

## 4. Personas datu glabāšanas ilgums

Izolētajā datubāzē pēc testa darbībām nolasījām kolekciju nosaukumus un indeksu aprakstus. Bija visas astoņas 2. nodaļā minētās kolekcijas. Četrām bija TTL indekss ar `expireAfterSeconds: 0`. Tas nozīmē, ka ierakstu drīkst dzēst, kad pagājis attiecīgajā laukā norādītais laiks. Dzēšanu veic fona process, parasti ar pārbaudēm ik pēc 60 sekundēm. Slodzes dēļ ieraksts var saglabāties ilgāk. Precīzu fiziskās dzēšanas brīdi nemērījām. [MongoDB skaidrojums par TTL](https://www.mongodb.com/docs/manual/core/index-ttl/)

| Dati | Faktiskā darbība pārbaudītajā versijā |
|---|---|
| Konts un sākotnēji norādītais e-pasts | `users` nav TTL, konta pašapkalpošanās dzēšanas vai ieplānotas neaktīvo kontu tīrīšanas. Sākotnējais neapstiprinātais e-pasts jau ir laukā `email`. `updatedAt` ir ieraksta izmaiņu laiks. Tas nav drošs pēdējās pieteikšanās rādītājs. |
| Profila jaunā adrese | `pendingEmail` nav termiņa. To var pārrakstīt ar nākamo adreses maiņu. Pēc veiksmīgas apstiprināšanas tā kļūst par `email` un gaidošo lauku izņem. Līdz tam iepriekšējā apstiprinātā adrese paliek spēkā. Koda izbeigšanās gaidošo adresi neizņem. |
| Kursa ziņas, atbildes, reakcijas | `messages` nav TTL. Autors var mainīt vai dzēst savu ziņu. Rediģējot saglabā jauno tekstu un `editedAt`. Cita autora atbilde ir patstāvīgs ieraksts ar atsauci. Sākotnējās ziņas dzēšana neizdzēš šo atbildi. |
| Privātās ziņas | `directmessages` nav TTL vai automātiskas dzēšanas. Lietotne saglabā tekstu un abas sarunas puses. `updatedAt` ir tehniska laika atzīme. Privātajā čatā nav kursa čata rediģēšanas, atbilžu un reakciju funkciju. |
| Sesijas | Pēc reģistrācijas vai parastas pieteikšanās pārlūks saņem sesijas sīkdatni. Tikai pieteikšanās formā atzīmējot “Atcerēties mani”, pārlūks saņem sīkdatni ar septiņu dienu termiņu. Serveris nesaņem paziņojumu par pārlūka aizvēršanu. `connect-mongo` laukam `expires` izmanto sīkdatnes termiņu vai, sesijas sīkdatnes gadījumā, septiņu dienu servera termiņu. Laukam ir TTL indekss. Turpmāka sesijas izmantošana var atjaunināt servera termiņu. Pārlūkam nav ieslēgta sīkdatnes atkārtota izdošana katrā pieprasījumā. Izrakstīšanās dzēš šo servera sesiju un liek pārlūkam dzēst sīkdatni. Paroles atjaunošana palielina konta sesijas versiju un atvieno vecās versijas ligzdas. Nederīgie sesiju dokumenti var fiziski saglabāties līdz pieprasījuma pārbaudei vai TTL. Vecam kontam bez versijas izmanto 0. |
| E-pasta apstiprināšana | `emailverifications.expiresAt` ir 10 minūtes pēc izdošanas. Vienam kontam ir pēdējā koda ieraksts. Jaunu kodu parasti var izsniegt pēc 60 sekundēm. Piecas kļūdas bloķē kodu. Pareizu kodu atzīmē kā izmantotu. Izmantošana, aizstāšana vai adreses versijas maiņa var beigt derīgumu agrāk. Izmantotais ieraksts var palikt līdz TTL. |
| Atjaunošanas kods | `passwordresets.expiresAt` sākotnēji ir 10 minūtes pēc izdošanas. Atkārtota izsniegšana iespējama pēc 60 sekundēm, piecas kļūdas bloķē kodu. Arī derīgi noformētai, bet kontam neatbilstošai adresei var rasties aizsargāts pagaidu ieraksts. Pareiza koda pārbaude izņem `codeDigest`. |
| Vienreizējā atļauja mainīt paroli | Pēc koda pārbaudes tas pats dokuments iegūst `tokenDigest` un **jaunu** 10 minūšu termiņu. Jauns koda pieprasījums pēc aiztures aizstāj iepriekšējo atļauju. Izmantojot atļauju, serveris izņem tās HMAC. Pārējie dati paliek līdz aizstāšanai vai TTL. Pārlūkā atļauja ir lapas atmiņā līdz pabeigšanai, darbības sākšanai no jauna vai lapas aizvēršanai. |
| Pieprasījumu ierobežojumi | `verificationrequestlimits.expiresAt` norāda kārtējā fiksētā 10 minūšu loga beigas. Pieprasījumam tieši pirms robežas atlikušais laiks ir īsāks. Atslēga ietver darbību, identifikatoru un logu. Atjaunošanai ir atsevišķi limiti pēc IP un normalizētās adreses atvasinājuma. |
| Tiešsaistes un rakstīšanas statuss | Atvienošanās izņem ligzdu no abām atmiņas struktūrām. Kursa ziņas ievades klients pēc aptuveni 1,2 sekunžu pauzes sūta rakstīšanas beigu notikumu. To sūta arī, atstājot ievades lauku. Atsevišķa statusu vēsture datubāzē netiek veidota. |

**Administratora apstiprinātā kārtība.** Kontus glabā, kamēr students izmanto pakalpojumu. Reizi 12 mēnešos administrators manuāli izvērtē neaktīvo kontu turpmākas glabāšanas nepieciešamību. Kursa un privātās ziņas glabā, kamēr nepieciešama sarakstes vēsture. Lietotājs var lūgt administratoram dzēst datus, ja tam ir pamats. Gaidošajai adresei piemēro iepriekš tabulā aprakstīto kārtību.

## 5. Sīkdatņu pārbaude

### Sākotnējā pārbaude pirms 6.1. posma

Izmantojām Chrome 158.0.8127.38, Playwright 1.56.1 un Chrome DevTools protokolu. Katrai videi atvērām jaunu pārlūka kontekstu bez iepriekšējas pieteikšanās. Nolasījām konteksta sīkdatnes, vietnes Local Storage un Session Storage atslēgas un IndexedDB datubāzu nosaukumus. Tīkla notikumos pārbaudījām pieprasījumu saimniekdatorus, nosūtītās sīkdatnes un atbilžu `Set-Cookie` galvenes, arī CDN pieprasījumiem. Ziņojumā saglabāti tikai nosaukumi un atribūti. [Lokālās pārbaudes mērījumu izraksts](privacy-audit/parluka-merijumi.png)

| Scenārijs | Lokālais HTTP serveris | Publicētā HTTPS vietne Render |
|---|---|---|
| 1. Pirmais apmeklējums, `index.html` | Sīkdatņu, krātuvju ierakstu un IndexedDB datubāzu nav | Tādi paši rezultāti |
| 2. Reģistrācija, `register.html` | Veidlapas atvēršana neveido sīkdatni. Pēc sekmīgas iesniegšanas serveris atbildēja ar 201 un uzstādīja `studentChatSession` | Atvērta veidlapa. Jaunu sīkdatņu nav. Datus neiesniedzām |
| 3. E-pasta apstiprināšana, `verify-email.html` | Atvērām lapu ar izveidoto sesiju un sekmīgi apstiprinājām testa kodu. Izmantoja esošo sīkdatni | Bez sesijas lietotne novirzīja uz sākumlapu |
| 4. Pieteikšanās, `index.html` | Pēc izrakstīšanās pieteicāmies no jauna. Atbilde 200 un jauna `Set-Cookie` galvene | Pārbaudīta pieteikšanās lapa. Autentificēta sesija nav izmērīta |
| 5. Kursa un privātais čats, `chat.html` | Caur čata saskarni nosūtījām kursa ziņu un privātu ziņu citam testa dalībniekam. Abos gadījumos serveris atbildēja ar 201. Papildu sīkdatņu vai krātuves ierakstu nebija | Atverot čata adresi bez pieteikšanās, lietotne novirzīja uz sākumlapu |
| 6. Tēmas pārslēgšana | Pārslēdzām gaišo tēmu uz tumšo un atpakaļ. Abas izvēles izmantoja vienu lokālās krātuves atslēgu. Pēdējā izvēle saglabājās pēc pārlādes | Sākumlapā izvēlējāmies tumšo tēmu. Tā saglabājās, pārejot uz pārējām lapām |
| 7. Paroles atjaunošana, `forgot-password.html` | Pēc izrakstīšanās pieprasījām kodu, pārbaudījām to un saglabājām jaunu paroli. Atbildes 202, 200 un 200. Vienreizējā atļauja neparādījās pārbaudītajās krātuvēs. Jauna sesijas sīkdatne netika izdota | Atvērta atjaunošanas forma. Atjaunošanas pieprasījumu nesūtījām |
| 8. Izrakstīšanās | Atbildes galvene noteica sīkdatnei pagātnes termiņu, un tā pazuda no pārlūka. Tēmas izvēle saglabājās | Bez autentificētas testa sesijas šo darbību nepārbaudījām |

Sākotnējā auditā visās novērotajās lapās Session Storage un IndexedDB bija tukšas. Pārbaudītajos scenārijos tīkla pieprasījumi bija tikai uz pašu vietni un `cdn.jsdelivr.net`. Trešās puses sīkdatņu nosūtīšanu vai uzstādīšanu nenovērojām. Pārlūks lietotnes sesijas sīkdatni nosūtīja lokālās vietnes pieprasījumos.

### 6.1. posma atkārtotā pārbaude

Jauno funkcionalitāti pārbaudījām lokāli ar Playwright un Chrome atsevišķā profilā, izmantojot izolētu MongoDB un testa pasta aizstājēju. Pārbaudījām pārlūka sīkdatnes, abu tīmekļa krātuvju saturu un reģistrācijas un pieteikšanās atbilžu `Set-Cookie` atribūtus. Chrome pilnībā aizvērām un palaidām ar to pašu testa profilu. Šī darba versija Render vidē vēl nav pārbaudīta.

| Darbība | Novērojums lokālajā pārlūkā |
|---|---|
| Pirmais apmeklējums | Autentifikācijas sīkdatnes nebija. Local Storage un Session Storage bija tukšas. |
| Jauna konta reģistrācija un automātiska pieteikšanās | `studentChatSession` bez `Expires` un `Max-Age`. Pēc pārlūka pārstartēšanas sīkdatnes nebija. |
| Pieteikšanās bez atzīmes | Tā pati sesijas sīkdatne. Pēc pārlūka pārstartēšanas varēja atkal pieteikties. |
| Pieteikšanās ar atzīmi “Atcerēties mani” | `Expires` bija septiņas dienas pēc izdošanas. Pēc pārlūka pārstartēšanas sākumlapa aizveda uz čatu. |
| Izrakstīšanās | Pārlūks izņēma autentifikācijas sīkdatni. |

Ja pārlūks atjauno iepriekšējo sesiju, tas var atjaunot arī sesijas sīkdatnes. Koplietotā ierīcē drošai darba pabeigšanai izmanto izrakstīšanos.

| Nosaukums | Nolūks | Kategorija | Glabāšanas veids | Glabāšanas ilgums | Pirmā vai trešā puse | Piekrišana |
|---|---|---|---|---|---|---|
| `studentChatSession` | Piekļuve kontam un čatam | Tehniskā autentifikācijas sīkdatne | Sesijas HTTP sīkdatne | Līdz pārlūka sesijas beigām vai izrakstīšanās brīdim | Pirmā puse | Nepieciešama lietotāja pieprasītajai autentifikācijai |
| `studentChatSession` ar atcerēšanos | Palikt pieteiktam arī nākamajā apmeklējumā | Funkcionālā autentifikācijas sīkdatne | Pastāvīga HTTP sīkdatne ar `Expires` | 7 dienas no izdošanas vai līdz izrakstīšanās brīdim | Pirmā puse | Lietotājs pirms pieteikšanās pats atzīmē izvēli |

| Vide | Domēns | Ceļš | HttpOnly | Secure | SameSite |
|---|---|---|---|---|---|
| Lokāli, 6.1. posmā, abos režīmos | `127.0.0.1`, tikai konkrētajam saimniekdatoram, bez `Domain` atribūta | `/` | Jā | Nē | `Lax` |
| Render, anonīma pārlūkošana | `realtime-student-chat.onrender.com` | — | — | — | — |

Render anonīmajās atbildēs sīkdatne netika izdota. Saskaņā ar kodu izsniegšanas brīdī paredzēti `HttpOnly`, `SameSite=Lax`, ceļš `/` un `Secure`, ja `NODE_ENV=production` un Express atpazīst HTTPS aiz starpniekservera.

**Kā pabeigt izvietotās versijas pārbaudi.** Izmanto Render testa izvietojumu ar izolētu datubāzi un izdomātu kontu. Atver jaunu privāto logu un nospied F12. Sadaļā **Application → Storage** pārbaudi Cookies, Local Storage, Session Storage un IndexedDB. Sadaļā **Network** ieslēdz **Preserve log**, piesakies un izvēlies pieteikšanās pieprasījumu. Salīdzini **Cookies** un **Headers → Response Headers → Set-Cookie** ar Application redzamo. Pēc izrakstīšanās pārbaudi dzēšanas galveni un sīkdatnes pazušanu. Atzīmē arī CDN un citu domēnu pieprasījumus. Pieraksti sīkdatnes nosaukumu, termiņu un atribūtus. Pirms attēla saglabāšanas aizsedz vērtību kolonnu un personas datus. Pilns tīkla žurnāls var saturēt autentifikācijas datus.

## 6. Lokālās krātuves izmantošana

Sākotnējā auditā Render vietnē tēmas poga saglabāja vienkāršu teksta vērtību bez termiņa. Attēlā redzama iepriekšējā versija. [Render vietnes lokālā krātuve pārlūkā Chrome](privacy-audit/render-lokala-kratuve.png)

| Nosaukums | Nolūks | Kategorija | Glabāšanas veids | Glabāšanas ilgums | Pirmā vai trešā puse | Piekrišana |
|---|---|---|---|---|---|---|
| `student-chat-theme` | Saglabāt izvēlēto tēmu, pārejot starp lapām šajā cilnē | Saskarnes pielāgošana | `sessionStorage`, vērtība `light` vai `dark` | Līdz cilnes sesijas beigām vai izvēles atiestatīšanai | Pirmā puse | Students pats izvēlas tēmu šai cilnei |
| `student-chat-theme` | Atcerēties tēmu arī citās cilnēs un nākamajos apmeklējumos | Saskarnes pielāgošana | `localStorage`, tēma un termiņš `expiresAt` | 30 dienas no izvēles atcerēties, līdz atzīmes noņemšanai vai atiestatīšanai | Pirmā puse | Atsevišķa izvēle “Atcerēties tēmu 30 dienas” |

Visās piecās lapās poga “Tēmas iestatījumi” piedāvā ierīces, gaišo un tumšo tēmu. Sākotnēji lietotne izmanto ierīces tēmu un neveido ierakstu. Atzīmējot atcerēšanos, tā izņem pagaidu ierakstu. Noņemot atzīmi, tā izdzēš ilglaicīgo ierakstu un patur izvēli pašreizējā cilnē. Izvēle “Sistēmas tēma” izņem abus ierakstus. Tēmas izvēle paliek pārlūkā. Sīkdatņu atribūti `HttpOnly`, `Secure` un `SameSite` uz šīm krātuvēm neattiecas. [Tēmas iestatījumu kods](../public/js/theme.js)

**6.1. posma pārlūka pārbaude.** Pāreja no pieteikšanās uz reģistrācijas lapu tajā pašā cilnē saglabāja pagaidu tēmu. Neatkarīgi atvērta jauna cilne izmantoja ierīces tēmu. Ieslēdzot atcerēšanos, otrā cilne saņēma izvēli, un pēc Chrome pārstartēšanas saglabātā tēma joprojām darbojās. Tēmas maiņa nepagarināja sākotnējo 30 dienu termiņu. Pārbaudījām atzīmes noņemšanu, atiestatīšanu čatā, dialogu 320 pikseļu platumā un aizvēršanu ar Escape.

**Termiņa pārbaude.** Salīdzinājām saglabāto termiņu ar izvēles brīdi. Pēc tam testa profilā ievietojām ierakstu ar pagājušu termiņu un ierakstu ar dažu sekunžu termiņu. Pirmais pazuda pēc pārlādes, otrais arī atvērtā lapā. Iepriekšējās versijas ieraksts bez termiņa pēc pārlādes tika izņemts. Vietne nevar iztīrīt aizvērta pārlūka lokālo krātuvi. Ja termiņš pagājis prombūtnē, ierakstu izņem nākamajā apmeklējumā pirms tēmas piemērošanas.

## 7. Trešo pušu pakalpojumi

| Saņēmējs | Kādi dati tam nonāk un kāpēc | Administratora apstiprinātie iestatījumi un pārbaudes robežas |
|---|---|---|
| Render | Pārlūks savienojas ar vietni caur HTTPS. Izvietošanas infrastruktūra apstrādā klienta IP, HTTP un reāllaika savienojumu datus. Lietotnes process apstrādā arī formas un ziņas. Servera konsolē, pieslēdzoties un atvienojoties, reģistrē ligzdas ID, bet, pievienojoties kursam, lietotājvārdu un kursa numuru. | Hobby darbvieta. Serveris Frankfurtē, Vācijā. Lietotnes žurnālus glabā 7 dienas. |
| MongoDB Atlas | Student Chat serveris nosūta 2. nodaļā aprakstītos datubāzes laukus savā datubāzes savienojumā. Atlas redz savienojošā servera tīkla adresi. Pieprasījumu skaitītāju kolekcijā klienta IP atklātā veidā neraksta. | Free plāns, AWS Stokholmas reģions Zviedrijā (eu-north-1). Repliku kopā ir trīs mezgli. Atlas rezerves kopijas ir izslēgtas (Backups Inactive). |
| Brevo un adresāta pasta pakalpojums | Serveris ar HTTPS nosūta Brevo sūtītāja adresi un nosaukumu, adresāta e-pastu, tematu un teksta un HTML saturu ar pašu kodu. Adresāta pasta sistēma saņem vēstuli. API pieprasījumu veic serveris, un tā saturā nav apmeklētāja IP, čata ziņu, paroles, sesijas ID vai paroles maiņas atļaujas. | Noteikums All senders paredz žurnālu glabāšanu vienu mēnesi. Never store previews attiecas uz jaunām vēstulēm. Pēdējā pārbaudē Anonymous email tracking bija iestatīts uz No. |
| jsDelivr un tā CDN infrastruktūra | Pārlūks tieši ielādē Bootstrap 5.3.8 CSS, dažās lapās arī JavaScript. Resursa piegādātājs saņem savienojuma IP, faila ceļu un pieprasījuma tehniskos datus, piemēram, pārlūka informāciju un atkarībā no iestatījumiem atsauces vietni. Lietotnes veidlapas un sarakste tiek sūtītas uz Student Chat. | Jāpārbauda piemērojamie CDN nosacījumi, saņēmēji un pārrobežu apstrāde. CDN pieprasījums pats par sevi neapliecina trešās puses sīkdatni. [jsDelivr aprakstītās datu kategorijas](https://www.jsdelivr.com/documents/data-processing-agreement.pdf) |

**Brevo vēstuļu pārbaude.** [Lietotnes veidnēs](../src/services/emailTemplates.js) nav saišu, attēlu vai atvēršanas pikseļa. [Nosūtīšanas kods](../src/services/email.js) neiestata izsekošanas režīmu. Brevo var apstrādāt atvēršanu pēc vēstules piegādes atkarībā no konta iestatījumiem. Ja ievieto ārēju attēlu, tā ielāde var atklāt pasta klienta vai tā starpnieka IP un laiku. Vietnes DevTools nevar parādīt, kā Brevo apstrādā saņemto vēstuli. Anonimizācijas iestatījums pats par sevi neparāda, kuri atvēršanas vai klikšķu notikumi konkrētajai vēstulei ir reģistrēti. Jauno vēstuļu priekšskatījumu iestatījums neapliecina agrāku priekšskatījumu dzēšanu. [Brevo par atvēršanu un klikšķiem](https://help.brevo.com/hc/en-us/articles/11643306229906-Can-I-anonymize-the-tracking-of-opens-and-clicks-for-my-emails), [Brevo par žurnāliem un priekšskatījumiem](https://help.brevo.com/hc/en-us/articles/4415743225746-Configure-a-custom-retention-period-for-your-transactional-logs-and-email-previews)

Publisko lapu un skriptu pārskatā un pārlūka tīkla novērojumos neatradām Google Analytics, Meta Pixel, reklāmas skriptus, iegultu YouTube video, Google Maps, citas kartes vai iframe. Socket.IO klientu ielādē no pašas vietnes. Administratoram pirms politikas publicēšanas jāapstiprina katra piegādātāja loma, piemērojamie datu apstrādes līgumi, apakšapstrādātāji un iespējamās datu nodošanas ārpus EEZ pamats. Viens zināms izvietošanas reģions neapstiprina visu datu plūsmu atrašanās vietu.

## 8. Secinājumi

**Atsevišķa sīkdatņu politika un baneris.** Pārbaudītajās plūsmās neatradām analītikas vai mārketinga sīkdatnes. Šim projektam abus konstatētos ierakstus var aprakstīt privātuma politikā. 6.1. posma vietnē vispārējs sīkdatņu baneris nav vajadzīgs. Lietotājs atsevišķi izvēlas ilglaicīgu pieteikšanos un tēmas saglabāšanu pie attiecīgās funkcijas. Abas izvēles sākotnēji ir izslēgtas.

Latvijā informācijas glabāšanu ierīcē un piekļuvi tai regulē **Informācijas sabiedrības pakalpojumu likuma 7.¹ pants**. Tas attiecas arī uz lokālo krātuvi. DVI kā izņēmumu min autentifikāciju sesijas laikā un īslaicīgu saskarnes pielāgošanu. ES 29. panta darba grupas atzinums atsevišķi aplūko pieteikšanos pēc pārlūka aizvēršanas un ilgstošas noformējuma izvēles. [Likuma 7.¹ pants](https://likumi.lv/ta/id/96619-informacijas-sabiedribas-pakalpojumu-likums#p7_1), [DVI vadlīnijas, 4.9. nodaļa](https://www.dvi.gov.lv/lv/media/1517/download), [atzinuma 04/2012 3.2. un 3.6. nodaļa](https://ec.europa.eu/justice/article-29/documentation/opinion-recommendation/files/2012/wp194_en.pdf)

- **Pieteikšanās.** Arī automātiskajai pieteikšanai pēc reģistrācijas izmanto sesijas sīkdatni. Izrakstīšanās izbeidz pašreizējo sesiju abos režīmos. Pirms atjauninājuma izdotās sīkdatnes var pastāvēt līdz agrāk norādītajam termiņam vai izrakstīšanās brīdim.
- **Tēma.** Izvēli turpmākajiem apmeklējumiem var atsaukt tajos pašos tēmas iestatījumos jebkurā lapā.
- **Privātuma politikā** jānosauc reālais pārzinis un publiskie kontakti, jāsasaista katrs nolūks ar datiem un tiesisko pamatu, jāapraksta saņēmēji, termiņi, drošība, tiesību īstenošana un iespēja vērsties Datu valsts inspekcijā. Studentam īpaši svarīgi saprast, kurš redz kursa un privātās ziņas, kam pieejams e-pasts un kāpēc koda, datubāzes ieraksta un vēstules dzīves ilgums atšķiras.
- **Vēl precizējams.** Piegādātāju līgumos jāpārbauda faktiskās datu nodošanas ārpus EEZ, saņēmēji un piemērojamās garantijas. Publicētās vietnes autentifikācijas sīkdatnes atribūti jāpārbauda izvietotā testa vidē.
