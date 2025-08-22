# ExamAppNG - JAMB Coach

A comprehensive JAMB (Joint Admissions and Matriculation Board) coaching application built with React, TypeScript, and Supabase.

## Features

- **Comprehensive Question Sets**: 50 questions per subject across 5 JAMB subjects
- **Automated Question Generation**: New questions generated every 3 days at 6 AM Nigerian time
- **Subject Coverage**: Mathematics, Physics, Chemistry, Biology, and English Language
- **User Authentication**: Secure login and registration system
- **Subscription Model**: First set free, subscription required for continued access
- **Progress Tracking**: Monitor your performance across subjects
- **Mobile Responsive**: Works seamlessly on desktop and mobile devices

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Database, Auth, Storage, Edge Functions)
- **AI Integration**: DeepSeek API for question generation
- **Build Tool**: Vite
- **Deployment**: Web deployment ready

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Supabase account
- DeepSeek API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mitchell1972/examCoachAppNG.git
cd examCoachAppNG
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
DEEPSEEK_API_KEY=your_deepseek_api_key
```

4. Start the development server:
```bash
pnpm dev
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React Context providers
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and API clients
├── pages/              # Application pages/views
└── types/              # TypeScript type definitions
```

## Features

### Question Generation
- Automated generation using DeepSeek AI
- Scheduled for 6 AM Nigerian time every 3 days
- Non-overwriting question sets (historical preservation)
- Subject-specific prompts for Nigerian JAMB standards

### User Management
- Secure authentication via Supabase Auth
- Role-based access (Student/Admin)
- Profile management
- Subscription tracking

### Practice System
- 50 questions per subject per set
- Interactive question interface
- Progress tracking
- Set management (view/delete old sets)

## Deployment

The application is configured for easy deployment on various platforms:

- Build the project: `pnpm build`
- Deploy the `dist` folder to your hosting platform
- Ensure environment variables are configured in production

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the GitHub repository.

---

**ExamAppNG** - Empowering Nigerian students for JAMB success! 🇳🇬