# Patient Portal

A modern patient portal built with Next.js, allowing patients to access their medical information, appointments, prescriptions, and more.

## Features

- 📋 Dashboard Overview
- 💬 Messages
- 📅 Appointments & Consultations
- 💊 Subscriptions & Orders
- 🏥 Medical History & Documents
- 🛍️ Shop
- 🔐 Secure Auto-Login from Main Website

## Getting Started

First, install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

### Environment Variables

Create a `.env.local` file in the root directory. See [ENV_SETUP.md](./ENV_SETUP.md) for detailed configuration instructions.

**Quick Setup**:

```env
# CRM Configuration
CRM_HOST=https://crm.myrocky.ca
CRM_API_TOKEN=your_secure_token_here

# Patient Portal Configuration
PORTAL_HOST=http://localhost:3000  # Development
# PORTAL_HOST=https://account.myrocky.ca  # Production
```

**Important**: The `CRM_API_TOKEN` must match the `PATIENT_PORTAL_API_TOKEN` in the main website's environment. See [ENV_SETUP.md](./ENV_SETUP.md) for details.

### Development

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/page.jsx`. The page auto-updates as you edit the file.

### Build for Production

```bash
npm run build
npm start
```

## Auto-Login Integration

This patient portal receives secure auto-login redirects from the main website. See [AUTO_LOGIN_SETUP.md](./AUTO_LOGIN_SETUP.md) for detailed integration documentation.

### Quick Overview

1. **Main Website** → Calls `/api/my-account-url` when user clicks "My Account"
2. **API** → Authenticates with CRM and requests auto-login link from this portal
3. **Portal** → Generates secure token and returns auto-login URL
4. **User** → Redirected to `/auto-login?token=...` page
5. **Portal** → Verifies token, creates session, and redirects to dashboard

For complete setup instructions, authentication flow, and security considerations, see [AUTO_LOGIN_SETUP.md](./AUTO_LOGIN_SETUP.md).

## Project Structure

```
patient-portal/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (dashboard)/          # Dashboard pages
│   │   │   ├── home/             # Dashboard home
│   │   │   ├── appointments/     # Appointments page
│   │   │   ├── consultations/    # Consultations page
│   │   │   ├── messages/         # Messages page
│   │   │   ├── orders/           # Orders page
│   │   │   ├── subscriptions/    # Subscriptions page
│   │   │   ├── treatments/       # Treatments page
│   │   │   ├── shop/             # Shop page
│   │   │   ├── profile/          # Profile page
│   │   │   ├── medical-history/  # Medical history
│   │   │   ├── documents/        # Documents
│   │   │   ├── billing-shipping/ # Billing & shipping
│   │   │   ├── contact/          # Contact
│   │   │   └── layout.jsx        # Dashboard layout
│   │   ├── api/                  # API routes
│   │   │   └── user/
│   │   │       ├── auto-login-link/   # Generate auto-login tokens
│   │   │       └── verify-auto-login/ # Verify auto-login tokens
│   │   ├── auto-login/           # Auto-login page
│   │   ├── layout.jsx            # Root layout
│   │   ├── page.jsx              # Home page
│   │   └── globals.css           # Global styles
│   └── components/               # React components
│       ├── Navbar/               # Navigation bar
│       ├── Sidebar/              # Sidebar navigation
│       ├── home/                 # Home dashboard components
│       ├── appointments/         # Appointment components
│       ├── consultations/        # Consultation components
│       ├── messages/             # Message components
│       ├── orders/               # Order components
│       ├── subscriptions/        # Subscription components
│       ├── treatments/           # Treatment components
│       ├── shop/                 # Shop components
│       ├── profile/              # Profile components
│       ├── medical-history/      # Medical history components
│       ├── documents/            # Document components
│       ├── billing-shipping/     # Billing components
│       └── utils/                # Utility components
└── AUTO_LOGIN_SETUP.md           # Auto-login documentation
```

## Technologies

- **Framework**: [Next.js 16](https://nextjs.org/)
- **React**: 19.2
- **Styling**: Tailwind CSS 4
- **Icons**: React Icons

## Deployment

### Vercel (Recommended)

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial
- [Next.js GitHub repository](https://github.com/vercel/next.js)
- [Auto-Login Setup Guide](./AUTO_LOGIN_SETUP.md) - integration with main website

## Support

For issues or questions, contact the development team.
