import { Shield } from 'lucide-react';
import ComingSoon from '@/components/ComingSoon';

/**
 * Renderizado solo si ProtectedRoute con adminOnly={true} dejó pasar
 * (verificación por email contra ADMIN_EMAILS).
 */
export default function Admin() {
  return (
    <ComingSoon
      icon={Shield}
      title="Panel admin"
      description="Gestión de videos, eventos, cursos, planes y usuarios. Próximamente en react-v2."
    />
  );
}
