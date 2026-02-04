// ============================================================================
// EMAIL TEMPLATES FOR SUSPENSION SYSTEM
// Professional, branded, Amazon-style notifications
// ============================================================================

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailVariables {
  userName: string;
  userEmail: string;
  reason?: string;
  ticketNumber?: string;
  adminName?: string;
  appealUrl?: string;
  supportUrl?: string;
  dashboardUrl?: string;
}

// ============================================================================
// 1. SUSPENSION NOTICE
// ============================================================================

export const suspensionNotice = (vars: EmailVariables): EmailTemplate => ({
  subject: '⚠️ Your Account Has Been Suspended',

  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
        .alert-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .reason-box { background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔒 Account Suspended</h1>
        </div>
        
        <div class="content">
          <p>Hello ${vars.userName},</p>
          
          <div class="alert-box">
            <strong>⚠️ Important Notice</strong><br>
            Your account has been temporarily suspended due to a violation of our terms of service.
          </div>
          
          ${vars.reason ? `
            <div class="reason-box">
              <strong>Reason:</strong><br>
              ${vars.reason}
            </div>
          ` : ''}
          
          <h3>What This Means:</h3>
          <ul>
            <li>❌ You cannot log in to your account</li>
            <li>❌ Your products are hidden from buyers</li>
            <li>✅ Your existing orders remain visible</li>
            <li>✅ You can submit an appeal</li>
          </ul>
          
          <h3>How to Appeal:</h3>
          <p>If you believe this suspension was made in error, you can submit an appeal by clicking the button below:</p>
          
          <a href="${vars.appealUrl || vars.supportUrl || '#'}" class="button">
            📝 Submit Appeal
          </a>
          
          <p style="margin-top: 30px;">
            <strong>Need Help?</strong><br>
            Contact our support team at <a href="${vars.supportUrl || '#'}">support page</a>
          </p>
        </div>
        
        <div class="footer">
          <p>This is an automated message from your E-Commerce Platform</p>
          <p>Please do not reply to this email</p>
        </div>
      </div>
    </body>
    </html>
  `,

  text: `
Account Suspended

Hello ${vars.userName},

Your account has been temporarily suspended due to a violation of our terms of service.

${vars.reason ? `Reason: ${vars.reason}\n` : ''}

What This Means:
- You cannot log in to your account
- Your products are hidden from buyers
- Your existing orders remain visible
- You can submit an appeal

How to Appeal:
Submit an appeal here: ${vars.appealUrl || vars.supportUrl || 'Contact support'}

Need help? Visit: ${vars.supportUrl || 'Contact support'}

---
This is an automated message. Please do not reply.
  `
});

// ============================================================================
// 2. REACTIVATION NOTICE
// ============================================================================

export const reactivationNotice = (vars: EmailVariables): EmailTemplate => ({
  subject: '✅ Your Account Has Been Reactivated',

  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
        .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Account Reactivated!</h1>
        </div>
        
        <div class="content">
          <p>Hello ${vars.userName},</p>
          
          <div class="success-box">
            <strong>✅ Good News!</strong><br>
            Your account has been successfully reactivated and you now have full access.
          </div>
          
          <h3>What's Restored:</h3>
          <ul>
            <li>✅ Full account access</li>
            <li>✅ Login enabled</li>
            <li>✅ Dashboard access</li>
            <li>✅ All features available</li>
          </ul>
          
          <p><strong>Note:</strong> Your products may still be unpublished. You can republish them from your dashboard.</p>
          
          <a href="${vars.dashboardUrl || '#'}" class="button">
            Go to Dashboard
          </a>
          
          <p style="margin-top: 30px;">
            <strong>Important:</strong><br>
            Please review our <a href="#">Terms of Service</a> to avoid future suspensions.
          </p>
        </div>
        
        <div class="footer">
          <p>Welcome back!</p>
        </div>
      </div>
    </body>
    </html>
  `,

  text: `
Account Reactivated!

Hello ${vars.userName},

Great news! Your account has been successfully reactivated and you now have full access.

What's Restored:
- Full account access
- Login enabled
- Dashboard access
- All features available

Note: Your products may still be unpublished. You can republish them from your dashboard.

Go to Dashboard: ${vars.dashboardUrl || 'Login to your account'}

Important: Please review our Terms of Service to avoid future suspensions.

---
Welcome back!
  `
});

// ============================================================================
// 3. TICKET RESPONSE (Admin Reply)
// ============================================================================

export const ticketResponse = (vars: EmailVariables): EmailTemplate => ({
  subject: `📬 Response to Your Ticket #${vars.ticketNumber}`,

  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
        .ticket-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📬 New Response</h1>
        </div>
        
        <div class="content">
          <p>Hello ${vars.userName},</p>
          
          <div class="ticket-box">
            <strong>Ticket #${vars.ticketNumber}</strong><br>
            ${vars.adminName ? `Responded by: ${vars.adminName}` : 'Our support team has responded to your ticket'}
          </div>
          
          <p>We've added a new response to your support ticket. Please log in to view the full conversation and respond if needed.</p>
          
          <a href="${vars.supportUrl || '#'}" class="button">
            View Ticket
          </a>
          
          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            <strong>Tip:</strong> Responding quickly helps us resolve your issue faster!
          </p>
        </div>
        
        <div class="footer">
          <p>Thank you for your patience</p>
        </div>
      </div>
    </body>
    </html>
  `,

  text: `
New Response to Your Ticket

Hello ${vars.userName},

We've responded to your support ticket #${vars.ticketNumber}.

${vars.adminName ? `Responded by: ${vars.adminName}\n` : ''}

Please log in to view the full conversation and respond if needed.

View Ticket: ${vars.supportUrl || 'Log in to your account'}

Tip: Responding quickly helps us resolve your issue faster!

---
Thank you for your patience
  `
});

// ============================================================================
// 4. APPEAL STATUS UPDATE
// ============================================================================

export const appealStatusUpdate = (vars: EmailVariables & { status: string }): EmailTemplate => ({
  subject: `${vars.status === 'approved' ? '✅' : '📋'} Appeal Update - Ticket #${vars.ticketNumber}`,

  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${vars.status === 'approved' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
        .status-box { background: ${vars.status === 'approved' ? '#d1fae5' : '#fef3c7'}; border-left: 4px solid ${vars.status === 'approved' ? '#10b981' : '#f59e0b'}; padding: 15px; margin: 20px 0; }
        .button { display: inline-block; background: ${vars.status === 'approved' ? '#10b981' : '#f59e0b'}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${vars.status === 'approved' ? '✅ Appeal Approved' : '📋 Appeal Status Update'}</h1>
        </div>
        
        <div class="content">
          <p>Hello ${vars.userName},</p>
          
          <div class="status-box">
            <strong>Ticket #${vars.ticketNumber}</strong><br>
            Status: <strong>${vars.status.toUpperCase()}</strong>
          </div>
          
          ${vars.status === 'approved' ? `
            <p>Good news! Your appeal has been approved and your account will be reactivated shortly.</p>
          ` : vars.status === 'rejected' ? `
            <p>After careful review, we've made the decision to maintain the current suspension.</p>
            ${vars.reason ? `<p><strong>Reason:</strong> ${vars.reason}</p>` : ''}
          ` : `
            <p>Your appeal status has been updated to: <strong>${vars.status}</strong></p>
          `}
          
          <a href="${vars.supportUrl || '#'}" class="button">
            View Details
          </a>
        </div>
        
        <div class="footer">
          <p>Have questions? Contact our support team</p>
        </div>
      </div>
    </body>
    </html>
  `,

  text: `
Appeal Status Update

Hello ${vars.userName},

Your appeal (Ticket #${vars.ticketNumber}) status has been updated.

Status: ${vars.status.toUpperCase()}

${vars.status === 'approved' ? 'Good news! Your appeal has been approved and your account will be reactivated shortly.' : ''}
${vars.status === 'rejected' && vars.reason ? `Reason: ${vars.reason}` : ''}

View Details: ${vars.supportUrl || 'Log in to your account'}

---
Have questions? Contact our support team
  `
// ============================================================================
// 5. PRODUCT STATUS UPDATE
// ============================================================================

export const productStatusUpdate = (vars: EmailVariables & { status: string; productName: string }): EmailTemplate => ({
    subject: `${vars.status === 'published' ? '🎉' : '⚠️'} Product ${vars.status === 'published' ? 'Live' : 'Update'}: ${vars.productName}`,

    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${vars.status === 'published' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)'}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
        .status-box { background: ${vars.status === 'published' ? '#d1fae5' : '#fee2e2'}; border-left: 4px solid ${vars.status === 'published' ? '#10b981' : '#ef4444'}; padding: 15px; margin: 20px 0; }
        .button { display: inline-block; background: ${vars.status === 'published' ? '#10b981' : '#333'}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Product ${vars.status === 'published' ? 'Approved' : vars.status === 'rejected' ? 'Action Required' : 'Status Update'}</h1>
        </div>
        
        <div class="content">
          <p>Hello ${vars.userName},</p>
          
          <div class="status-box">
            <strong>Product: ${vars.productName}</strong><br>
            Status: <strong>${vars.status.toUpperCase()}</strong>
          </div>
          
          ${vars.status === 'published' ? `
            <p>Congratulations! Your product has been verified and is now live on the marketplace.</p>
          ` : vars.status === 'rejected' ? `
            <p>Unfortunately, your product submission has been rejected.</p>
            ${vars.reason ? `<p><strong>Reason:</strong> ${vars.reason}</p>` : ''}
            <p>Please make the necessary changes and submit for review again.</p>
          ` : `
            <p>Your product status has been updated to: <strong>${vars.status}</strong></p>
             ${vars.reason ? `<p><strong>Reason:</strong> ${vars.reason}</p>` : ''}
          `}
          
          <a href="${vars.dashboardUrl || '#'}" class="button">
            Go to Products
          </a>
        </div>
        
        <div class="footer">
          <p>This is an automated message</p>
        </div>
      </div>
    </body>
    </html>
  `,

    text: `
Product Update: ${vars.productName}

Hello ${vars.userName},

Your product "${vars.productName}" status is now: ${vars.status.toUpperCase()}

${vars.status === 'published' ? 'Congratulations! Your product is now live.' : ''}
${vars.status === 'rejected' && vars.reason ? `Reason: ${vars.reason}` : ''}

Manage Products: ${vars.dashboardUrl || 'Login to your dashboard'}

---
Automated Message
  `
  });

  // ============================================================================
  // 6. PAYOUT STATUS UPDATE
  // ============================================================================

  export const payoutStatusUpdate = (vars: EmailVariables & { status: string; amount: string; date: string }): EmailTemplate => ({
    subject: `${vars.status === 'processed' ? '💰' : 'ℹ️'} Payout ${vars.status === 'processed' ? 'Sent' : 'Update'}: ${vars.amount}`,

    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${vars.status === 'processed' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
        .amount-box { text-align: center; padding: 20px; background: #f9fafb; border-radius: 8px; margin: 20px 0; }
        .amount { font-size: 32px; font-weight: bold; color: #10b981; }
        .button { display: inline-block; background: #333; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${vars.status === 'processed' ? 'Payout Processed' : 'Payout Update'}</h1>
        </div>
        
        <div class="content">
          <p>Hello ${vars.userName},</p>
          
          <div class="amount-box">
             <div class="amount">${vars.amount}</div>
             <div>Status: ${vars.status.toUpperCase()}</div>
             <div style="font-size: 14px; color: #666; margin-top: 5px;">${vars.date}</div>
          </div>
          
          ${vars.status === 'processed' ? `
            <p>We've processed your payout. It should reflect in your bank account within 2-3 business days.</p>
          ` : `
            <p>There is an update regarding your payout request.</p>
             ${vars.reason ? `<p><strong>Note:</strong> ${vars.reason}</p>` : ''}
          `}
          
          <a href="${vars.dashboardUrl || '#'}" class="button">
            View Payouts
          </a>
        </div>
        
        <div class="footer">
          <p>Financial Services Team</p>
        </div>
      </div>
    </body>
    </html>
  `,

    text: `
Payout Update: ${vars.amount}

Hello ${vars.userName},

Status: ${vars.status.toUpperCase()}
Amount: ${vars.amount}
Date: ${vars.date}

${vars.status === 'processed' ? 'Funds should reflect in 2-3 business days.' : ''}
${vars.reason ? `Note: ${vars.reason}` : ''}

View Payouts: ${vars.dashboardUrl || 'Login to your dashboard'}

---
Financial Services Team
  `
  });

  // ============================================================================
  // HELPER FUNCTION TO SEND EMAIL
  // ============================================================================

  export async function sendEmail(to: string, template: EmailTemplate) {
    // This would integrate with your email service
    // Examples:

    // Option 1: Backend API Call
    // await apiClient.post('/email/send', ...);

    // Option 2: Resend
    // await resend.emails.send({ from: 'noreply@yourapp.com', to, ...template });

    // Option 3: SendGrid
    // await sgMail.send({ from: 'noreply@yourapp.com', to, ...template });

    console.log('Email would be sent to:', to);
console.log('Subject:', template.subject);

return { success: true };
}
