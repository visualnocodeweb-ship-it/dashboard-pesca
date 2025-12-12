import { useEffect, useState } from 'react';
import axios from 'axios';

function TestApi() {
  const [data, setData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/app/permit-count', { timeout: 10000 }); // 10 seconds timeout
        setData(`Conteo de Permisos: ${response.data.count}`);
        console.log('API call successful. Data:', response.data);
      } catch (err) {
        console.error('API call failed:', err); // Log full error object
        setError('Error al cargar datos de la API.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <p>Cargando datos de la API...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h2>Componente de Prueba de API</h2>
      <p>{data}</p>
    </div>
  );
}

export default TestApi;
