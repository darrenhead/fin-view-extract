# FinView - Financial Statement Analyzer

FinView is a modern web application that helps you analyze and extract insights from your financial statements. Upload your bank statements or credit card statements, and FinView will automatically extract and categorize your transactions, providing you with visual summaries and financial insights.

## Features

- **Statement Upload**: Upload PDF bank statements and credit card statements
- **Automatic Extraction**: Intelligent parsing of financial data from statements
- **Transaction Categorization**: Automatic categorization of transactions
- **Financial Summaries**: Quick view of total inflows, outflows, and balances
- **Statement-Type Awareness**: Different summaries for bank accounts vs. credit cards
- **Visual Analytics**: Charts and graphs to visualize spending patterns
- **Secure Authentication**: Protect your financial data with user accounts

## Technology Stack

- **Frontend**: React, TypeScript, Vite
- **UI Components**: shadcn/ui, Tailwind CSS
- **State Management**: React Context API, TanStack Query
- **Authentication**: Supabase Auth
- **Database**: Supabase
- **Data Visualization**: Recharts
- **Routing**: React Router v6

## Project Setup

### Prerequisites

- Node.js (v18 or later)
- npm or bun package manager

### Local Development

```sh
# Clone the repository
git clone https://github.com/darrenhead/fin-view-extract

# Navigate to the project directory
cd fin-view-extract

# Install the necessary dependencies
npm install
# or with bun
bun install

# Start the development server
npm run dev
# or with bun
bun run dev
```

The app will be available at http://localhost:5173/ by default.

## Deployment

This project is configured for deployment on Vercel:

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com/new)
3. Configure your project settings (or use the defaults)
4. Deploy to get a production URL instantly

### Custom Domain

You can connect a custom domain to your deployed application:

1. Go to your project on the Vercel dashboard
2. Navigate to Settings > Domains
3. Add your domain and follow the instructions to configure DNS settings

For more details, see [Vercel's documentation on custom domains](https://vercel.com/docs/projects/domains/add-a-domain)

## Development

You can develop this project in several ways:

- **Local Development**: Clone the repo and push changes via git
- **GitHub**: Edit files directly on GitHub or use GitHub Codespaces
- **Vercel CLI**: Use the Vercel CLI for preview deployments and testing

## License

This project is private and proprietary.
