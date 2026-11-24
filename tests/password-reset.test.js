const { test } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const { fork } = require("node:child_process");
const { randomUUID } = require("node:crypto");
const path = require("node:path");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const WebSocket = require("ws");
const User = require("../src/models/User");
const Course = require("../src/models/Course");
const Reset = require("../src/models/PasswordReset");

test("Paroles atjaunošana, sesijas un Socket.IO", { timeout: 45000 }, async t => {
    const mongoPort = Number(process.env.TEST_MONGO_PORT || 27017);
    const uri = `mongodb://127.0.0.1:${mongoPort}/chat_reset_test_${randomUUID().replaceAll("-", "")}`;
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    const child = fork(path.join(__dirname, "support/reset-server.cjs"), [], {
        silent: true,
        env: { ...process.env, MONGODB_URI: uri, NODE_ENV: "test", PORT: "0", SESSION_SECRET: randomUUID(),
            BREVO_API_KEY: "test", BREVO_SENDER_NAME: "Test", BREVO_SENDER_EMAIL: "sender@example.org" }
    });
    let logs = "";
    child.stdout.on("data", chunk => { logs += chunk; });
    child.stderr.on("data", chunk => { logs += chunk; });
    const mail = [];
    child.on("message", data => { if (data.email) mail.push(data); });
    t.after(async () => {
        child.kill();
        await mongoose.connection.dropDatabase();
        await mongoose.disconnect();
    });
    const [{ port }] = await once(child, "message");
    const url = `http://127.0.0.1:${port}`;
    const email = "student@example.org";
    const password = randomUUID();
    const nextPassword = randomUUID();
    const course = await Course.findOne({ number: 1 });
    const passwordHash = await bcrypt.hash(password, 4);
    async function create(username, address, verified) {
        return User.create({ username, usernameKey: username.toLowerCase(), course: course._id,
            passwordHash, email: address, emailVerified: verified });
    }
    const student = await create("Student", email, true);
    await User.updateOne({ _id: student._id }, { pendingEmail: "future@example.org" });
    await create("Peer", "peer@example.org", false);
    await create("Legacy", undefined, false);
    await create("Undelivered", "delivery-fail@example.org", true);
    async function request(route, data, cookie = "") {
        const resp = await fetch(url + "/api/" + route, {
            method: data ? "POST" : "GET", headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify(data)
        });
        return { status: resp.status, body: await resp.json(), cookie: resp.headers.get("set-cookie")?.split(";")[0] };
    }
    const login = (username, pass) => request("auth/login", { username, password: pass, courseNumber: 1 });
    const reset = (action, fields) => request("auth/password-reset/" + action, { email, ...fields });
    const first = (await login("Student", password)).cookie;
    const second = (await login("Student", password)).cookie;
    const peer = (await login("Peer", password)).cookie;
    async function connect(cookie, allowed = true) {
        const ws = new WebSocket(`ws://127.0.0.1:${port}/socket.io/?EIO=4&transport=websocket`, { headers: { Cookie: cookie } });
        t.after(() => ws.terminate());
        for (;;) {
            const [data] = await once(ws, "message");
            const packet = String(data);
            if (packet.startsWith("0")) ws.send("40");
            if (packet.startsWith("40")) { assert.ok(allowed); return ws; }
            if (packet.startsWith("44")) { assert.ok(!allowed); return ws; }
        }
    }
    const sockets = await Promise.all([connect(first), connect(second), connect(peer)]);
    sockets[0].send('42["joinCourse"]');
    const closed = sockets.slice(0, 2).map(socket => once(socket, "close"));

    const unknown = await reset("request", { email: "missing@example.org" });
    const unverified = await reset("request", { email: "peer@example.org" });
    const pending = await reset("request", { email: "future@example.org" });
    const undelivered = await reset("request", { email: "delivery-fail@example.org" });
    const valid = await reset("request", { email: "  STUDENT@example.org " });
    assert.equal(valid.status, 202);
    assert.deepEqual(valid.body, unknown.body);
    assert.deepEqual(valid.body, unverified.body);
    assert.deepEqual(valid.body, pending.body);
    assert.deepEqual(valid.body, undelivered.body);
    assert.equal((await reset("request", {})).status, 202);
    const filter = { userId: student._id };
    const allowResend = () => Reset.updateOne(filter, { resendAt: new Date(0) });
    const currentCode = async count => {
        for (let i = 0; i < 100 && mail.length < count; i++) await new Promise(resolve => setTimeout(resolve, 10));
        assert.equal(mail.length, count);
        assert.equal(mail.at(-1).email, email);
        return mail.at(-1).code;
    };
    const initial = await currentCode(1);
    const record = await Reset.findOne(filter).lean();
    assert.ok((await Reset.collection.indexes()).some(index => index.key.expiresAt && index.expireAfterSeconds === 0));
    assert.equal(record.expiresAt - record.resendAt, 540000);
    assert.ok(!Object.values(record).includes(initial));
    const wrong = initial === "000000" ? "000001" : "000000";
    const failures = await Promise.all(Array.from({ length: 7 }, () => reset("verify", { code: wrong })));
    assert.ok(failures.every(result => result.status === 400));
    assert.equal((await Reset.findOne(filter)).failures, 5);
    assert.equal((await reset("verify", { code: initial })).status, 400);
    await allowResend();
    await reset("request", {});
    const replacement = await currentCode(2);
    assert.notEqual(initial, replacement);
    assert.equal((await reset("verify", { code: initial })).status, 400);
    await Reset.updateOne(filter, { expiresAt: new Date(Date.now() - 1) });
    assert.equal((await reset("verify", { code: replacement })).status, 400);
    await allowResend();
    await reset("request", {});
    const code = await currentCode(3);
    const confirmations = await Promise.all([reset("verify", { code }), reset("verify", { code })]);
    assert.deepEqual(confirmations.map(r => r.status).sort(), [200, 400]);
    const expiredToken = confirmations.find(r => r.status === 200).body.token;
    const finish = (token, extra = {}) => reset("complete", { token, password: nextPassword, passwordConfirm: nextPassword, ...extra });
    await Reset.updateOne(filter, { expiresAt: new Date(Date.now() - 1) });
    assert.equal((await finish(expiredToken)).status, 400);
    await allowResend();
    await reset("request", {});
    const replacedToken = (await reset("verify", { code: await currentCode(4) })).body.token;
    await allowResend();
    await reset("request", {});
    assert.equal((await finish(replacedToken)).status, 400);
    const token = (await reset("verify", { code: await currentCode(5) })).body.token;
    assert.equal((await finish(token, { passwordConfirm: "mismatch" })).status, 400);
    assert.equal((await finish(token, { password, passwordConfirm: password })).status, 400);
    assert.ok(!Object.values(await Reset.findOne(filter).lean()).includes(token));
    assert.deepEqual((await Promise.all([finish(token), finish(token)])).map(r => r.status).sort(), [200, 400]);
    await Promise.all(closed);
    assert.equal(sockets[2].readyState, WebSocket.OPEN);
    assert.equal((await finish(token)).status, 400);
    await connect(first, false);
    assert.equal((await request("messages", undefined, first)).status, 401);
    assert.equal((await request("private-messages/users", undefined, second)).status, 401);
    assert.equal((await request("auth/me", undefined, peer)).status, 200);
    assert.equal((await login("Student", password)).status, 401);
    const fresh = await login("Student", nextPassword);
    assert.equal((await request("auth/me", undefined, fresh.cookie)).status, 200);
    await connect(fresh.cookie);
    assert.equal((await login("Legacy", password)).status, 200);
    for (let i = 0; i < 8; i++) await reset("request", { email: "missing@example.org" });
    assert.equal((await reset("request", { email: "missing@example.org" })).status, 429);
    for (let i = 0; i < 30; i++) await reset("request", { email: `other${i}@example.org` });
    assert.equal((await reset("request", { email: "last@example.org" })).status, 429);
    for (const secret of [password, nextPassword, token, expiredToken, ...mail.map(m => m.code)]) {
        assert.ok(!logs.includes(secret), "Sensitīvi dati servera žurnālā");
    }
});
