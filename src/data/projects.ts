import type { Project } from '../types';

/**
 * Project data (Local storage for Master-Detail UI)
 */
export const projects: Project[] = [
  {
    id: 'ai-1',
    category: 'AI Project',
    title: 'Real Time Avatars',
    image: '/projects/real-time-portrait.png',
    shortDescription: 'AI Agent with real time video avatar generated and a second on, with just real time conversational voice agent.',
    detailDescription: 'A cutting-edge AI agent integration featuring a real-time video avatar generated dynamically, accompanied by a fully conversational voice agent. It provides low-latency, emotionally responsive interactions suitable for customer service and interactive digital human experiences.',
    tags: ['WebRTC', 'React', 'FastApi', 'liveavatar.com'],
    techStack: [
      { name: 'WebRTC', icon: 'webrtc' },
      { name: 'React', icon: 'react' },
      { name: 'FastApi', icon: 'fastapi' }
    ],
    cardGradient: 'linear-gradient(90deg, rgb(154 187 215 / 0%) 0%, rgb(138 147 242 / 23%) 75%, rgb(20 43 108 / 77%) 100%)',
    demoUrl: '/real-time',
    githubUrl: '',
    gallery: [
      '/projects/real-time-1.png',
      '/projects/real-time-2.png',
    ]
  },
  {
    id: 'ai-2',
    category: 'AI Project',
    title: 'Multimodal conversational agent',
    image: '/projects/chat-portrait.png',
    shortDescription: 'Similar to ChatGPT where you upload, create files and execute actions/workflows.',
    detailDescription: 'A comprehensive multimodal conversational agent modeled after advanced assistants like ChatGPT. Users can upload documents, dynamically generate files, and trigger complex automated workflows and actions driven by user prompts.',
    tags: ['React', 'n8n', 'Gemini', 'OpenAI'],
    techStack: [
      { name: 'React', icon: 'react' },
      { name: 'n8n', icon: 'n8n' },
      { name: 'Gemini', icon: 'gemini' },
      { name: 'OpenAI', icon: 'openai' }
    ],
    cardGradient: 'linear-gradient(133deg, rgb(249 255 236) 0%, rgb(230 234 251) 100%)',
    demoUrl: '/chat',
    githubUrl: '',
    gallery: [
      'https://via.placeholder.com/800x450/003566/fefae0?text=Chat+Interface',
      'https://via.placeholder.com/800x450/003566/fefae0?text=Workflow+Builder',
    ]
  },
  {
    id: 'frontend-1',
    category: 'Front-end Project',
    title: 'Portfolio',
    image: '/projects/portfolio-hero-section.png',
    shortDescription: 'This current site with all the background tools used.',
    detailDescription: 'The very portfolio site you are viewing, representing a culmination of modern web development practices. It showcases my professional work and integrates various background tools designed to highlight skills, project history, and technical proficiencies.',
    tags: ['React', 'FastApi', 'AWS', 'Figma', 'Docker'],
    techStack: [
      { name: 'React', icon: 'react' },
      { name: 'FastApi', icon: 'fastapi' },
      { name: 'AWS', icon: 'aws' },
      { name: 'Figma', icon: 'figma' },
      { name: 'Docker', icon: 'docker' }
    ],
    cardGradient: 'linear-gradient(112deg, rgb(248 242 255) 0%, rgb(202 210 255) 100%)',
    demoUrl: '/',
    githubUrl: '',
    gallery: [
      'https://via.placeholder.com/800x450/ffc300/000814?text=Portfolio+Home',
      'https://via.placeholder.com/800x450/ffc300/000814?text=Project+View',
    ]
  }
];
