# Student Chat

Student Chat ir pilna steka tīmekļa lietotne studentu savstarpējai saziņai.

Lietotāji var reģistrēties, izvēlēties savu kursu, pieslēgties sistēmai un sazināties ar citiem sava kursa studentiem kopējā čatā vai privātās sarakstēs.

Ziņas tiek saglabātas MongoDB datubāzē, bet reāllaika saziņa tiek nodrošināta ar Socket.IO.

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
- Lietotāja online/offline statuss
- Lietotāji redz tikai sava kursa dalībniekus

### Privātās ziņas

- Privāta sarakste starp diviem lietotājiem
- Privātās ziņas tiek saglabātas MongoDB
- Ziņas tiek saņemtas reāllaikā ar Socket.IO
- Iespējams nosūtīt ziņu arī lietotājam, kurš pašlaik nav tiešsaistē
- Privātu saraksti iespējams izveidot tikai ar sava kursa lietotājiem

### Dizains

- Bootstrap komponentes
- Responsīvs dizains
- Atsevišķs izkārtojums mobilajām ierīcēm
- Savu un citu lietotāju ziņu vizuāla atdalīšana
- Chat bubbles
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
Full-stack-Denisenko/
│
├── public/
│   ├── css/
│   │   └── style.css
│   │
│   ├── js/
│   │   ├── app.js
│   │   ├── chat.js
│   │   └── register.js
│   │
│   ├── index.html
│   ├── register.html
│   └── chat.html
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
