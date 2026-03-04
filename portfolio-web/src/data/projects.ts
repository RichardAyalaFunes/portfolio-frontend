import type { Project } from '../types';

/**
 * Project data (Local storage for Master-Detail UI)
 */
export const projects: Project[] = [
  // AI Projects
  {
    id: 'ai-1',
    category: 'AI Project',
    title: 'Machine Learning Model',
    image: 'https://via.placeholder.com/400x300/001d3d/fefae0?text=AI+Project+1',
    shortDescription: 'Sistema de aprendizaje automático para análisis predictivo',
    detailDescription: 'This comprehensive project involves building a sophisticated machine learning model for predictive analysis. It ingests large datasets, performs feature engineering, and uses advanced algorithms to output highly accurate predictions.',
    tags: ['Python', 'TensorFlow', 'Data Science'],
    techStack: [
      { name: 'Python', icon: 'python' },
      { name: 'TensorFlow', icon: 'tensorflow' },
      { name: 'Scikit-learn', icon: 'scikitlearn' }
    ],
    demoUrl: 'https://example.com/demo/ai-1',
    githubUrl: 'https://github.com/example/ai-1',
    gallery: [
      'https://via.placeholder.com/800x450/001d3d/fefae0?text=Dashboard+View',
      'https://via.placeholder.com/800x450/001d3d/fefae0?text=Model+Training',
    ]
  },
  {
    id: 'ai-2',
    category: 'AI Project',
    title: 'NLP Text Analyzer',
    image: 'https://via.placeholder.com/400x300/001d3d/fefae0?text=AI+Project+2',
    shortDescription: 'Analizador de texto con NLP (Procesamiento de Lenguaje Natural)',
    detailDescription: 'A natural language processing application capable of sentiment analysis, entity recognition, and text summarization using state-of-the-art transformer models.',
    tags: ['NLP', 'Transformers', 'SpaCy'],
    techStack: [
      { name: 'Python', icon: 'python' },
      { name: 'Transformers', icon: 'huggingface' },
      { name: 'spaCy', icon: 'spacy' }
    ],
    demoUrl: 'https://example.com/demo/ai-2',
    githubUrl: 'https://github.com/example/ai-2',
    gallery: [
      'https://via.placeholder.com/800x450/003566/fefae0?text=Text+Analysis',
      'https://via.placeholder.com/800x450/003566/fefae0?text=Sentiment+Graph',
    ]
  },

  // Backend Projects
  {
    id: 'backend-1',
    category: 'Backend Project',
    title: 'RESTful API Service',
    image: 'https://via.placeholder.com/400x300/003566/fefae0?text=Backend+1',
    shortDescription: 'API RESTful escalable con autenticación y caché',
    detailDescription: 'A robust, scalable RESTful API service built with Node.js and Express. Features include JWT authentication, Redis caching, and PostgreSQL integration for reliable data management.',
    tags: ['Node.js', 'Express', 'PostgreSQL'],
    techStack: [
      { name: 'Node.js', icon: 'nodejs' },
      { name: 'PostgreSQL', icon: 'postgresql' },
      { name: 'Redis', icon: 'redis' }
    ],
    demoUrl: 'https://example.com/demo/backend-1',
    githubUrl: 'https://github.com/example/backend-1',
    gallery: [
      'https://via.placeholder.com/800x450/003566/fefae0?text=API+Endpoints',
      'https://via.placeholder.com/800x450/003566/fefae0?text=Architecture+Diagram',
    ]
  },

  // Frontend Projects
  {
    id: 'frontend-1',
    category: 'Front-end Project',
    title: 'Interactive Dashboard',
    image: 'https://via.placeholder.com/400x300/ffc300/000814?text=Frontend+1',
    shortDescription: 'Dashboard interactivo con visualización de datos',
    detailDescription: 'A feature-rich frontend dashboard application built in React and Tailwind CSS. It supports real-time data visualization through customizable charts and interactive widgets.',
    tags: ['React', 'TypeScript', 'Tailwind CSS'],
    techStack: [
      { name: 'React', icon: 'react' },
      { name: 'TypeScript', icon: 'typescript' },
      { name: 'Tailwind CSS', icon: 'tailwindcss' }
    ],
    demoUrl: 'https://example.com/demo/frontend-1',
    githubUrl: 'https://github.com/example/frontend-1',
    gallery: [
      'https://via.placeholder.com/800x450/ffc300/000814?text=Main+Dashboard',
      'https://via.placeholder.com/800x450/ffc300/000814?text=Data+Charts',
    ]
  }
];
