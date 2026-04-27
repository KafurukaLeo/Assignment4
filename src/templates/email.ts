// Each function takes the dynamic data and returns a complete HTML string
// In a real app you might use a templating engine like Handlebars or MJML
// for more complex designs

export  function welcomeEmail(name: string) {
    return `
     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #FF5A5F;">Welcome to Airbnb, ${name}!</h1>
      <p>Your account has been created successfully.</p>
      <p>Start exploring listings and book your next stay.</p>
      <a href="http://localhost:3000" style="background: #FF5A5F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
        Explore Listings
      </a>
    </div>
    `;
};

export function passwordResetEmail(name: string, resetLink: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1>Password Reset Request</h1>
      <p>Hi ${name}, we received a request to reset your password.</p>
      <p>Click the button below. This link expires in 1 hour.</p>
      <a href="${resetLink}" style="background: #FF5A5F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
        Reset Password
      </a>
      <p style="color: #999; font-size: 12px;">If you didn't request this, ignore this email.</p>
    </div>
  `;
}