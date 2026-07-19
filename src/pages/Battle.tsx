import { Navigate } from 'react-router-dom';

/**
 * Compatibilidade para links antigos. A batalha independente foi substituída
 * pelos Guardiões dentro da Trilha, que usam o mesmo currículo, domínio,
 * revisões e telemetria da aventura principal.
 */
export default function Battle() {
    return <Navigate to="/setup" replace state={{ gameMode: 'battle' }} />;
}
