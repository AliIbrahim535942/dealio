import nodemailer from 'nodemailer';
import { AppError } from './AppError';
import ejs from 'ejs';
import path from 'path';
/**
 * Sends an email using the configured Gmail transporter.
 *
 * @param email - Recipient's email address.
 * @param emailSubject - Subject of the email.
 * @param emailText - Plain-text version of the email body.
 * @param templateName - HTML version of the email body.
 * @param data - Data used to render the email template.
 * @returns A promise that resolves when the email is sent successfully.
 */
export const sendEmail = async (
  email: string,
  emailSubject: string,
  emailText: string,
  templateName: string,
  data: Object,
): Promise<void> => {
  try {
    const templatePath = path.join(
      __dirname,
      `../templates/emails/${templateName}.ejs`,
    );
    const html = await ejs.renderFile(templatePath, data);
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    const mailOptions = {
      from: 'Dealio Platform',
      to: email,
      subject: emailSubject,
      text: emailText,
      html: html,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent: ' + info.response);
  } catch (err: any) {
    throw new AppError('Error sending email:', 500, err);
  }
};
