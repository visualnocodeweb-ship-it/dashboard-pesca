import { useEffect, useState } from 'react';
import axios from 'axios';

import { formatInTimeZone } from 'date-fns-tz';

interface Record {
  [key: string]: any; // Allows for dynamic keys from the backend
}

const DATE_KEY = "fecha_creacion"; // Assuming 'fecha_creacion' is the key for the date column

function LatestRecordsDashboard() {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecords = () => {
      axios.get('/api/app/latest-records')
        .then(response => {
          // Defensive check: ensure the response is an array before setting state
          if (Array.isArray(response.data)) {
            setRecords(response.data);
          } else {
            console.error("Received non-array response for latest records:", response.data);
            setError("El formato de los últimos registros es incorrecto.");
          }
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

  // Helper function to format date strings to local timezone
  const formatLocalTime = (utcDateString: string) => {
    // Assuming the date string from backend is ISO 8601 UTC (e.g., '2025-12-07T03:22:56Z')
    // Get user's local timezone
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // Format the date to local timezone
    return formatInTimeZone(new Date(utcDateString), userTimeZone, 'dd/MM/yyyy HH:mm:ss');
  };

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
                <td key={header}>
                  {header === DATE_KEY && typeof record[header] === 'string'
                    ? formatLocalTime(record[header])
                    : record[header]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default LatestRecordsDashboard;
