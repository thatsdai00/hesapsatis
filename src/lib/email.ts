import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Check if email debugging is enabled
const isEmailDebugEnabled = () => {
  return process.env.DEBUG_EMAIL === 'true';
};

// Email debug logger
const debugLog = (message: string, data?: any) => {
  if (isEmailDebugEnabled()) {
    if (data) {
      console.log(`[EMAIL DEBUG] ${message}`, data);
    } else {
      console.log(`[EMAIL DEBUG] ${message}`);
    }
  }
};

// Get SMTP configuration from environment variables
const getEmailConfig = () => {
  const config = {
    host: process.env.SMTP_HOST || 'mesayazilim.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : true,
    auth: {
      user: process.env.SMTP_USER || 'iletisim@mesayazilim.com',
      pass: process.env.SMTP_PASS || 'Pi2zSHXdypeDHK7'
    },
    tls: {
      // Do not fail on invalid certs
      rejectUnauthorized: false
    }
  };
  
  // Log SMTP configuration for debugging (without password)
  debugLog('SMTP Configuration:', {
    ...config,
    auth: { 
      user: config.auth.user,
      pass: config.auth.pass ? '******' : 'not set' 
    }
  });
  
  return config;
};

// Function to load email template and replace variables
export async function loadEmailTemplate(templateName: string, variables: Record<string, string> = {}): Promise<string> {
  try {
    const templatePath = path.join(process.cwd(), 'public', 'mail_templates', `${templateName}.html`);
    debugLog(`Loading email template from: ${templatePath}`);
    
    let templateContent: string;
    try {
      templateContent = await fsPromises.readFile(templatePath, 'utf8');
    } catch (fsError) {
      console.error(`Error reading template file ${templateName}.html:`, fsError);
      // Check if template exists
      const exists = await fsPromises.access(templatePath).then(() => true).catch(() => false);
      if (!exists) {
        console.error(`Template file does not exist: ${templatePath}`);
        // List available templates for debugging
        try {
          const templatesDir = path.join(process.cwd(), 'public', 'mail_templates');
          const files = await fsPromises.readdir(templatesDir);
          debugLog('Available templates:', files);
        } catch (e) {
          console.error('Could not list templates directory:', e);
        }
      }
      throw fsError;
    }
    
    // Replace variables in the template
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      templateContent = templateContent.replace(regex, value || '');
    });
    
    // Log template variables for debugging
    debugLog(`Email template ${templateName} loaded with variables:`, Object.keys(variables));
    
    return templateContent;
  } catch (error) {
    console.error(`Failed to load email template '${templateName}':`, error);
    // Return a basic fallback template with error information
    return `
      <html>
        <body>
          <h1>Email Template Error</h1>
          <p>There was an error loading the email template "${templateName}".</p>
          <p>Please contact support.</p>
        </body>
      </html>
    `;
  }
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    if (!to || !subject || !html) {
      console.error('Invalid email parameters:', { to, subject, htmlLength: html?.length });
      return null;
    }
    
    debugLog(`Sending email to ${to} with subject "${subject}"`);
    
    // Log email configuration for debugging
    const emailConfig = getEmailConfig();
    debugLog(`Email configuration: ${JSON.stringify({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      authUser: emailConfig.auth?.user ? '(set)' : '(not set)',
      authPass: emailConfig.auth?.pass ? '(set)' : '(not set)',
    })}`);
    
    // Create a test account if we're in development
    const testAccount = process.env.NODE_ENV !== 'production' && !process.env.USE_PRODUCTION_EMAIL
      ? await nodemailer.createTestAccount()
      : null;

    // Configure transport - use real credentials when USE_PRODUCTION_EMAIL is set or in production
    const useProductionEmail = process.env.USE_PRODUCTION_EMAIL || process.env.NODE_ENV === 'production';
    debugLog(`Using ${useProductionEmail ? 'production' : 'test'} email configuration`);
    
    const transport = nodemailer.createTransport(
      useProductionEmail
        ? getEmailConfig()
        : {
            host: testAccount ? 'smtp.ethereal.email' : '',
            port: testAccount ? 587 : 0,
            secure: false,
            auth: {
              user: testAccount ? testAccount.user : '',
              pass: testAccount ? testAccount.pass : ''
            }
          }
    );

    // Verify SMTP connection
    try {
      debugLog('Verifying SMTP connection...');
      await transport.verify();
      debugLog('SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('SMTP connection verification failed:', verifyError);
      // Continue anyway to try sending the email
    }

    // Send the email
    const from = process.env.EMAIL_FROM || 'iletisim@mesayazilim.com';
    debugLog(`Sending from: ${from}`);
    
    const info = await transport.sendMail({
      from,
      to,
      subject,
      html
    });

    // Log email URL in development
    if (process.env.NODE_ENV !== 'production' && testAccount) {
      console.log(`📧 Email preview: ${nodemailer.getTestMessageUrl(info)}`);
    } else {
      debugLog(`Email sent: ${info.messageId}`);
    }
    
    return info;
  } catch (error) {
    console.error('Failed to send email:', error);
    // Don't throw error to prevent crashing the app
    return null;
  }
}

// Email notification functions

// 1. Welcome email on registration
export async function sendWelcomeEmail(userEmail: string, userName: string) {
  try {
    debugLog(`Sending welcome email to ${userEmail} (${userName})`);
    
    const templateHtml = await loadEmailTemplate('welcome', {
      name: userName || 'Değerli Üyemiz',
      siteName: process.env.SITE_NAME || 'thatsdai'
    });
    
    return sendEmail({
      to: userEmail,
      subject: `Hoş Geldiniz - Üyeliğiniz Başarıyla Oluşturuldu`,
      html: templateHtml
    });
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return null;
  }
}

// 2. Order confirmation email
export async function sendOrderConfirmationEmail(
  userEmail: string, 
  userName: string, 
  orderId: string,
  orderDetails: { productName: string, price: string, quantity: number }[]
) {
  try {
    debugLog(`Sending order confirmation email to ${userEmail} for order ${orderId}`);
    debugLog('Order details:', orderDetails);
    
    // Create the product list HTML
    let productsHtml = '';
    orderDetails.forEach(item => {
      productsHtml += `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.productName}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.price} ₺</td>
        </tr>
      `;
    });
    
    const totalAmount = orderDetails.reduce((sum, item) => 
      sum + (parseFloat(item.price) * item.quantity), 0).toFixed(2);
    
    const templateHtml = await loadEmailTemplate('order-confirmation', {
      name: userName || 'Değerli Müşterimiz',
      orderId: orderId,
      products: productsHtml,
      totalAmount: `${totalAmount} ₺`,
      siteName: process.env.SITE_NAME || 'thatsdai'
    });
    
    return sendEmail({
      to: userEmail,
      subject: `Siparişiniz Alındı - Sipariş #${orderId}`,
      html: templateHtml
    });
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    return null;
  }
}

// 3. Support ticket replied email
export async function sendTicketRepliedEmail(
  userEmail: string, 
  userName: string,
  ticketTitle: string
) {
  try {
    debugLog(`Sending ticket reply email to ${userEmail} for ticket "${ticketTitle}"`);
    
    const templateHtml = await loadEmailTemplate('ticket-replied', {
      name: userName || 'Değerli Müşterimiz',
      ticketTitle: ticketTitle,
      siteName: process.env.SITE_NAME || 'thatsdai'
    });
    
    return sendEmail({
      to: userEmail,
      subject: `Destek Talebiniz Yanıtlandı - "${ticketTitle}"`,
      html: templateHtml
    });
  } catch (error) {
    console.error('Failed to send ticket reply email:', error);
    return null;
  }
}

// 4. Password reset email
export async function sendPasswordResetEmail(
  userEmail: string,
  userName: string,
  resetToken: string
) {
  try {
    debugLog(`Sending password reset email to ${userEmail}`);
    
    // Construct the reset link with the token
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetLink = `${baseUrl}/auth/reset-password?token=${resetToken}`;
    
    debugLog(`Reset link: ${resetLink}`);
    
    const templateHtml = await loadEmailTemplate('forgot_password', {
      name: userName || 'Değerli Üyemiz',
      resetLink: resetLink,
      expireTime: '30', // 30 minutes
      siteName: process.env.SITE_NAME || 'thatsdai'
    });
    
    debugLog(`Email template loaded successfully, length: ${templateHtml.length}`);
    
    const result = await sendEmail({
      to: userEmail,
      subject: `Şifre Sıfırlama Talebi`,
      html: templateHtml
    });
    
    if (result) {
      debugLog(`Password reset email sent successfully to ${userEmail}, messageId: ${result.messageId || 'unknown'}`);
      return result;
    } else {
      console.error(`Failed to send password reset email to ${userEmail}`);
      return null;
    }
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return null;
  }
}

// 4. Order delivered email
export async function sendOrderDeliveredEmail(
  userEmail: string, 
  userName: string,
  orderId: string,
  products: { productName: string, price: string }[],
  stockItems: { productName: string, content: string }[]
) {
  try {
    debugLog(`Sending order delivered email to ${userEmail} for order ${orderId}`);
    debugLog('Products:', products);
    debugLog('Stock items:', stockItems);
    
    if (!stockItems || stockItems.length === 0) {
      console.error('No stock items to include in delivery email');
      return null;
    }
    
    // Create the products list HTML
    let productsHtml = '';
    products.forEach(product => {
      productsHtml += `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${product.productName}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${product.price} ₺</td>
        </tr>
      `;
    });
    
    // Create the stock items list HTML
    let stockItemsHtml = '';
    stockItems.forEach(item => {
      stockItemsHtml += `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.productName}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-family: monospace;">${item.content}</td>
        </tr>
      `;
    });
    
    const templateHtml = await loadEmailTemplate('order-delivered', {
      name: userName || 'Değerli Müşterimiz',
      orderId: orderId,
      products: productsHtml,
      stockItems: stockItemsHtml,
      siteName: process.env.SITE_NAME || 'thatsdai'
    });
    
    return sendEmail({
      to: userEmail,
      subject: `Siparişiniz Teslim Edildi - Sipariş #${orderId}`,
      html: templateHtml
    });
  } catch (error) {
    console.error('Failed to send order delivered email:', error);
    return null;
  }
}