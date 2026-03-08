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
        'md:px-8 md:py-48'
      )}
    >
      <h1 className="mb-12 text-center text-4xl font-bold text-darkText md:text-5xl">
        Skills
      </h1>

      {/* Legend with skill levels */}
      <div className="mt-8 flex flex-col items-center justify-center text-md">
        Here are my fields of expertise I have worked on.
        <br />
        <div className="text-sm">From Basic to Expert.</div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-4xl"
      >
        <ResponsiveContainer width="100%" height={500} className="focus:outline-none" style={{ outline: 'none' }}>
          <RadarChart data={chartData} margin={{ top: 30, right: 30, bottom: 30, left: 30 }} style={{ outline: 'none' }}>
            <PolarGrid
              stroke="hsl(var(--secondary))"
              strokeOpacity={0.3}
              strokeWidth={1.5}
            />
            <PolarAngleAxis
              dataKey="domain"
              tick={{ fill: '#000814', fontSize: 16, fontWeight: 600 }}
              tickLine={{ stroke: 'hsl(var(--secondary))', strokeWidth: 1, strokeOpacity: 0.5 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={false}
              tickCount={5}
              axisLine={{ stroke: 'hsl(var(--secondary))', strokeWidth: 1.5, strokeOpacity: 0.3 }}
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
              label={(props: any) => {
                const { x, y, value } = props;
                let levelStr = '';
                if (value <= 25) levelStr = 'Basic';
                else if (value <= 50) levelStr = 'Intermediate';
                else if (value <= 75) levelStr = 'Advanced';
                else levelStr = 'Expert';
                return (
                  <text
                    x={x}
                    y={y}
                    dy={-10}
                    fill="#000814"
                    fontSize={12}
                    fontWeight={600}
                    textAnchor="middle"
                  >
                    {levelStr}
                  </text>
                );
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </motion.div>
    </section>
  );
};
