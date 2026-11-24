const { test } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const { randomUUID } = require("node:crypto");
const bcrypt = require("bcrypt");
const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const auth = require("../src/routes/auth");
const privateMessages = require("../src/routes/privateMessages");
const Course = require("../src/models/Course");
const User = require("../src/models/User");
const Verification = require("../src/models/EmailVerification");

test("Adreses pievienošana un maiņa īpašnieka profilā", async t => {
    const port = Number(process.env.TEST_MONGO_PORT || 27017);
    const database = "chat_profile_test_" + randomUUID().replaceAll("-", "");
    await mongoose.connect(`mongodb://127.0.0.1:${port}/${database}`, { serverSelectionTimeoutMS: 3000 });
    t.after(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.disconnect();
    });
    await User.init();
    const course = await Course.create({ number: 1, name: "1. kurss" });
    const password = randomUUID();
    const passwordHash = await bcrypt.hash(password, 4);
    async function create(username, email) {
        return User.create({ username, usernameKey: username.toLowerCase(), passwordHash,
            course: course._id, email, emailVerified: Boolean(email) });
    }
    const legacy = await create("Legacy");
    await create("Peer", "peer@example.org");
    const secret = randomUUID();
    Object.assign(process.env, { SESSION_SECRET: secret, BREVO_API_KEY: "test",
        BREVO_SENDER_EMAIL: "sender@example.org", BREVO_SENDER_NAME: "Test" });
    const sendHttp = global.fetch;
    const mail = [];
    let fail = false;
    t.mock.method(global, "fetch", async (url, options) => {
        assert.equal(url, "https://api.brevo.com/v3/smtp/email");
        const payload = JSON.parse(options.body);
        mail.push({ to: payload.to[0].email, code: payload.textContent.match(/\b\d{6}\b/)[0] });
        return fail ? new Response(null, { status: 503 }) : Response.json({ messageId: "test" }, { status: 201 });
    });
    const app = express();
    app.use(express.json(), session({ secret, resave: false, saveUninitialized: false }));
    app.use("/api/auth", auth);
    app.use("/api/private-messages", privateMessages);
    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    t.after(() => new Promise(resolve => server.close(resolve)));

    let cookie = "";
    async function request(path, body) {
        const res = await sendHttp(`http://127.0.0.1:${server.address().port}/api/${path}`, {
            method: body ? "POST" : "GET", headers: { Cookie: cookie, "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        if (res.headers.has("set-cookie")) cookie = res.headers.get("set-cookie").split(";")[0];
        return { status: res.status, body: await res.json() };
    }
    const login = username => request("auth/login", { username, courseNumber: 1, password });
    const profile = async () => (await request("auth/me")).body.user;
    const action = (path, body) => request("auth/email-verification/" + path, body);
    const change = (email, currentPassword = password) => action("address", { email, currentPassword });
    const confirm = code => action("confirm", { code });
    const allowResend = () => Verification.updateOne({ _id: legacy._id }, { resendAt: new Date(0) });
    const first = "first@example.org";
    const second = "second@example.org";
    const third = "third@example.org";

    assert.equal((await change(first)).status, 401);
    assert.equal((await login("Legacy")).status, 200);
    assert.equal((await profile()).email, null);
    assert.equal((await change(first, "")).status, 400);
    assert.equal((await change(first, "wrong")).status, 400);
    assert.equal((await change("invalid")).status, 400);
    assert.equal((await change("Peer@example.org")).status, 409);
    assert.equal(mail.length, 0);
    assert.equal((await profile()).pendingEmail, null);
    assert.equal((await change("  FIRST@example.org ")).status, 200);
    assert.equal(mail.at(-1).to, first);
    assert.equal((await profile()).email, null);
    assert.equal((await profile()).pendingEmail, first);
    assert.equal((await confirm(mail.at(-1).code)).status, 200);
    assert.equal((await profile()).email, first);
    assert.equal((await profile()).emailVerified, true);

    assert.equal((await change(second, "wrong")).status, 400);
    assert.equal((await profile()).pendingEmail, null);
    await allowResend();
    fail = true;
    assert.equal((await change(second)).status, 503);
    assert.equal((await profile()).email, first);
    assert.equal((await profile()).emailVerified, true);
    assert.equal((await profile()).pendingEmail, second);
    assert.equal((await action("resend", {})).status, 429);
    fail = false;
    await allowResend();
    assert.equal((await action("resend", {})).status, 200);
    const superseded = mail.at(-1);
    assert.equal(superseded.to, second);
    assert.equal((await change(third)).status, 429);
    assert.equal((await confirm(superseded.code)).status, 400);
    assert.equal((await profile()).pendingEmail, third);
    await allowResend();
    assert.equal((await action("resend", {})).status, 200);
    assert.equal(mail.at(-1).to, third);

    // Cits konts ieguvis adresi laikā starp koda nosūtīšanu un ievadi.
    await create("Rival", third);
    assert.equal((await confirm(mail.at(-1).code)).status, 409);
    assert.equal((await profile()).email, first);
    assert.equal((await profile()).emailVerified, true);
    await allowResend();
    assert.equal((await change(second)).status, 200);
    const latest = mail.at(-1);
    assert.equal(latest.to, second);
    assert.equal((await login("Peer")).status, 200);
    assert.equal((await confirm(latest.code)).status, 409);
    const peers = await request("private-messages/users");
    assert.equal(peers.status, 200);
    assert.ok(!JSON.stringify(peers.body).includes("@"));
    assert.ok(!JSON.stringify(await profile()).includes(first));
    await login("Legacy");
    const results = await Promise.all([confirm(latest.code), confirm(latest.code)]);
    assert.equal(results.filter(result => result.status === 200).length, 1);
    assert.equal((await profile()).email, second);
    assert.equal((await profile()).emailVerified, true);
    assert.equal((await profile()).pendingEmail, null);
    assert.equal((await User.findById(legacy._id)).email, undefined);

    // Iepriekš izsniegtam reģistrācijas kodam datubāzē nav adreses versijas.
    const existing = await create("Existing", "existing@example.org");
    await User.updateOne({ _id: existing._id }, { emailVerified: false });
    await login("Existing");
    assert.equal((await action("resend", {})).status, 200);
    await Verification.updateOne({ _id: existing._id }, { $unset: { emailRevision: 1 } });
    assert.equal((await confirm(mail.at(-1).code)).status, 200);
    assert.equal((await profile()).emailVerified, true);
});
