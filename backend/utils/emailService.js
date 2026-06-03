const nodemailer = require('nodemailer');

/**
 * Email Service - Currently not in use
 * To enable: Set EMAIL_USER and EMAIL_PASSWORD environment variables
 */

let transporter = null;

// Initialize email transporter if credentials are provided
if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  try {
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    console.log('Email service initialized');
  } catch (error) {
    console.error('Failed to initialize email service:', error.message);
  }
} else {
  console.warn('Email service not configured. Set EMAIL_USER and EMAIL_PASSWORD to enable.');
}

const sendEmail = async (to, subject, text, html = null) => {
  if (!transporter) {
    console.warn('Email service not configured. Email not sent.');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    if (!to || !subject || !text) {
      throw new Error('Missing required email parameters: to, subject, text');
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: Array.isArray(to) ? to.join(',') : to,
      subject,
      text,
      ...(html && { html }),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully. Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error.message);
    return { success: false, message: error.message };
  }
};

module.exports = { sendEmail };
