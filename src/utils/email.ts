import nodemailer from 'nodemailer';
import getEnvVar from './getEnvVar';

class Email {
  to: string;
  from: string;
  url: string;

  constructor(email: string, url: string) {
    this.to = email;
    this.url = url;
    this.from = `Saeed Badran <${getEnvVar('EMAIL_FROM')}>`;
  }

  //-------------------------------------------------------------------------------

  // getEnvVar('NODE_ENV')NODE_ENV === 'development'

  //-------------------------------------------------------------------------------
  //Send the actual email
  async send(subject: string, message: string) {
    // 1) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      message,
      text: this.url,
    };
    // 2) Create a transport and send email:
    const transporter = nodemailer.createTransport({
      host: getEnvVar('EMAIL_HOST'),
      port: Number(getEnvVar('EMAIL_PORT')),
      secure: false,
      auth: {
        user: getEnvVar('EMAIL_USERNAME'),
        pass: getEnvVar('EMAIL_PASSWORD'),
      },
    });

    await transporter.sendMail(mailOptions);
  } // send method
} // Email Class

export default Email;
