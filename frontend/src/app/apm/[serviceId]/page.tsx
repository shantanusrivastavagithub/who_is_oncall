import ApmDashboard from '@/components/apm/ApmDashboard';
import Link from 'next/link';


export default function ServiceApmPage({ params }: { params: { serviceId: string } }) {
  const { serviceId } = params;

  return (
    <main className="min-h-screen bg-gray-50 font-sans">
      
      {}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center">
        <Link href="/apm" className="text-blue-600 hover:underline text-sm font-medium mr-4 transition-colors">
          &larr; Back to Services
        </Link>
        <span className="text-gray-400">|</span>
        <span className="text-gray-800 font-semibold ml-4 flex items-center gap-2">
          Service Detail: <span className="text-blue-600 font-mono bg-blue-50 px-2 py-0.5 rounded">{serviceId}</span>
        </span>
      </div>

      {}
      <ApmDashboard serviceId={serviceId} />
      
    </main>
  );
}