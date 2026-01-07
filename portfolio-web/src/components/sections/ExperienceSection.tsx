import { experiences } from '../../data/experience';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

/**
 * Formatea una fecha en formato "YYYY-MM" a formato legible
 */
const formatDate = (date: string): string => {
  if (date === 'Present') return 'Present';
  
  const [year, month] = date.split('-');
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  return `${monthNames[parseInt(month) - 1]} ${year}`;
};

/**
 * Formatea el rango de fechas para mostrar
 */
const formatDateRange = (startDate: string, endDate: string): string => {
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  return `${start} – ${end}`;
};

/**
 * Componente ExperienceSection
 * Muestra la experiencia profesional en formato timeline vertical
 */
export const ExperienceSection = () => {
  return (
    <section
      id="experience"
      className={cn(
        'container mx-auto max-w-6xl px-4 py-16',
        'md:px-8 md:py-24'
      )}
    >
      <h1 className="mb-12 text-center text-4xl font-bold text-darkText md:text-5xl">
        Experience
      </h1>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 h-full w-0.5 bg-secondary/20 md:left-1/2 md:-translate-x-0.5" />

        <div className="space-y-12">
          {experiences.map((experience, index) => (
            <motion.div
              key={experience.id}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={cn(
                'relative flex items-start gap-6',
                'md:flex-row md:items-center',
                index % 2 === 0 ? 'md:flex-row-reverse' : ''
              )}
            >
              {/* Timeline dot */}
              <div
                className={cn(
                  'absolute left-8 h-4 w-4 rounded-full border-4 border-white bg-accent-gold',
                  'md:left-1/2 md:-translate-x-2'
                )}
              />

              {/* Content card */}
              <div
                className={cn(
                  'ml-16 flex-1 rounded-2xl border border-secondary/20 bg-white p-6 shadow-sm',
                  'md:ml-0 md:w-5/12',
                  index % 2 === 0 ? 'md:mr-auto md:ml-0' : 'md:ml-auto md:mr-0'
                )}
              >
                {/* Date range - Mobile */}
                <div className="mb-2 text-sm font-medium text-accent-gold md:hidden">
                  {formatDateRange(experience.startDate, experience.endDate)}
                </div>

                {/* Company and Role */}
                <h2 className="mb-1 text-2xl font-bold text-darkText">
                  {experience.company}
                </h2>
                <h3 className="mb-3 text-lg font-semibold text-secondary">
                  {experience.role}
                </h3>

                {/* Date range - Desktop */}
                <div className="mb-3 hidden text-sm font-medium text-accent-gold md:block">
                  {formatDateRange(experience.startDate, experience.endDate)}
                </div>

                {/* Recognition */}
                {experience.recognition && (
                  <div className="mb-3 rounded-full bg-accent-gold/20 px-3 py-1 text-xs font-medium text-darkText">
                    {experience.recognition}
                  </div>
                )}

                {/* Description */}
                {experience.description && (
                  <p className="mb-4 text-sm text-darkText/70">
                    {experience.description}
                  </p>
                )}

                {/* Responsibilities */}
                <ul className="space-y-2">
                  {experience.responsibilities.map((responsibility, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm text-darkText/80"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-gold" />
                      <span>{responsibility}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

