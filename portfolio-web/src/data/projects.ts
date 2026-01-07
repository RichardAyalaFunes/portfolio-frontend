import { Project } from '../types';

/**
 * Datos de proyectos del portfolio (placeholder)
 * Organizados por categoría: AI, Backend, Frontend
 */
export const projects: Project[] = [
  // AI Projects
  {
    id: 'ai-1',
    category: 'AI Project',
    title: 'Machine Learning Model',
    image: 'https://via.placeholder.com/400x300/001d3d/fefae0?text=AI+Project+1',
    techStack: ['Python', 'TensorFlow', 'Scikit-learn', 'Pandas'],
    description: 'Sistema de aprendizaje automático para análisis predictivo',
  },
  {
    id: 'ai-2',
    category: 'AI Project',
    title: 'NLP Text Analyzer',
    image: 'https://via.placeholder.com/400x300/001d3d/fefae0?text=AI+Project+2',
    techStack: ['Python', 'NLTK', 'spaCy', 'Transformers'],
    description: 'Analizador de texto con procesamiento de lenguaje natural',
  },
  
  // Backend Projects
  {
    id: 'backend-1',
    category: 'Backend Project',
    title: 'REST API Service',
    image: 'https://via.placeholder.com/400x300/003566/fefae0?text=Backend+1',
    techStack: ['Node.js', 'Express', 'PostgreSQL', 'Redis'],
    description: 'API RESTful escalable con autenticación y caché',
  },
  {
    id: 'backend-2',
    category: 'Backend Project',
    title: 'Microservices Architecture',
    image: 'https://via.placeholder.com/400x300/003566/fefae0?text=Backend+2',
    techStack: ['Docker', 'Kubernetes', 'gRPC', 'MongoDB'],
    description: 'Arquitectura de microservicios con orquestación',
  },
  {
    id: 'backend-3',
    category: 'Backend Project',
    title: 'GraphQL Gateway',
    image: 'https://via.placeholder.com/400x300/003566/fefae0?text=Backend+3',
    techStack: ['GraphQL', 'Apollo Server', 'TypeScript', 'Prisma'],
    description: 'Gateway GraphQL con resolución de esquemas federados',
  },
  
  // Frontend Projects
  {
    id: 'frontend-1',
    category: 'Front-end Project',
    title: 'React Dashboard',
    image: 'https://via.placeholder.com/400x300/ffc300/000814?text=Frontend+1',
    techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Recharts'],
    description: 'Dashboard interactivo con visualización de datos',
  },
  {
    id: 'frontend-2',
    category: 'Front-end Project',
    title: 'E-commerce Platform',
    image: 'https://via.placeholder.com/400x300/ffc300/000814?text=Frontend+2',
    techStack: ['Next.js', 'React', 'Stripe', 'Tailwind CSS'],
    description: 'Plataforma de comercio electrónico con pagos integrados',
  },
];

