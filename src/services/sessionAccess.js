const User = require("../models/User");

async function isCurrentSession(session) {
    if (!session?.userId) return false;
    const user = await User.findById(session.userId).select("_id +sessionVersion").lean();
    return Boolean(user && (user.sessionVersion ?? 0) === (session.sessionVersion ?? 0));
}

async function checkHttpSession(req, res, next) {
    if (!req.session?.userId || await isCurrentSession(req.session)) return next();
    req.session.destroy(error => {
        if (error) return next(error);
        res.status(401).json({ authenticated: false, message: "Sesija ir beigusies. Pieslēdzies vēlreiz." });
    });
}

function sessionRoom(userId, version) {
    return `session-${userId}-${version ?? 0}`;
}

function secureSockets(io) {
    io.use(async (socket, next) => {
        try {
            if (await isCurrentSession(socket.request.session)) return next();
        } catch {
            // Ja sesiju nevar pārbaudīt, savienojumu nepieņem.
        }
        next(new Error("Nepieciešama autorizācija."));
    });
    io.on("connection", async socket => {
        const session = socket.request.session;
        socket.join(sessionRoom(session.userId, session.sessionVersion));
        // Atjaunošana var notikt starp sākotnējo pārbaudi un pievienošanos istabai.
        const ready = isCurrentSession(session).catch(() => false);
        socket.use(async (packet, next) => {
            if (await ready && socket.connected) next();
        });
        if (!await ready) socket.disconnect(true);
    });
}

module.exports = { checkHttpSession, secureSockets, sessionRoom };
