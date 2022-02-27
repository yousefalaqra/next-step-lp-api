require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const fs = require("fs");
const { promisify } = require("util");
const app = express();
const readFile = promisify(fs.readFile);

app.use(bodyParser.json());
app.use(cors());

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        type: "OAuth2",
        user: process.env.EMAIL_USER,
        serviceClient: process.env.EMAIL_CLIENT_ID,
        privateKey: process.env.EMAIL_PRIVATE_KEY,
    },
});

app.use((req, res, next) => {
    console.log('request from:', req.ip);
    next();
})

app.post("/contact", async (req, res, next) => {
    // { email, name, subject, message }
    const data = { ...req.body, date: new Date(Date.now()) };

    let html = await readFile("./email.html", "utf8");
    let template = handlebars.compile(html);
    let htmlToSend = template(data);

    await transporter.sendMail({
        to: "info@joinnextstep.com",
        from: data.email,
        subject: "Connection request from NextStep landing page!",
        html: htmlToSend,
    });

    res
        .status(201)
        .json({
            status: "success",
            message:
                "Thank you for your message, we will make sure to back to you soon!",
        });
});

app.listen(3200, () => {
    console.log('server is running!');
});
