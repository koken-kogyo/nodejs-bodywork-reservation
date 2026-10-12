const { ClientSecretCredential } = require("@azure/identity");
const { Client } = require("@microsoft/microsoft-graph-client");
const { mailConfig } = require("../../config-mail.js");
const { decryptPassword } = require("../security/decrypt-password.js");
require("isomorphic-fetch");

const tenantId = decryptPassword(mailConfig.TenantEnc);
const clientId = decryptPassword(mailConfig.ClientEnc);
const clientSecret = mailConfig.ClientSecretEnc;

const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);

const graphClient = Client.initWithMiddleware({
    authProvider: {
        getAccessToken: async () => {
            return await credential.getToken("https://graph.microsoft.com/.default")
                .then(t => t.token);
        }
    }
});

async function sendScreenshotByEMail(msg, base64Png) {
    const jpgBytes = base64Png.replace(/^data:image\/jpeg;base64,/, "");
    const toList = mailConfig.ToRecipients;
    const ccList = mailConfig.CcRecipients;
    const mail = {
        message: {
            subject: mailConfig.Subject,
            body: {
                contentType: "Text",
                content: msg
            },
            toRecipients: toList.map(addr => ({
                emailAddress: { address: addr }
            })),
            ccRecipients: ccList.map(addr => ({
                emailAddress: { address: addr }
            })),
            attachments: [
                {
                    "@odata.type": "#microsoft.graph.fileAttachment",
                    name: "screenshot.jpg",
                    contentType: "image/jpeg",
                    contentBytes: jpgBytes
                }
            ]
        },
        saveToSentItems: "true"
    };
    // 送信
    await graphClient.api(`/users/${mailConfig.FromEmailAddress}/sendMail`).post(mail);
}

// 添付なしのテストメール送信
async function sendTestMail() {
    const mail = {
        message: {
            subject: "【テスト】予約システムメール送信確認",
            body: {
                contentType: "Text",
                content: "これはテストメールです。\nGraph API から正常に送信されています。"
            },
            toRecipients: [
                { emailAddress: { address: "watuwa3@gmail.com" } }
            ]
        },
        saveToSentItems: "true"
    };
    await graphClient.api(`/users/${mailConfig.FromEmailAddress}/sendMail`).post(mail);
}

module.exports = { sendScreenshotByEMail, sendTestMail };
