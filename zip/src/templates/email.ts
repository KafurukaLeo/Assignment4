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
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #FF5A5F;">Booking Cancelled</h1>
      <p>Hi ${guestName}, your booking has been cancelled.</p>
      <table style="width:100%; border-collapse:collapse; margin-top:16px;">
        <tr><td style="padding:8px; border-bottom:1px solid #eee;"><strong>Listing</strong></td><td style="padding:8px; border-bottom:1px solid #eee;">${listingTitle}</td></tr>
        <tr><td style="padding:8px; border-bottom:1px solid #eee;"><strong>Check-in</strong></td><td style="padding:8px; border-bottom:1px solid #eee;">${checkIn}</td></tr>
        <tr><td style="padding:8px;"><strong>Check-out</strong></td><td style="padding:8px;">${checkOut}</td></tr>
      </table>
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
      <p>Click the button below to reset it. <strong>This link expires in 1 hour.</strong></p>
      <a href="${resetLink}" style="display:inline-block; background:#FF5A5F; color:white; padding:12px 24px; text-decoration:none; border-radius:4px; margin-top:8px;">Reset Password</a>
      <p style="margin-top:24px; color:#999; font-size:12px;">If you did not request this, ignore this email — your password will not change.</p>
    </div>
  `;
}
