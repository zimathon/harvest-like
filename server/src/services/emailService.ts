import nodemailer from 'nodemailer';
import { config } from 'dotenv';

config();

// メール送信用のトランスポーター設定
// Gmailを使用する場合のセットアップ
const createTransporter = () => {
  // 開発環境ではコンソールに出力するだけ
  if (process.env.NODE_ENV !== 'production' || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS // Gmailの場合はアプリパスワードを使用
    }
  });
};

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  const transporter = createTransporter();

  // 本番環境でメール設定がない場合、または開発環境の場合はコンソールに出力
  if (!transporter) {
    console.log('📧 Email (Development Mode):');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('Content:', options.text || 'HTML content');
    console.log('---');
    return;
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, '') // HTMLタグを除去してテキスト版を作成
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${options.to}`);
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
};

// 招待メールのテンプレート
export const sendInvitationEmail = async (
  email: string,
  name: string,
  tempPassword: string,
  inviterName: string
): Promise<void> => {
  const loginUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f4f4f4; }
        .credentials { background-color: white; padding: 15px; margin: 20px 0; border-left: 4px solid #4CAF50; }
        .button { display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; padding: 10px; color: #666; font-size: 12px; }
        .warning { color: #ff6b6b; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Harvest-like Time Tracking</h1>
        </div>
        
        <div class="content">
          <h2>Hello ${name}!</h2>
          
          <p>${inviterName} has invited you to join the team on Harvest-like Time Tracking system.</p>
          
          <div class="credentials">
            <h3>Your Login Credentials:</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> ${tempPassword}</p>
            <p class="warning">⚠️ Please change your password after your first login for security reasons.</p>
          </div>
          
          <p>To get started:</p>
          <ol>
            <li>Click the button below to go to the login page</li>
            <li>Enter your email and temporary password</li>
            <li>You'll be prompted to change your password on first login</li>
            <li>Start tracking your time!</li>
          </ol>
          
          <div style="text-align: center;">
            <a href="${loginUrl}/login" class="button">Login to Harvest-like</a>
          </div>
        </div>
        
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>If you have any questions, please contact your administrator.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Welcome to Harvest-like Time Tracking!

Hello ${name}!

${inviterName} has invited you to join the team on Harvest-like Time Tracking system.

Your Login Credentials:
Email: ${email}
Temporary Password: ${tempPassword}

⚠️ Please change your password after your first login for security reasons.

To get started:
1. Go to ${loginUrl}/login
2. Enter your email and temporary password
3. You'll be prompted to change your password on first login
4. Start tracking your time!

This is an automated message. Please do not reply to this email.
If you have any questions, please contact your administrator.
  `;

  await sendEmail({
    to: email,
    subject: 'You\'ve been invited to Harvest-like Time Tracking',
    html,
    text
  });
};

// パスワードリセットメールのテンプレート
export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  resetToken: string
): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f4f4f4; }
        .button { display: inline-block; padding: 10px 20px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; padding: 10px; color: #666; font-size: 12px; }
        .warning { color: #ff6b6b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        
        <div class="content">
          <h2>Hello ${name},</h2>
          
          <p>You recently requested to reset your password for your Harvest-like account.</p>
          
          <p>Click the button below to reset your password:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          
          <p class="warning">This link will expire in 1 hour for security reasons.</p>
          
          <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
        </div>
        
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Password Reset Request - Harvest-like',
    html
  });
};