const nodemailer = require('nodemailer');

function requireEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

let transporterPromise;
async function getTransporter() {
    if (transporterPromise) return transporterPromise;

    transporterPromise = (async () => {
        const user = requireEnv('EMAIL_USER');
        const pass = requireEnv('EMAIL_PASSWORD');

        // Prefer explicit SMTP config when present (more reliable).
        const host = process.env.SMTP_HOST;
        const portRaw = process.env.SMTP_PORT;
        const port = portRaw ? Number(portRaw) : undefined;

        const transporter = host && port
            ? nodemailer.createTransport({
                host,
                port,
                secure: port === 465, // 465 = implicit TLS
                auth: { user, pass }
            })
            : nodemailer.createTransport({
                service: 'gmail',
                auth: { user, pass }
            });

        // Fail fast if SMTP credentials/config are invalid.
        await transporter.verify();
        return transporter;
    })();

    return transporterPromise;
}

// Alternative SMTP configuration (more reliable)
// const transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST,
//     port: process.env.SMTP_PORT,
//     secure: true, // true for 465, false for other ports
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASSWORD
//     }
// });

// Registration success email template
const registrationEmailTemplate = (userName) => {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4CAF50;">Welcome to Our Platform!</h2>
            <p>Hello ${userName},</p>
            <p>Thank you for registering with us. Your account has been successfully created!</p>
            <p>You can now explore all the features our platform has to offer.</p>
            <div style="margin-top: 30px; padding: 20px; background-color: #f5f5f5;">
                <p style="margin: 0;">If you have any questions, feel free to contact our support team.</p>
            </div>
            <p style="margin-top: 30px;">Best regards,<br>Your Team</p>
        </div>
    `;
};

// Login notification email template
const loginEmailTemplate = (userName, loginTime, deviceInfo) => {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2196F3;">New Login Detected</h2>
            <p>Hello ${userName},</p>
            <p>We detected a new login to your account:</p>
            <ul style="list-style: none; padding: 0;">
                <li style="padding: 8px; background-color: #f5f5f5; margin-bottom: 5px;">
                    <strong>Time:</strong> ${loginTime}
                </li>
                <li style="padding: 8px; background-color: #f5f5f5; margin-bottom: 5px;">
                    <strong>Device:</strong> ${deviceInfo}
                </li>
            </ul>
            <p style="color: #ff5722;">If this wasn't you, please secure your account immediately.</p>
            <p style="margin-top: 30px;">Best regards,<br>Security Team</p>
        </div>
    `;
};

// Send email function
const sendEmail = async (to, subject, htmlContent) => {
    try {
        const transporter = await getTransporter();
        const mailOptions = {
            from: `"Your App Name" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        // Nodemailer errors often have useful fields beyond `message`.
        console.error('Error sending email:', {
            message: error?.message,
            code: error?.code,
            command: error?.command,
            response: error?.response,
            responseCode: error?.responseCode,
            stack: error?.stack
        });
        return { success: false, error: error?.message };
    }
};

// Specific email functions
const sendRegistrationEmail = async (userEmail, userName) => {
    const subject = 'Welcome to Our Platform!';
    const htmlContent = registrationEmailTemplate(userName);
    return await sendEmail(userEmail, subject, htmlContent);
};

const sendLoginNotification = async (userEmail, userName, req) => {
    const subject = 'New Login to Your Account';
    const loginTime = new Date().toLocaleString();
    const deviceInfo = req.headers['user-agent'] || 'Unknown device';
    const htmlContent = loginEmailTemplate(userName, loginTime, deviceInfo);
    return await sendEmail(userEmail, subject, htmlContent);
};

module.exports = {
    sendRegistrationEmail,
    sendLoginNotification
};