// EmailJS Configuration
// To set up EmailJS for automatic email sending:
// 
// 1. Go to https://www.emailjs.com/ and create a free account
// 2. Create a service (Gmail, Outlook, Yahoo, etc.)
// 3. Create an email template with the following variables:
//    - {{from_name}} - sender's name
//    - {{from_email}} - sender's email
//    - {{message}} - the message content
//    - {{to_email}} - your receiving email
//    - {{reply_to}} - sender's email for replies
// 4. Get your service ID, template ID, and public key from EmailJS dashboard
// 5. Replace the values below with your actual EmailJS configuration

export const EMAILJS_CONFIG = {
  serviceId: 'service_cusojna', // Replace with your EmailJS service ID
  templateId: 'template_sqidso6', // Replace with your EmailJS template ID  
  publicKey: 'v3eTH9lgVARVuaeEm', // Replace with your EmailJS public key
  defaultEmail: 'rukshs06.vgo@gmail.com' // Replace with your receiving email address
};

// Example EmailJS template (create this in your EmailJS dashboard):
/*
Subject: New Contact Form Message from {{from_name}}

You have received a new message from your website contact form:

Name: {{from_name}}
Email: {{from_email}}

Message:
{{message}}

You can reply directly to this email to respond to {{from_name}}.
*/

export const isEmailJSConfigured = () => {
  return (
    EMAILJS_CONFIG.serviceId !== 'your_service_id' &&
    EMAILJS_CONFIG.templateId !== 'your_template_id' &&
    EMAILJS_CONFIG.publicKey !== 'your_public_key' &&
    EMAILJS_CONFIG.defaultEmail !== 'contact@yourcompany.com'
  );
};
