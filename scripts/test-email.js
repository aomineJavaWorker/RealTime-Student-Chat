require("dotenv").config({ quiet: true });

const { sendEmail } = require("../src/services/email");
const { testEmail } = require("../src/services/emailTemplates");


async function main() {
    const recipient = process.argv[2]?.trim();
    if (process.argv.length !== 3 || !/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(recipient || "")) {
        throw new Error("Norādi vienu saņēmēja adresi: npm run email:test -- students@example.org");
    }

    const messageId = await sendEmail(recipient, testEmail());
    console.log(`Brevo pieņēma pārbaudes vēstuli. Vēstules ID: ${messageId}`);
}


main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
});
