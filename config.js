const JobTypes = [
    { alias: "main", description: "Autori" },
    { alias: "main", description: "Monumenti" }
];

const SourceTypes = [
    { alias: "csv", description: "Upload a CSV file" }
];

const MailTransport = {
    service: 'Gmail',
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
};

module.exports = {
    JobTypes,
    SourceTypes,
    MailTransport
};