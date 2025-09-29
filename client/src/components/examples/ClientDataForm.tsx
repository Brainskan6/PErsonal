import ClientDataForm from '../ClientDataForm';
import type { ClientData } from '@shared/schema';

export default function ClientDataFormExample() {
  const handleSubmit = (data: ClientData) => {
    console.log('Form submitted with:', data);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <ClientDataForm onSubmit={handleSubmit} />
    </div>
  );
}