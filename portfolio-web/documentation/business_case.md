# Portfolio Project: Business Cases

This document outlines the functional requirements and business logic for the professional portfolio web application.

## *BC001 - Hero Section and Dynamic Header*
As a Visitor or Recruiter
I need to see a clean, distraction-free portrait and summary of the professional upon landing, with a navigation header that only appears as I scroll down.
So that I can focus on the initial high-impact introduction before accessing navigation tools.

**Assumptions and Details:**
- The "Portrait" section is the first visual impact and should occupy the full viewport height (100vh).
- Details tech considerations:
    - Use an Intersection Observer or scroll event listener to track the visibility of the Portrait section.
    - The Header should have a "sticky" or "fixed" position but remain hidden (opacity 0 or translated out of view) while the Portrait is in view.
    - Transition for the header appearance must be smooth (approx. 300ms).
- Data validation rules:
    - The "Big Text" highlights must be passed as an array of strings to a highlight component.
- Entities involved:
    - Header Component: Contains links to Projects, Experience, and Contact.
    - Portrait Section: Contains the main hero text and background/illustration.
- If error occurs:
    - If the observer fails, the header should default to visible to ensure navigation is never lost.

**Allowed roles:**
    - Visitor (Public)

**Acceptance Criteria:**
Given I am at the top of the page (Portrait section).
Then the navigation header should be invisible.
When I scroll down until the Portrait section starts leaving the viewport.
Then the navigation header should smoothly appear at the top of the screen.
When I scroll back to the very top.
Then the header should hide itself again.


## *BC002 - Categorized Project Grid*
As a Visitor or Recruiter
I need to view projects grouped by their technical domain (AI, Backend, Frontend).
So that I can evaluate specific technical expertise across different dimensions of development.

**Assumptions and Details:**
- Projects are displayed in a responsive grid layout.
- Details tech considerations:
    - Projects should be filtered into three distinct groups: "AI Project", "Backend Project", and "Front-end Project".
    - Each project card should follow the "Minimalist Professional" style with soft corners (12-16px).
- Data validation rules:
    - Each project entity must have a category field that matches one of the three defined groups.
- Entities involved:
    - ProjectCard: Component displaying image, title, and tech stack.
    - ProjectGrid: Container that maps and filters the project data.

**Allowed roles:**
    - Visitor (Public)

**Acceptance Criteria:**
Given a collection of projects.
When I scroll to the Projects section.
Then I should see three distinct headings: "AI Projects", "Backend Projects", and "Frontend Projects".
And each section should contain only the projects relevant to that category.

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

