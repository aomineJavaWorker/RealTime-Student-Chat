function normalizeEmail(email) {
    return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function isValidEmail(email) {
    const parts = email.split("@");
    if (email.length > 254 || parts.length !== 2) return false;

    const [local, domain] = parts;
    const labels = domain.split(".");
    const atom = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+$/;
    const label = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

    return local.length <= 64 &&
        local.split(".").every(part => atom.test(part)) &&
        labels.length > 1 &&
        labels.every(part => label.test(part));
}

module.exports = { normalizeEmail, isValidEmail };
