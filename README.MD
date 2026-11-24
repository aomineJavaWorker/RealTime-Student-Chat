# Student Chat

**Tiešsaistes demonstrācija:** https://realtime-student-chat.onrender.com

Student Chat ir pilna steka tīmekļa lietotne studentu savstarpējai saziņai.

Lietotāji var reģistrēties, izvēlēties savu kursu, pieslēgties sistēmai un sazināties ar citiem sava kursa studentiem kopējā čatā vai privātās sarakstēs.

Ziņas tiek saglabātas MongoDB datubāzē, bet reāllaika saziņa tiek nodrošināta ar Socket.IO.

---

## Demonstrācija

**Darbojošā vietne:** [Student Chat](https://realtime-student-chat.onrender.com)

Var reģistrēties, izvēlēties kursu, piedalīties kopējā čatā, rakstīt privātas ziņas un izmantot ziņojumu reakcijas.

> Bezmaksas Render pakalpojuma dēļ vietnes pirmā ielāde pēc neaktivitātes var aizņemt ilgāku laiku.

## Ekrānuzņēmumi

### Pieslēgšanās un reģistrācija

| Pieslēgšanās (tumšā tēma) | Reģistrācija (gaišā tēma) |
|:---:|:---:|
| <img src="docs/images/login-dark.png" alt="Student Chat pieslēgšanās lapa tumšajā tēmā" width="420"> | <img src="docs/images/register-light.png" alt="Student Chat reģistrācijas lapa gaišajā tēmā" width="420"> |

### Kopējais čats (gaišā tēma)

<img src="docs/images/chat-light.png" alt="Student Chat kopējais čats ar ziņām, reakcijām un privāto sarakstu paneli" width="760">

### Privātā sarakste (tumšā tēma)

<img src="docs/images/private-chat-dark.png" alt="Student Chat privātās sarakstes logs tumšajā tēmā" width="760">

---

## Projekta mērķis

Projekta mērķis ir izveidot vienkāršu, ērtu un responsīvu studentu saziņas platformu, kurā viena kursa studenti var:

- sazināties kopējā čatā;
- nosūtīt privātas ziņas;
- redzēt tiešsaistē esošos lietotājus;
- atbildēt uz ziņām;
- rediģēt un dzēst savas ziņas;
- izmantot reakcijas;
- meklēt ziņas;
- saņemt reāllaika atjauninājumus.

---

## Izmantotās tehnoloģijas

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- Socket.IO

### Autorizācija un sesijas

- bcrypt
- express-session
- connect-mongo

### Frontend

- HTML
- CSS
- JavaScript
- Bootstrap 5
- Fetch API
- Socket.IO Client

---

## Galvenās funkcijas

### Lietotāji

- Lietotāju reģistrācija
- Lietotāju autorizācija
- Paroļu šifrēšana ar `bcrypt`
- Lietotāja sesijas saglabāšana
- Izrakstīšanās no sistēmas
- Kursa izvēle reģistrācijas un autorizācijas laikā

### Kopējais čats

- Ziņu nosūtīšana reāllaikā
- Ziņu saglabāšana MongoDB
- Savu ziņu rediģēšana
- Savu ziņu dzēšana
- Atbildes uz ziņām
- Ziņu meklēšana
- Reakcijas uz ziņām
- Dubultklikšķis uz ziņas pievieno `👍`
- Nelasīto ziņu skaitītājs
- Rakstīšanas indikators `Raksta...`

### Lietotāji tiešsaistē

- Tiešsaistes lietotāju saraksts
- Lietotāja tiešsaistes/bezsaistes statuss
- Lietotāji redz tikai sava kursa dalībniekus

### Privātās ziņas

- Privāta sarakste starp diviem lietotājiem
- Privātās ziņas tiek saglabātas MongoDB
- Ziņas tiek saņemtas reāllaikā ar Socket.IO
- Iespējams nosūtīt ziņu arī lietotājam, kurš pašlaik nav tiešsaistē
- Privātu saraksti iespējams izveidot tikai ar sava kursa lietotājiem

### Dizains

- Gaišā un tumšā tēma ar izvēles saglabāšanu
- Animēta pārslēgšanās starp pieslēgšanos un reģistrāciju

- Bootstrap komponentes
- Responsīvs dizains
- Atsevišķs izkārtojums mobilajām ierīcēm
- Savu un citu lietotāju ziņu vizuāla atdalīšana
- Ziņojumu burbuļi
- Modālais logs privātajām ziņām
- Interaktīvas pogas un izvēlnes

---

## Datubāze

Projektā tiek izmantota MongoDB datubāze.

Datubāzē ir 4 galvenās savstarpēji saistītas kolekcijas:

### `courses`

Glabā kursus.

Galvenie lauki:

- `number`
- `name`

### `users`

Glabā reģistrētos lietotājus.

Galvenie lauki:

- `username`
- `usernameKey`
- `passwordHash`
- `course`

Katrs lietotājs ir piesaistīts vienam kursam.

### `messages`

Glabā kopējā čata ziņas.

Galvenie lauki:

- `text`
- `user`
- `course`
- `replyTo`
- `reactions`
- `editedAt`
- `createdAt`

Ziņa ir saistīta ar lietotāju un kursu.

### `directmessages`

Glabā privātās ziņas starp lietotājiem.

Galvenie lauki:

- `sender`
- `recipient`
- `course`
- `text`
- `createdAt`

Privātā ziņa ir saistīta ar nosūtītāju, saņēmēju un kursu.

---

## Kolekciju saistība

~~~text
Course
  │
  └── User
       │
       ├── Message
       │     ├── User
       │     ├── Course
       │     └── Message (replyTo)
       │
       └── DirectMessage
             ├── sender -> User
             ├── recipient -> User
             └── Course
~~~

---

## CRUD darbības

Kopējām čata ziņām ir realizētas pilnas CRUD darbības.

| Darbība | HTTP metode | Endpoint |
|---|---|---|
| Ziņu iegūšana | GET | `/api/messages` |
| Ziņas izveidošana | POST | `/api/messages` |
| Ziņas rediģēšana | PUT | `/api/messages/:id` |
| Ziņas dzēšana | DELETE | `/api/messages/:id` |

Papildus ir realizētas reakcijas:

~~~text
POST /api/messages/:id/reaction
~~~

---

## Galvenie API maršruti

### Autorizācija

~~~text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
~~~

### Kursi

~~~text
GET /api/courses
~~~

### Kopējās ziņas

~~~text
GET    /api/messages
POST   /api/messages
PUT    /api/messages/:id
DELETE /api/messages/:id

POST   /api/messages/:id/reaction
~~~

### Privātās ziņas

~~~text
GET  /api/private-messages/users
GET  /api/private-messages/:userId
POST /api/private-messages/:userId
~~~

---

## Reāllaika notikumi

Reāllaika saziņai tiek izmantots Socket.IO.

Projektā tiek izmantoti vairāki Socket.IO notikumi:

~~~text
joinCourse
onlineUsers

typingStart
typingStop
typingUsers

newMessage
messageUpdated
messageDeleted
messageReactionUpdated

privateMessage
~~~

Katram kursam tiek izveidota sava Socket.IO istaba:

~~~text
course-1
course-2
course-3
course-4
~~~

Privātajām ziņām katram lietotājam tiek izmantota arī personīgā istaba:

~~~text
user-USER_ID
~~~

---

## Frontend interaktīvās komponentes

Projektā ir vairākas dinamiski un asinhroni strādājošas komponentes.

Piemēri:

1. Kopējais reāllaika čats
2. Privāto ziņu modālais logs
3. Tiešsaistes lietotāju saraksts
4. Ziņu reakcijas
5. Ziņu meklēšana
6. Rakstīšanas indikators
7. Nelasīto ziņu skaitītājs
8. Ziņu rediģēšana un dzēšana

Datu apmaiņai bez lapas pārlādes tiek izmantoti:

- Fetch API
- Socket.IO

---

## Projekta struktūra

~~~text
RealTime-Student-Chat/
│
├── public/
│   ├── css/
│   │   ├── auth.css
│   │   ├── style.css
│   │   └── theme.css
│   │
│   ├── js/
│   │   ├── app.js
│   │   ├── auth-ui.js
│   │   ├── chat.js
│   │   ├── register.js
│   │   └── theme.js
│   │
│   ├── index.html
│   ├── register.html
│   └── chat.html
│
├── docs/
│   └── images/
│       ├── login-dark.png
│       ├── register-light.png
│       ├── chat-light.png
│       └── private-chat-dark.png
│
├── src/
│   ├── models/
│   │   ├── Course.js
│   │   ├── User.js
│   │   ├── Message.js
│   │   └── DirectMessage.js
│   │
│   └── routes/
│       ├── auth.js
│       ├── courses.js
│       ├── messages.js
│       └── privateMessages.js
│
├── .env
├── .gitignore
├── package.json
├── package-lock.json
├── README.MD
└── server.js
~~~

---

# Projekta palaišana lokāli

## 1. Klonēt GitHub repozitoriju

Atvērt termināli un izpildīt:

~~~bash
git clone https://github.com/aomineJavaWorker/RealTime-Student-Chat.git
~~~

Pāriet uz projekta mapi:

~~~bash
cd RealTime-Student-Chat
~~~

---

## 2. Instalēt nepieciešamās pakotnes

Nepieciešams instalēts Node.js un npm.

Terminālī izpildīt:

~~~bash
npm install
~~~

Tas instalēs visas `package.json` norādītās atkarības.

---

## 3. Izveidot `.env` failu

Projekta saknes mapē jāizveido fails:

~~~text
.env
~~~

Failā jānorāda:

~~~env
PORT=3000
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER/student_chat?retryWrites=true&w=majority
SESSION_SECRET=your_random_secret_key
~~~

### `PORT`

Ports, kurā darbosies serveris.

Pēc noklusējuma:

~~~env
PORT=3000
~~~

### `MONGODB_URI`

MongoDB Atlas savienojuma adrese.

To iespējams iegūt:

~~~text
MongoDB Atlas
→ Database
→ Connect
→ Drivers
→ Node.js
~~~

Savienojuma adresē jānorāda savs MongoDB lietotājvārds un parole.

### `SESSION_SECRET`

Nejauša slepena virkne, kas tiek izmantota lietotāju sesiju aizsardzībai.

Piemērs:

~~~env
SESSION_SECRET=my_random_session_secret
~~~

Reālā `.env` faila paroles un slepenās atslēgas nedrīkst publicēt GitHub.

`.env` fails ir pievienots `.gitignore`.

### E-pasta sūtīšana ar Brevo

Servera e-pasta modulis izmanto Brevo HTTPS API. Pārbaudes vēstuli var nosūtīt no termināļa arī tad, kad čata serveris ir izslēgts. [Brevo API dokumentācija](https://developers.brevo.com/docs/send-a-transactional-email)

1. Izveido [Brevo kontu](https://onboarding.brevo.com/account/register/), apstiprini savu e-pastu un pabeidz konta iestatīšanu.
2. Atver **Settings → Senders, Domains, IPs → Domains**. Pievieno domēnu, kura DNS pārvaldi. Izpildi Brevo parādītos norādījumus un pārbaudi autentifikācijas statusu. [Domēna autentifikācija](https://help.brevo.com/hc/en-us/articles/12163873383186)
3. Cilnē **Senders** izvēlies **Add a sender**. Norādi vārdu `Student Chat` un savu sūtītāja adresi. Saglabā izmaiņas. Ja Brevo pieprasa apstiprinājumu, ievadi kodu, ko saņēmi šajā adresē. [Sūtītāja iestatīšana](https://help.brevo.com/hc/en-us/articles/208836149)
4. Atver **Settings → SMTP & API → API Keys & MCP** un izvēlies **Generate API key**. Piešķir atslēgai projekta nosaukumu, iestati derīguma termiņu un piešķir tiesības sūtīt transakciju e-pastus. Nokopē atslēgu, kamēr tā ir redzama, un saglabā to paroļu pārvaldniekā. [API atslēgas izveide](https://help.brevo.com/hc/en-us/articles/40159485019794)
5. Esošā lokālā `.env` faila beigās pievieno šīs trīs rindas. Aizpildi pirmās divas ar savu API atslēgu un Brevo apstiprināto sūtītāja adresi.

~~~dotenv
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
BREVO_SENDER_NAME="Student Chat"
~~~

Render panelī atver projekta **Web Service → Environment → Environment Variables → Edit → Add variable**. Pievieno tos pašus trīs mainīgos. Vārda vērtību `Student Chat` ievadi bez pēdiņām. Izvēlies **Save and deploy**, lai lietotu iestatījumus esošajā būvējumā, vai **Save only**, lai tos lietotu nākamajā izvietošanas reizē. [Render vides mainīgie](https://render.com/docs/configure-environment-variables)

Paroles atjaunošanas vēstulēs ir vienreizēji kodi. Brevo sadaļā **Settings → Transactional emails → Retention rules** pārbaudi, vai vēstuļu priekšskatījumiem ir izvēlēts **Never store previews**. Šis iestatījums attiecas uz turpmāk nosūtītajām vēstulēm. [Brevo priekšskatījumu iestatījumi](https://help.brevo.com/hc/en-us/articles/4415743225746)

#### Pārbaudes vēstule

Projekta mapē palaid šo komandu, aizstājot piemēra adresi ar savu saņēmēja adresi.

~~~bash
npm run email:test -- students@example.org
~~~

Kad Brevo pieņems vēstuli, terminālī parādīsies vēstules ID. Atver **Transactional → Logs**, atrodi šo sūtījumu un pārbaudi, vai tam ir statuss **Delivered**. Pēc tam pārbaudi iesūtni un surogātpasta mapi. Vēstules temats ir **Student Chat e-pasta sūtīšanas pārbaude**. [Brevo nosūtīšanas žurnāls](https://help.brevo.com/hc/en-us/articles/360021533839)

Ja trūkst iestatījuma, komanda norādīs mainīgā nosaukumu. HTTP `401` gadījumā pārbaudi API atslēgu, `403` gadījumā pārbaudi piekļuves tiesības un konta statusu. HTTP `429` nozīmē, ka sasniegts pieprasījumu biežuma ierobežojums. Ja savienojums pārtrūka vai atbilde nepienāca laikus, pirms atkārtotas sūtīšanas pārbaudi Brevo žurnālu.

---

## 4. MongoDB Atlas tīkla piekļuve

Ja tiek izmantots MongoDB Atlas, nepieciešams atļaut savam datoram piekļuvi datubāzei.

MongoDB Atlas:

~~~text
Network Access
→ Add IP Address
→ Add Current IP Address
~~~

---

## 5. Palaist projektu

Izstrādes režīmā:

~~~bash
npm run dev
~~~

Tiek izmantots `nodemon`, tāpēc serveris automātiski pārstartējas pēc JavaScript failu izmaiņām.

Veiksmīgas palaišanas gadījumā terminālī būs redzams:

~~~text
MongoDB savienojums izveidots!
Serveris darbojas: http://localhost:3000
~~~

---

## 6. Atvērt projektu

Pārlūkprogrammā atvērt:

~~~text
http://localhost:3000
~~~

---

## Parasta servera palaišana

Projektu iespējams palaist arī bez `nodemon`:

~~~bash
npm start
~~~

---

## Lietošanas piemērs

1. Atvērt Student Chat.
2. Izvēlēties `Reģistrēties`.
3. Ievadīt lietotājvārdu.
4. Izvēlēties savu kursu.
5. Izveidot paroli.
6. Pēc reģistrācijas lietotājs automātiski tiek autorizēts.
7. Atvērt kopējo kursa čatu.
8. Nosūtīt ziņas citiem kursa studentiem.
9. Izvēlēties dalībnieku un nosūtīt privātu ziņu.
10. Lai izietu no konta, nospiest `Iziet`.

---

## Drošība

Projektā ir realizēti vairāki drošības mehānismi:

- paroles netiek glabātas atklātā veidā;
- paroles tiek hashotas ar `bcrypt`;
- autorizācijai tiek izmantotas servera sesijas;
- sesijas tiek glabātas MongoDB ar `connect-mongo`;
- sesijas cookie ir `httpOnly`;
- lietotāja identitāte ziņu CRUD darbībās tiek iegūta no servera sesijas;
- lietotājs nevar rediģēt vai dzēst cita lietotāja ziņas;
- lietotājs nevar piekļūt cita kursa ziņām;
- privātas ziņas var nosūtīt tikai sava kursa lietotājiem;
- `.env` fails netiek publicēts GitHub.

---

## Autors

**Aleksandrs Deņisenko**

Student Chat pilna steka tīmekļa lietotnes projekts.
