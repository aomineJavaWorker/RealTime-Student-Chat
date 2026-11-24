const endpoint = "https://api.brevo.com/v3/smtp/email";


function requiredSetting(name) {
    const value = process.env[name]?.trim();

    if (!value) {
        throw new Error(`Nav norādīts vides mainīgais ${name}.`);
    }

    return value;
}


async function sendEmail(recipient, { subject, textContent, htmlContent }) {
    const apiKey = requiredSetting("BREVO_API_KEY");
    const sender = {
        email: requiredSetting("BREVO_SENDER_EMAIL"),
        name: requiredSetting("BREVO_SENDER_NAME")
    };

    const signal = AbortSignal.timeout(10000);
    let response;

    try {
        response = await fetch(endpoint, {
            method: "POST",
            redirect: "error",
            signal,
            headers: {
                "api-key": apiKey,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                sender,
                to: [{ email: recipient }],
                subject,
                textContent,
                htmlContent
            })
        });
    } catch {
        throw new Error(signal.aborted
            ? "Brevo neatbildēja laikus. Pārbaudi nosūtīšanas žurnālu."
            : "Neizdevās sazināties ar Brevo. Pārbaudi nosūtīšanas žurnālu.");
    }

    if (!response.ok) {
        await response.body?.cancel();
        throw new Error(`Brevo API atgrieza kļūdu (HTTP ${response.status}).`);
    }

    const result = await response.json().catch(() => null);
    if (typeof result?.messageId !== "string" || !result.messageId.trim()) {
        throw new Error("Brevo atbildē neizdevās nolasīt vēstules ID. Pārbaudi nosūtīšanas žurnālu.");
    }

    return result.messageId;
}


module.exports = { sendEmail };
