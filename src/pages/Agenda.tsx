import { Video } from 'lucide-react';
import ComingSoon from '@/components/ComingSoon';

export default function Agenda() {
  return (
    <ComingSoon
      icon={Video}
      title="Agenda de clases"
      description="Clases grabadas de tu membresía. Próximamente."
    />
  );
}
