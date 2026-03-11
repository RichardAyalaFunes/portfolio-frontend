import type { Experience } from '../types';

/**
 * Datos de experiencia profesional (en orden cronológico inverso)
 */
export const experiences: Experience[] = [
  {
    id: 'purrfect-hire',
    company: 'PURRFECT HIRE',
    role: 'Technical Lead',
    startDate: '2025-05',
    endDate: 'Present',
    description:
      'Recruitment startup specialized in early-stage companies with global operations.',
    responsibilities: [
      'Led the design and early development of core ATS and CRM features built with Retool, FastAPI, and PostgreSQL.',
      'Built the ATS backend API using Clean Architecture, integrating FastAPI, Apify, Slack notifications, and file management workflows, and added pytest test coverage plus CI/CD pipelines with GitHub Actions.',
      'Developed a Chromium extension using HTML, JavaScript, CSS, and Bootstrap to generate structured information and extract reports from the ATS, reducing execution time to under 5 seconds.',
      'Automated workflows with OpenAI, Python, Retool, n8n, and SQL, reducing execution time from 15 minutes to 10 seconds.',
      'Managed key company platforms: Google Workspace Admin, Slack, Notion, Digital Ocean, and Retool with direct responsibility for access control and information security.',
      'Supported operational and billing processes when needed.',
      'Documented processes and created a structured knowledge base in Notion, standardizing information about people, systems, tools, and operational procedures.',
      'Researched global AI regulations (including the EU AI Act) to support compliance decisions.',
      'Led candidate search, interviews, and hiring processes in English.',
      'Applied Scrum methodology and acted as Product Owner to guide coordinated product evolution.',
    ],
  },
  {
    id: 'indra-project-lead',
    company: 'INDRA',
    role: 'Project Lead Development – Innovation Area',
    startDate: '2024-10',
    endDate: '2025-05',
    description:
      'Consulting and technology development company with a presence in 46 countries.',
    responsibilities: [
      'Led a technical audit team of 8 members applying SCRUM, focused on functional analysis, source code, databases, infrastructure, and security, in direct communication with the client.',
      'Directed the full development lifecycle of software projects, from requirements gathering and estimations to development, for ETL and LLM-based solutions.',
      'Analyzed, developed, and deployed a RAG chatbot system using OpenAI API, Llama 3.2, n8n, Python, Django, PostgreSQL, Supabase, Google API on Red Hat Linux with Podman and Docker.',
      'Built Python-based graph route optimization solutions with A*, GDB, and QGIS, improving route planning efficiency.',
    ],
  },
  {
    id: 'indra-team-leader',
    company: 'INDRA',
    role: 'Team Leader and Junior Analyst – Process Transformation',
    startDate: '2023-03',
    endDate: '2024-10',
    description:
      'Consulting and technology development company with a presence in 46 countries.',
    recognition: 'Exceptional Execution Award 2023',
    responsibilities: [
      'Managed two teams: Processes (2 members) and Development (5 members).',
      'Presented initiatives and held meetings directly with clients to define technological solutions.',
      'Analyzed unstandardized data, proposed KPIs, and developed technological solutions.',
      'Monitored project financial control through economic KPIs.',
      'Planned and monitored web projects, automation, and Power BI implementations.',
      'Developed automations and ETL processes in Python; reporting and data analysis with Power BI, Splunk, GPT, and OpenAI API.',
      'Improved processes and information management using Office 365 (Loop, Power Automate, Excel).',
      'Conducted interviews for candidates in data analysis and web development roles.',
    ],
  },
  {
    id: 'indra-process-management',
    company: 'INDRA',
    role: 'Process Management – Processes Quality and PMO Area',
    startDate: '2022-02',
    endDate: '2023-03',
    description:
      'Consulting and technology development company with a presence in 46 countries.',
    responsibilities: [
      'Automation and process improvement with Python, VBA, NodeJs, Jira API, and Excel.',
      'Documentation of processes, guidelines, and incidents.',
      'Support and training on Jira and other tools for employees.',
      'Propose and develop cross-cutting improvements and standardizations.',
    ],
  },
  {
    id: 'sonrisas-salud',
    company: 'SONRISAS Y SALUD',
    role: 'Freelance – Planning, analysis, and development',
    startDate: '2021-02',
    endDate: '2021-05',
    description:
      'Dental services, ranging from basic treatments to complex surgeries.',
    responsibilities: [
      'Service in web design, programming, and content writing.',
      'Plan, design, and develop the entire website.',
      'Research and develop SEO and User Experience completely.',
      'Research and write dental content.',
    ],
  },
];

