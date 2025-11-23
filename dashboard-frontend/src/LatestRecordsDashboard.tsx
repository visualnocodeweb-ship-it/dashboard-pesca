import { useEffect, useState } from 'react';
import axios from 'axios';

interface Record {
  [key: string]: any; // Allows for dynamic keys from the backend
}

function LatestRecordsDashboard() {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecords = () => {
      axios.get('/api/latest-records')
        .then(response => {
          setRecords(response.data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error fetching latest records:", err);
          setError("No se pudieron cargar los últimos registros.");
          setLoading(false);
        });
    };

    fetchRecords(); // Fetch immediately on mount
    const intervalId = setInterval(fetchRecords, 15000); // Poll every 15 seconds
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  if (loading) return <p>Cargando últimos registros...</p>;
  if (error) return <p className="error">{error}</p>;
  if (records.length === 0) return <p>No hay registros disponibles.</p>;

  // Extract headers from the first record (assuming all records have the same keys)
  const headers = Object.keys(records[0]);

  return (
    <div className="latest-records-container">
      <h2>Últimos 10 Registros</h2>
      <table className="latest-records-table">
        <thead>
          <tr>
            {headers.map(header => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((record, index) => (
            <tr key={index}>
              {headers.map(header => (
                <td key={header}>{record[header]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default LatestRecordsDashboard;
