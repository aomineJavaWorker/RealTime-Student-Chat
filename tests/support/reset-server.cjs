// Testa serveris izmanto izolētu lokālo datubāzi un nosūta testa vēstuli tikai vecākprocesam.
const { once } = require("node:events");

async function main() {
    const db = new URL(process.env.MONGODB_URI);
    if (!process.send || db.hostname !== "127.0.0.1" || !db.pathname.startsWith("/chat_reset_test_")) {
        throw new Error("Nepieciešama lokāla testa datubāze.");
    }
    global.fetch = async (url, options) => {
        if (url !== "https://api.brevo.com/v3/smtp/email") throw new Error("Negaidīts adresāts.");
        const payload = JSON.parse(options.body);
        if (payload.to[0].email === "delivery-fail@example.org") return new Response(null, { status: 503 });
        process.send({ email: payload.to[0].email, code: payload.textContent.match(/\b\d{6}\b/)[0] });
        return Response.json({ messageId: "test" }, { status: 201 });
    };
    const startServer = require("../../server");
    const server = await startServer();
    if (!server.listening) await once(server, "listening");
    process.send({ port: server.address().port });
}

if (require.main === module) main().catch(() => process.exit(1));
