# Portfolio Project: Business Cases

This document outlines the functional requirements and business logic for the professional portfolio web application.

## *BC001 - Hero Section and Dynamic Header*
As a Visitor or Recruiter
I need to see a clean, distraction-free portrait and summary of the professional upon landing, with a navigation header that only appears as I scroll down.
So that I can focus on the initial high-impact introduction before accessing navigation tools.

**Assumptions and Details:**
- The "Portrait" section is the first visual impact and should occupy the full viewport height (100vh).
- **Visual Impact:**
    - Interactive "AI Colors" background with multiple layered gradients.
    - Dynamic particle mesh (`tsparticles`) that reacts to mouse movement.
    - Floating technical icons (Python, React, AI) that move relative to the central card.
- **Technical Considerations:**
    - Centered glassmorphic card with `rounded-3xl` and `backdrop-blur`.
    - Implementation of a "mask-border" technique using `padding-box` and `border-box` for sharp gradient borders.
    - Content alignment using CSS Grid to ensure the Navigation Menu and Header Text share the same left-alignment pivot.
- **Entities involved:**
    - Header Component: Global sticky navigation (hidden in Hero).
    - HeroSection Component: Immersive intro with integrated navigation links.
- If error occurs:
    - If `tsparticles` fails to load, the background should gracefully fallback to the solid linear gradient.

**Allowed roles:**
    - Visitor (Public)

**Acceptance Criteria:**
Given I am at the top of the page (Portrait section).
Then the navigation header should be invisible.
When I scroll down until the Portrait section starts leaving the viewport.
Then the navigation header should smoothly appear at the top of the screen.
When I scroll back to the very top.
Then the header should hide itself again.


## *BC002 - Expandable Project List with Search*
As a Visitor or Recruiter
I need to view projects in an organized list and be able to search for specific skills or keywords.
So that I can quickly find relevant projects and explore their details efficiently without leaving the main view.

**Assumptions and Details:**
- Projects are displayed in a responsive, single-column accordion layout.
- Details tech considerations:
    - Each project card functions as an accordion that expands to reveal detailed descriptions, technologies used, and a media gallery when clicked.
    - Each project card should feature custom, light-themed radial gradients and floating image assets for a premium feel.
    - A search bar allows filtering across titles, descriptions, and tags in real-time.
    - The category headers have been removed to present a unified, continuous flow of projects.
- Entities involved:
    - ProjectCard: Component displaying overview and expandable details (Tech Stack, Gallery, Action buttons).
    - ProjectsSection: Container with search input that filters and maps the project data.

**Allowed roles:**
    - Visitor (Public)

**Acceptance Criteria:**
Given a collection of projects.
When I scroll to the Projects section.
Then I should see a search bar and a single-column list of all projects.
When I type a query into the search bar, the list filters in real-time.
When I click on a project card, it expands smoothly to show further details, and its related image adjusts layout to maintain focus.

## *BC003 - Professional Experience Timeline*
As a Visitor or Recruiter
I need to see a clear list of previous responsibilities and companies.
So that I can understand the career progression and professional background.

**Assumptions and Details:**
- The experience should be listed in reverse chronological order.
- Details tech considerations:
    - Each entry must include: Company Name, Role, Date Range, and a list of key responsibilities/achievements.
- Allowed roles:
        - Visitor (Public)

**Acceptance Criteria:**
Given the user's professional history data.
When I scroll to the Experience section.
Then I should see a vertical list or timeline showing the different companies and roles held.
And each role should clearly display the specific responsibilities associated with it.

## *BC004 - Footer and Contact Information*
As a Visitor or Recruiter
I need to access contact information at the end of the page.
So that I can reach out for professional opportunities or inquiries.

**Assumptions and Details:**
- The footer should contain social links (LinkedIn, GitHub) and a professional email.
- Details tech considerations:
    - Use the Primary color #001d3d for the footer background to provide a strong visual anchor at the end of the page.
    - Text should use the light cream color #fefae0.

**Acceptance Criteria:**
Given I have reached the bottom of the page.
Then I should see the Footer section.
And it must contain clickable links to social profiles and a direct email link.

## *BC005 - Graphical skills visualizer*
As a Visitor or Recruiter
I need to see a visual representation of the competencies on different domains in a Spider Chart graph.
So that I can understand the general skills and expertise of the professional.

**Assumptions and Details:**
- The graph must be a "Skills graph" with the following domains: AI, Backend, Frontend, Data analysis, DevOps. The score for each domain must be: Basic, Intermediate, Advanced, Expert.
- Current values are:
    - AI: Advanced
    - Backend: Advanced
    - Frontend: Basic
    - Data analysis: Intermediate
    - DevOps: Basic
- This section must be below the Experience section.

**Acceptance Criteria:**
Given the user's skills data.
When I scroll to the Skills section.
Then I should see a "Skills graph" with the following domains: AI, Backend, Frontend, Data analysis, DevOps.
And each domain should have a score of: Basic, Intermediate, Advanced, Expert.

## *BC006 - AI Chatbot Interface*
As a Visitor or Recruiter
I need to interact with an AI Chatbot that knows the professional profile and projects.
So that I can quickly ask questions about the professional's background, tech stack, and experience in a conversational format.

**Assumptions and Details:**
- A dedicated route (`/chat`) presenting a responsive three-column layout.
- **Layout Structure:**
    - Left Column (Chat History): Displays a list of recent and previous mock conversations with titles. Interactive but currently uses dummy data.
    - Middle Column (Chat Window): The main conversational interface. Includes user and AI message bubbles with avatars, date/time stamps, and an input area that supports text (auto-resizing), file attachments, and voice recordings.
    - Right Column (Tips): A static section displaying suggestions on what to ask the AI and information about the underlying simulated architecture.
- **Responsiveness Details:**
    - On wide screens, all three columns are visible.
    - On medium screens, the Right Column (Tips) becomes a drawer toggled by an icon.
    - On mobile screens, only the Middle Column is visible by default. Both History and Tips become interactive drawers toggled by icons to maximize chat space.
- **Technical Considerations:**
    - Simulation of backend workflows: When a user sends a message, a visual banner simulates an N8N webhook execution to show how background processes operate.
    - Message styling uses specific light theme colors (`bg-lightBg-1` for main background, `bg-lightBg-2` for AI messages and tips, `bg-light-3` for inputs) and features user (`<User />`) and AI circular avatars.
- **Entities involved:**
    - ChatLayout: Main container handling the columns and responsive drawer logic.
    - ChatWindow: Handles message list, typing indicators, N8N simulation, and input logic.
    - ChatHistory and ChatTips: Supplementary information components.

**Allowed roles:**
    - Visitor (Public)

**Acceptance Criteria:**
Given I navigate to the `/chat` route.
Then I should see a chat interface adapted to my screen size (3 columns on desktop, drawers on mobile).
When I type a message and submit it.
Then my message should appear with a user avatar, and an N8N simulation banner should appear indicating a background process.
After a brief delay.
Then a mock AI response should appear with an "AI" avatar.
