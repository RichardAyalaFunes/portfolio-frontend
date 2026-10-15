import { useParams } from 'react-router-dom';
import '../../../styles/knowledge.css';
import { KnowledgeHome } from './KnowledgeHome';
import { KnowledgePageView } from './KnowledgePageView';
import { slugFromPath } from './knowledgeModel.ts';

/**
 * /dashboard/knowledge: the library home, and /dashboard/knowledge/<slug> for one page. The slug is
 * the rest of the path (it contains slashes), and the page view is keyed by it so moving between
 * pages starts from a clean state.
 */
export function Knowledge() {
    const params = useParams();
    const slug = slugFromPath(params['*']);
    return <div className="knowledge-scope">{slug ? <KnowledgePageView key={slug} slug={slug} /> : <KnowledgeHome />}</div>;
}
