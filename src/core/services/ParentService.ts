import { supabase } from '../../utils/supabaseClient';
import type { Player, DiagnosticInsight } from '../types';
import { DiagnosticService } from '../learning/DiagnosticService';

export class ParentService {
    /**
     * Fetches all children profiles linked to a given parent ID.
     */
    static async getChildrenProfiles(parentId: string): Promise<Player[]> {
        // Fetch the relational links
        const { data: links, error: linkError } = await supabase
            .from('parent_student')
            .select('student_id')
            .eq('parent_id', parentId);

        if (linkError || !links) throw new Error('Não foi possível carregar os dependentes.');
        if (links.length === 0) return [];

        const studentIds = links.map((l: any) => l.student_id);

        // Fetch the actual profiles
        const { data: students, error: studentError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', studentIds);
            
        if (studentError || !students) throw new Error('Erro ao listar dependentes.');

        return students.map((s: any) => this.mapProfileToPlayer(s));
    }

    /**
     * Maps the Supabase profile row to a Game Player structure
     */
    private static mapProfileToPlayer(dbProfile: any): Player {
        return {
            id: dbProfile.id,
            name: dbProfile.name || 'Aluno',
            color: dbProfile.color || '#3b82f6',
            avatar: dbProfile.avatar || '👦',
            mascot: dbProfile.mascot,
            currentPosition: dbProfile.current_position || 0,
            inventoryProtectionCount: dbProfile.inventory_protection_count || 0,
            score: dbProfile.score || 0,
            streak: dbProfile.streak || 0,
            level: dbProfile.level || 1,
            xp: dbProfile.xp || 0,
            achievements: dbProfile.achievements || [],
            hp: dbProfile.hp || 100,
            maxHp: dbProfile.max_hp || 100,
            mascots: dbProfile.mascots || [],
            skillsMastery: dbProfile.skills_mastery || [],
            sessionStats: dbProfile.session_stats || {
                totalQuestions: 0,
                correctAnswers: 0,
                skillsPracticed: {}
            },
            role: dbProfile.role || 'student',
            school_id: dbProfile.school_id,
            class_id: dbProfile.class_id,
            user_id: dbProfile.user_id
        };
    }
    
    /**
     * Generates pedagogical reports for all children
     */
    static generateChildrenReports(children: Player[]): Record<string, DiagnosticInsight[]> {
        const reports: Record<string, DiagnosticInsight[]> = {};
        for(const child of children) {
            reports[child.id] = DiagnosticService.generateReport(child);
        }
        return reports;
    }
    
    /**
     * Links an existing student profile to a parent
     */
    static async linkChildToParent(parentId: string, childId: string): Promise<void> {
        const { error } = await supabase
            .from('parent_student')
            .insert({
                parent_id: parentId,
                student_id: childId
            });
            
        if (error) {
            console.error('Erro ao vincular:', error);
            if (error.code === '23505') { // Unique violation
                throw new Error('Esta criança já está vinculada à sua conta.');
            }
            throw new Error('Falha ao vincular o aluno.');
        }
    }
}
