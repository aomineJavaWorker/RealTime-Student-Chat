const { test } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const { randomUUID } = require("node:crypto");
const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const auth = require("../src/routes/auth");
const Course = require("../src/models/Course");
const User = require("../src/models/User");
const Verification = require("../src/models/EmailVerification");
const Limit = require("../src/models/VerificationRequestLimit");

// Izmanto tikai lokālu MongoDB un katrai pārbaudei izveido atsevišķu datubāzi.
test("E-pasta apstiprināšana ar īstu MongoDB un imitētu Brevo", async t => {
    const port = Number(process.env.TEST_MONGO_PORT || 27017);
    const database = "chat_test_" + randomUUID().replaceAll("-", "");
    await mongoose.connect(`mongodb://127.0.0.1:${port}/${database}`, { serverSelectionTimeoutMS: 3000 });
    t.after(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.disconnect();
    });
    await Promise.all([User.init(), Verification.init(), Limit.init()]);
    await Course.create({ number: 1, name: "1. kurss" });
    for (const model of [Verification, Limit]) {
        assert.ok((await model.collection.indexes()).some(index =>
            index.key.expiresAt === 1 && index.expireAfterSeconds === 0));
    }

    Object.assign(process.env, {
        SESSION_SECRET: randomUUID(), BREVO_API_KEY: "test",
        BREVO_SENDER_NAME: "Test", BREVO_SENDER_EMAIL: "sender@example.org"
    });
    const sendHttp = global.fetch;
    const codes = [];
    let deliveryFails = false;
    t.mock.method(global, "fetch", async (url, options) => {
        assert.equal(url, "https://api.brevo.com/v3/smtp/email");
        if (deliveryFails) return new Response(null, { status: 503 });
        const mail = JSON.parse(options.body);
        assert.equal(mail.to[0].email, "user@example.org");
        codes.push(mail.textContent.match(/\b[0-9]{6}\b/)[0]);
        return Response.json({ messageId: "test" }, { status: 201 });
    });

    const app = express();
    app.use(express.json(), session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false }));
    app.use("/api/auth", auth);
    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    t.after(() => new Promise(resolve => server.close(resolve)));
    let cookie = "";
    async function request(path, body) {
        const response = await sendHttp(`http://127.0.0.1:${server.address().port}/api/auth${path}`, {
            method: body ? "POST" : "GET",
            headers: { Cookie: cookie, "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        const nextCookie = response.headers.get("set-cookie");
        if (nextCookie) cookie = nextCookie.split(";")[0];
        return { status: response.status, body: await response.json() };
    }
    const verify = "/email-verification";
    const submit = code => request(verify + "/confirm", { code });
    const resend = () => request(verify + "/resend", {});
    assert.equal((await resend()).status, 401);
    const account = { username: "Student", password: randomUUID(), courseNumber: 1, email: "user@example.org" };
    assert.equal((await request("/register", account)).status, 201);
    assert.equal(codes.length, 1);
    const user = await User.findOne({ email: account.email }).select("+passwordHash");
    const filter = { _id: user._id };
    const record = await Verification.findById(user._id).lean();
    assert.equal(record.expiresAt - record.resendAt, 9 * 60000);
    assert.match(record.digest, /^[a-f0-9]{64}$/);
    assert.ok(!Object.values(record).includes(codes[0]));
    assert.ok((await request("/me")).body.user.needsEmailVerification);
    const cooldown = await resend();
    assert.equal(cooldown.status, 429);
    assert.ok(cooldown.body.retryAfter > 0 && cooldown.body.retryAfter <= 60);
    const allowResend = () => Verification.updateOne(filter, { resendAt: new Date(0) });
    await allowResend();
    assert.deepEqual((await Promise.all([resend(), resend()])).map(r => r.status).sort(), [200, 429]);
    assert.equal(codes.length, 2);
    assert.notEqual(codes[1], codes[0]);
    for (const result of await Promise.all(Array.from({ length: 8 }, () => submit(codes[0])))) {
        assert.equal(result.status, 400);
    }
    assert.equal((await Verification.findById(user._id)).failures, 5);
    assert.equal((await submit(codes[1])).status, 400);
    await allowResend();
    deliveryFails = true;
    assert.equal((await resend()).status, 503);
    assert.equal((await request(verify)).body.deliveryFailed, true);
    assert.equal((await resend()).status, 429);
    deliveryFails = false;
    await allowResend();
    assert.equal((await resend()).status, 200);
    await Verification.updateOne(filter, { expiresAt: new Date(Date.now() - 1000) });
    assert.equal((await submit(codes.at(-1))).status, 400);
    await allowResend();
    assert.equal((await resend()).status, 200);
    const parallel = await Promise.all([submit(codes.at(-1)), submit(codes.at(-1))]);
    assert.equal(parallel.filter(r => r.status === 200).length, 1);
    assert.equal((await submit(codes.at(-1))).status, 409);
    assert.equal((await User.findById(user._id).select("+emailVerified")).emailVerified, true);
    assert.equal((await request("/me")).body.user.needsEmailVerification, false);

    await User.create({ username: "Legacy", usernameKey: "legacy", course: user.course, passwordHash: user.passwordHash });
    assert.equal((await request("/login", { ...account, username: "Legacy", email: undefined })).status, 200);
    assert.equal((await request("/me")).body.user.needsEmailVerification, false);
    assert.equal((await request(verify)).status, 409);
    deliveryFails = true;
    const pending = { ...account, username: "Pending", email: "pending@example.org" };
    assert.equal((await request("/register", pending)).status, 201);
    assert.equal((await request(verify)).body.deliveryFailed, true);
    assert.equal((await request("/login", pending)).status, 200);
    assert.equal((await request("/me")).body.user.needsEmailVerification, true);
    for (let index = 0; index < 60; index++) await submit("x");
    assert.equal((await submit("111111")).status, 429);
    // Reģistrācija un atkārtota nosūtīšana izmanto kopēju IP limitu.
    for (let index = 0; index < 20; index++) await resend();
    assert.equal((await request("/register", { ...account, username: "Second" })).status, 429);
});
