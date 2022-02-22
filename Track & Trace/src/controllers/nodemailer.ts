import { createTestAccount, createTransport, TestAccount, Transporter } from 'nodemailer';

let TRANSPORTER: Transporter;

async function Initialize(): Promise<void> {
    try {
        const account: TestAccount = await createTestAccount();
        TRANSPORTER = createTransport({ host: account.smtp.host, port: account.smtp.port, secure: account.smtp.secure, auth: { user: account.user, pass: account.pass } });
    } catch(error) {
        console.warn('WARNING: An error occurred while creating a test account');
        console.error(error);
        console.log('Using personal account');
        TRANSPORTER = createTransport({ host: 'outlook.unige.ch', port: 587, auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }});
    }
}

export { TRANSPORTER, Initialize as InitializeNodeMailer };