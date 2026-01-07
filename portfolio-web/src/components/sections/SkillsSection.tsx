import { skills, skillLevelValues } from '../../data/skills';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

/**
 * Transforma los datos de habilidades al formato que requiere recharts
 */
const transformSkillsData = () => {
  return skills.map((skill) => ({
    domain: skill.domain,
    value: skillLevelValues[skill.level],
    fullMark: 100,
  }));
};

/**
 * Componente SkillsSection
 * Muestra un gráfico radar/spider chart de habilidades por dominio
 */
export const SkillsSection = () => {
  const chartData = transformSkillsData();

  return (
    <section
      id="skills"
      className={cn(
        'container mx-auto max-w-6xl px-4 py-16',
        'md:px-8 md:py-24',
        'bg-secondary/5'
      )}
    >
      <h1 className="mb-12 text-center text-4xl font-bold text-darkText md:text-5xl">
        Skills
      </h1>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-4xl"
      >
        <ResponsiveContainer width="100%" height={500}>
          <RadarChart data={chartData} margin={{ top: 30, right: 30, bottom: 30, left: 30 }}>
            <PolarGrid
              stroke="#003566"
              strokeOpacity={0.3}
              strokeWidth={1.5}
            />
            <PolarAngleAxis
              dataKey="domain"
              tick={{ fill: '#000814', fontSize: 16, fontWeight: 600 }}
              tickLine={{ stroke: '#003566', strokeWidth: 1.5, strokeOpacity: 0.5 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: '#000814', fontSize: 11, fontWeight: 500 }}
              tickCount={5}
              axisLine={{ stroke: '#003566', strokeWidth: 1.5, strokeOpacity: 0.3 }}
              tickFormatter={(value) => {
                // Mapear valores numéricos a niveles de habilidad
                if (value === 0) return '';
                if (value <= 25) return 'Basic';
                if (value <= 50) return 'Intermediate';
                if (value <= 75) return 'Advanced';
                return 'Expert';
              }}
            />
            <Radar
              name="Skills"
              dataKey="value"
              stroke="#ffc300"
              fill="#ffc300"
              fillOpacity={0.7}
              strokeWidth={3}
              animationDuration={1200}
              animationEasing="ease-out"
            />
          </RadarChart>
        </ResponsiveContainer>

        {/* Legend with skill levels */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-secondary/30" />
            <span className="text-darkText/70">Basic (0-25%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-accent-yellow/60" />
            <span className="text-darkText/70">Intermediate (26-50%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-accent-gold" />
            <span className="text-darkText/70">Advanced (51-75%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-accent-gold" />
            <span className="text-darkText/70">Expert (76-100%)</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
