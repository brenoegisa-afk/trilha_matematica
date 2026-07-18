import { supabase } from '../../utils/supabaseClient';
import { DIAGNOSTIC_VERSION, type DiagnosticEvidence } from '../learning/DiagnosticEngine';

export class DiagnosticProgressService {
    static async save(input: { studentId: string; subjectId: string; skillId: string; entryNodeId: string; evidenceCount: number; completed: boolean }) {
        return supabase.from('diagnostic_progress').upsert({
            student_id: input.studentId, subject_id: input.subjectId, skill_id: input.skillId,
            curriculum_version: DIAGNOSTIC_VERSION, entry_node_id: input.entryNodeId,
            evidence_count: Math.min(12, input.evidenceCount),
            status: input.completed ? 'completed' : 'in_progress',
            completed_at: input.completed ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
        }, { onConflict: 'student_id,subject_id,skill_id,curriculum_version' });
    }

    static async hasCompleted(studentId: string, subjectId: string): Promise<boolean> {
        const { data, error } = await supabase.from('diagnostic_progress')
            .select('student_id')
            .eq('student_id', studentId)
            .eq('subject_id', subjectId)
            .eq('curriculum_version', DIAGNOSTIC_VERSION)
            .eq('status', 'completed')
            .limit(1);
        if (error) {
            console.warn('Não foi possível consultar o diagnóstico; será oferecido novamente.', error);
            return false;
        }
        return (data?.length || 0) > 0;
    }

    static async complete(input: { studentId: string; subjectId: string; evidence: DiagnosticEvidence[] }) {
        const completedAt = new Date().toISOString();
        const bySkill = new Map<string, DiagnosticEvidence[]>();
        input.evidence.forEach(item => bySkill.set(item.skillId, [...(bySkill.get(item.skillId) || []), item]));
        const rows = Array.from(bySkill.entries()).map(([skillId, items]) => ({
            student_id: input.studentId,
            subject_id: input.subjectId,
            skill_id: skillId,
            curriculum_version: DIAGNOSTIC_VERSION,
            entry_node_id: items[0].nodeId,
            evidence_count: Math.min(12, items.length),
            status: 'completed',
            completed_at: completedAt,
            updated_at: completedAt
        }));
        return rows.length
            ? supabase.from('diagnostic_progress').upsert(rows, { onConflict: 'student_id,subject_id,skill_id,curriculum_version' })
            : { data: null, error: null };
    }
}
