# EmailJS Setup Guide for Contact Form

The contact form can now send emails directly to the specified email address using EmailJS. Here's how to set it up:

## Quick Start (Default Behavior)

By default, the contact form will open the user's default email client with a pre-filled message. This works immediately without any setup.

## Setup EmailJS for Automatic Email Sending

### Step 1: Create EmailJS Account
1. Go to [EmailJS.com](https://www.emailjs.com/)
2. Sign up for a free account (allows 200 emails/month)

### Step 2: Create Email Service
1. In your EmailJS dashboard, go to "Email Services"
2. Click "Add New Service"
3. Choose your email provider (Gmail, Outlook, Yahoo, etc.)
4. Follow the setup instructions for your provider
5. Note down your **Service ID**

### Step 3: Create Email Template
1. Go to "Email Templates" in your dashboard
2. Click "Create New Template"
3. Use this template structure:

```
Subject: New Contact Form Message from {{from_name}}

You have received a new message from your website contact form:

Name: {{from_name}}
Email: {{from_email}}

Message:
{{message}}

You can reply directly to this email to respond to {{from_name}}.
```

4. Note down your **Template ID**

### Step 4: Get Public Key
1. Go to "Account" > "General"
2. Find your **Public Key** (User ID)

### Step 5: Update Configuration
Edit the file `src/config/emailConfig.ts`:

```typescript
export const EMAILJS_CONFIG = {
  serviceId: 'your_actual_service_id', // Replace with your Service ID
  templateId: 'your_actual_template_id', // Replace with your Template ID  
  publicKey: 'your_actual_public_key', // Replace with your Public Key
  defaultEmail: 'your-email@company.com' // Replace with your receiving email
};
```

## Testing

1. Fill out the contact form on your website
2. If EmailJS is configured: Email will be sent automatically
3. If not configured: User's email client will open with pre-filled message

## Email Template Variables

The following variables are available in your EmailJS template:
- `{{from_name}}` - Sender's name
- `{{from_email}}` - Sender's email address  
- `{{message}}` - The message content
- `{{to_email}}` - Your receiving email address
- `{{reply_to}}` - Sender's email (for replies)

## Troubleshooting

- **Emails not sending**: Check your EmailJS service credentials
- **Template errors**: Ensure all variables are properly formatted with double braces
- **Rate limits**: Free accounts have 200 emails/month limit
- **SPAM issues**: Configure your email service's authentication properly

## Security Notes

- Public Key is safe to expose in frontend code
- Never expose private keys or service account credentials
- EmailJS handles security and authentication server-side
