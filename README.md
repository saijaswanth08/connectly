# Connectly 🌐
### *The Ultimate Digital Relationship Memory System & Professional Networking Hub*

Connectly is a state-of-the-art **Personal Relationship Management (PRM)** platform designed for modern professionals, entrepreneurs, and networkers. Unlike traditional, rigid CRMs, Connectly acts as a digital extension of your memory, helping you cultivate, organize, track, and visualize your professional connections with gorgeous aesthetics and seamless interactivity.

---

## 🚀 Key Product Features

Connectly is packed with features designed to help you build and maintain stronger relationships:

### 1. Unified Relationship Dashboard
*   **Intuitive Contact Hub**: Manage your entire professional directory with smooth sorting, search-highlighting, and prioritized visual categories.
*   **Priority Grouping**: Keep your high-value connections at your fingertips with color-coded priority levels (`VIP`, `High`, `Medium`, and `Low`).
*   **Premium Skeleton Loading**: Every dashboard view leverages fluid, custom-built shimmer skeleton screens for an elite, high-performance user experience.

### 2. Interactive Network Map (D3 Force-Directed Canvas)
*   **Visual Social Graph**: View your professional circle as a live interactive network map. Contacts are represented as nodes, and relationship links are represented as edges.
*   **Physics-Driven Force Simulation**: Nodes dynamically float, attract, and repel, settling into a beautiful structural mesh. Drag nodes, zoom smoothly via mouse wheel, or pan the view.
*   **Custom Relationships**: Link two contacts together directly on the canvas and define their connection type (e.g., *Colleague, Mentor, Investor, Partner, Client, Friend*).

### 3. Digital Business Cards (Public Profiles)
*   **Profile Customization**: Design a public business profile card highlighting your job title, company, bio, social links, and custom banner theme.
*   **Shareable Links**: Share your unique public business card url (`/profile/:id`) to let contacts view your credentials and get in touch with you.

### 4. Interactive Timeline & Touchpoints
*   **Detailed Profile Views**: Drill down into a contact's profile to view contact details, private notes, and interaction history.
*   **Interaction Tracking**: Log notes, meetings, and follow-ups to maintain a chronological timeline of every conversation.

### 5. Smart Follow-Ups & Reminders
*   **Reminders & Alarms**: Set scheduled notification alarms for future reach-outs so no critical relationship goes cold.
*   **Networking Insights**: View key analytics, including network size growth, contact priority distributions, and engagement frequency scores.

### 6. Built-in Communication Suites
*   **Outreach simulator**: Draft and track professional messages directly within the outreach simulator dashboard.
*   **Video Meetings Scheduler**: Set up, join, and simulate video call mockrooms to check in on relationships seamlessly.

---

## 🛠 Under the Hood: Tech Stack & Architecture

Connectly is built using modern, production-ready technology:

*   **Frontend Core**: React 18, TypeScript, and Vite for lightning-fast hot module reloading (HMR).
*   **Styling & Components**: Tailwind CSS for responsive layouts, combined with Framer Motion for micro-animations and Shadcn UI (Radix UI) for accessible primitives.
*   **Backend & DB**: Supabase (PostgreSQL database, Supabase Auth, and real-time JWT verification).
*   **Auxiliary Server**: Node.js Express server running SMTP engines for sending transactional notifications, verification emails, andOTP codes.

### 📁 Project Architecture & Directories

```
connectly/
├── src/
│   ├── components/       # Reusable layout components (AppLayout, ProtectedRoute, Skeletons)
│   ├── hooks/            # Custom React hooks (useAuth, useContacts, useConnections)
│   ├── lib/              # API connections and third-party SDK client setups (Supabase)
│   ├── pages/            # Core views (Landing, Dashboard, NetworkMap, Access & Security, PublicProfile)
│   ├── App.tsx           # Route declarations, Suspense shells, and React Query Providers
│   └── main.tsx          # Application entrypoint
├── api/                  # Backend Express server (SMTP service, notification loops)
├── public/               # Static public assets and banner graphics
├── tailwind.config.ts    # Global layout style configurations
└── tsconfig.json         # TypeScript compiler configurations
```

---

## ⚙️ How the Project Works

### ⚡ Fast Auth State Hydration
To eliminate initial route-loading blank pages, Connectly checks `localStorage` for an existing, non-expired Supabase session token *synchronously* on application load.
*   If a session exists, the UI hydrates the auth state **instantly**, letting users see the dashboard immediately.
*   An asynchronous validation check is subsequently sent to Supabase in the background to guarantee token authenticity without blocking layout mounts.

### 🔄 Intelligent Canvas Simulation (Network Map)
The Network Map combines React refs and manual canvas drawings to optimize GPU rendering:
1.  **Skeleton State Routing**: During initial data fetching, the canvas container is hidden, and a floating network node skeleton screen is displayed.
2.  **Stateful Mount Reactivity**: The physics simulation effect relies on `isLoading` as a dependency. As soon as data loads and the skeleton unmounts, the canvas element is introduced to the DOM. The hook registers a `ResizeObserver` to read the exact parent dimensions, dynamically positions the nodes, pre-runs the initial simulation steps, and boots up the `requestAnimationFrame` loop.
3.  **Performance Freeze Guard**: If the user is not actively panning, dragging, or simulating layout forces, the `tick()` rendering loop intelligently pauses, dropping CPU/GPU usage to `0%`.

---

## 📦 Local Installation & Setup

Get Connectly up and running locally on your computer in just a few steps:

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Step 1: Clone the Repository
```bash
git clone https://github.com/saijaswanth08/connectly
cd connectly
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Environment Configuration
Create a `.env` file in the root directory and supply your Supabase keys:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_public_key
```

### Step 4: Run the Development Server
```bash
npm run dev
```
*This command starts both the Vite React frontend and the Express backend concurrently.*

Open **[http://localhost:8080](http://localhost:8080)** in your browser to view the application.

---

## 👨‍💻 Contributing & Authorship

Developed and maintained by **[Sai Jaswanth](https://github.com/saijaswanth08)**. Connectly is built with attention to design aesthetics, premium performance, and relationship-building productivity. 
