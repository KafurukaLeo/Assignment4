export function welcomeEmail(name: string, role: string): string {
  const roleMessage =
    role === "host"
      ? "You're all set to create your first listing and start hosting guests!"
      : "You're all set to explore listings and book your next stay!";

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #FF5A5F;">Welcome to Airbnb, ${name}!</h1>
      <p>Your account has been created successfully.</p>
      <p>${roleMessage}</p>
      <a href="http://localhost:5000" style="display:inline-block; background:#FF5A5F; color:white; padding:12px 24px; text-decoration:none; border-radius:4px; margin-top:8px;">
        ${role === "host" ? "Create a Listing" : "Explore Listings"}
      </a>
    </div>
  `;
}

export function bookingConfirmationEmail(
  guestName: string,
  listingTitle: string,
  location: string,
  checkIn: string,
  checkOut: string,
  totalPrice: number,
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #FF5A5F;">Booking Confirmed!</h1>
      <p>Hi ${guestName}, your booking has been confirmed.</p>
      <table style="width:100%; border-collapse:collapse; margin-top:16px;">
        <tr><td style="padding:8px; border-bottom:1px solid #eee;"><strong>Listing</strong></td><td style="padding:8px; border-bottom:1px solid #eee;">${listingTitle}</td></tr>
        <tr><td style="padding:8px; border-bottom:1px solid #eee;"><strong>Location</strong></td><td style="padding:8px; border-bottom:1px solid #eee;">${location}</td></tr>
        <tr><td style="padding:8px; border-bottom:1px solid #eee;"><strong>Check-in</strong></td><td style="padding:8px; border-bottom:1px solid #eee;">${checkIn}</td></tr>
        <tr><td style="padding:8px; border-bottom:1px solid #eee;"><strong>Check-out</strong></td><td style="padding:8px; border-bottom:1px solid #eee;">${checkOut}</td></tr>
        <tr><td style="padding:8px;"><strong>Total</strong></td><td style="padding:8px;">$${totalPrice.toFixed(2)}</td></tr>
      </table>
      <p style="margin-top:16px; color:#666; font-size:13px;">Free cancellation is available up to 24 hours before check-in.</p>
    </div>
  `;
}

export function bookingCancellationEmail(
  guestName: string,
  listingTitle: string,
  checkIn: string,
  checkOut: string,
  reason?: string,
): string {
  const reasonHtml = reason 
    ? `<p style="margin-top:16px; padding:12px; background:#f8f8f8; border-left:4px solid #FF5A5F;"><strong>Reason:</strong> ${reason}</p>` 
    : "";

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #FF5A5F;">Booking Cancelled</h1>
      <p>Hi ${guestName}, your booking has been cancelled.</p>
      <table style="width:100%; border-collapse:collapse; margin-top:16px;">
        <tr><td style="padding:8px; border-bottom:1px solid #eee;"><strong>Listing</strong></td><td style="padding:8px; border-bottom:1px solid #eee;">${listingTitle}</td></tr>
        <tr><td style="padding:8px; border-bottom:1px solid #eee;"><strong>Check-in</strong></td><td style="padding:8px; border-bottom:1px solid #eee;">${checkIn}</td></tr>
        <tr><td style="padding:8px;"><strong>Check-out</strong></td><td style="padding:8px;">${checkOut}</td></tr>
      </table>
      ${reasonHtml}
      <p style="margin-top:16px;">Looking for another stay? We have thousands of listings waiting for you.</p>
      <a href="http://localhost:5000" style="display:inline-block; background:#FF5A5F; color:white; padding:12px 24px; text-decoration:none; border-radius:4px; margin-top:8px;">Find a Listing</a>
    </div>
  `;
}

export function passwordResetEmail(name: string, resetLink: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #FF5A5F;">Password Reset Request</h1>
      <p>Hi ${name}, we received a request to reset your password.</p>
      <p>Click the button below to reset it. <strong>This link expires in 30 minutes.</strong></p>
      <a href="${resetLink}" style="display:inline-block; background:#FF5A5F; color:white; padding:12px 24px; text-decoration:none; border-radius:4px; margin-top:8px;">Reset Password</a>
      <p style="margin-top:24px; color:#999; font-size:12px;">If you did not request this, ignore this email — your password will not change.</p>
    </div>
  `;
}

/** FR-002: Email address verification */
export function emailVerificationEmail(name: string, verifyLink: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #FF5A5F;">Verify Your Email Address</h1>
      <p>Hi ${name}, thank you for registering on Airbnb!</p>
      <p>Please click the button below to verify your email address. <strong>This link expires in 24 hours.</strong></p>
      <a href="${verifyLink}" style="display:inline-block; background:#FF5A5F; color:white; padding:12px 24px; text-decoration:none; border-radius:4px; margin-top:8px;">Verify Email</a>
      <p style="margin-top:24px; color:#999; font-size:12px;">If you did not create an account, you can safely ignore this email.</p>
    </div>
  `;
}

/** FR-005: Account locked notification */
export function accountLockedEmail(name: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #FF5A5F;">Account Temporarily Locked</h1>
      <p>Hi ${name}, your account has been temporarily locked due to 5 consecutive failed login attempts.</p>
      <p>Your account will automatically unlock after <strong>15 minutes</strong>.</p>
      <p>If this wasn't you, we recommend resetting your password immediately.</p>
      <a href="${process.env["FRONTEND_URL"] ?? "http://localhost:5173"}/forgot-password" style="display:inline-block; background:#FF5A5F; color:white; padding:12px 24px; text-decoration:none; border-radius:4px; margin-top:8px;">Reset Password</a>
      <p style="margin-top:24px; color:#999; font-size:12px;">If you need further assistance, contact our support team.</p>
    </div>
  `;
}

export function newBookingRequestEmail(
  hostName: string,
  guestName: string,
  listingTitle: string,
  checkIn: string,
  checkOut: string,
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #FF5A5F;">New Booking Request</h1>
      <p>Hi ${hostName}, you have a new booking request for <strong>${listingTitle}</strong>.</p>
      <p><strong>Guest:</strong> ${guestName}</p>
      <p><strong>Check-in:</strong> ${checkIn}</p>
      <p><strong>Check-out:</strong> ${checkOut}</p>
      <p>Please log in to your dashboard to confirm or decline this request.</p>
      <a href="${process.env["FRONTEND_URL"] ?? "http://localhost:5173"}/dashboard/bookings" style="display:inline-block; background:#FF5A5F; color:white; padding:12px 24px; text-decoration:none; border-radius:4px; margin-top:8px;">Go to Dashboard</a>
    </div>
  `;
}

export function hostStatusUpdateEmail(name: string, status: string): string {
  const message = status === "approved" 
    ? "Congratulations! Your host application has been approved. You can now start publishing listings."
    : "Your host account status has been updated to: " + status + ". Please contact support if you have any questions.";
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #FF5A5F;">Host Account Update</h1>
      <p>Hi ${name},</p>
      <p>${message}</p>
      <a href="${process.env["FRONTEND_URL"] ?? "http://localhost:5173"}/dashboard" style="display:inline-block; background:#FF5A5F; color:white; padding:12px 24px; text-decoration:none; border-radius:4px; margin-top:8px;">Go to Dashboard</a>
    </div>
  `;
}

export function userBanStatusEmail(name: string, status: string): string {
  const message = status === "banned"
    ? "Your account has been suspended by our trust and safety team."
    : "Your account has been reactivated. You can now log in again.";
    
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #FF5A5F;">Account Status Update</h1>
      <p>Hi ${name},</p>
      <p>${message}</p>
      <p>If you believe this was a mistake, please contact our support team.</p>
    </div>
  `;
}

