This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Email Notification System

The email notification system is now fully implemented and sends notifications for various events:

## Email Triggers

- **User Registration**: Sends a welcome email when a new user registers
- **Order Creation**: Sends an order confirmation email when a new order is placed
- **Order Auto-Delivery**: Sends a delivery email with account credentials when stock is automatically assigned
- **Support Ticket Replies**: Sends a notification when a staff member responds to a ticket

## Email Configuration

Configuration is handled through environment variables:

```
# Email Configuration
SMTP_HOST="your-smtp-server.com"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER="your-username"
SMTP_PASS="your-password"
EMAIL_FROM="Your Store <no-reply@yourdomain.com>"
SITE_NAME="thatsdai"

# Email Testing
USE_PRODUCTION_EMAIL="true"  # Use real SMTP in development
DEBUG_EMAIL="true"           # Enable detailed logging
```

## Recent Fixes

We fixed issues with email notifications not being sent in these scenarios:

1. **Order Creation**: Fixed the email sending mechanism to properly trigger the order confirmation email
2. **Auto-Delivery**: Added logic to detect when stock is automatically assigned during checkout and send the appropriate email

## Debugging

- Set `DEBUG_EMAIL=true` in your .env file to enable detailed email debugging
- Look for `[EMAIL DEBUG]` log entries in the server console
- In development, ethereal.email accounts are used for testing unless `USE_PRODUCTION_EMAIL=true`

## Templates

Email templates are located in `/public/mail_templates/` and include:
- `welcome.html`
- `order-confirmation.html`
- `order-delivered.html`
- `ticket-replied.html`

All templates support variable replacement using `{{variableName}}` syntax.
