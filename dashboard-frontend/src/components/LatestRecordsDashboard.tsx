import { useEffect, useState } from 'react';
import apiClient from '../api/axios';



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
      apiClient.get('/api/latest-records')
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

  // Helper function to format date strings to local timezone
  const formatLocalTime = (dateString: string) => {
    if (!dateString || typeof dateString !== 'string') {
      return dateString; // Return original value if not a processable string
    }
    
    // Attempt to parse a "dd/mm/yyyy hh:mm:ss" string
    const parts = dateString.match(/(\d{2})\/(\d{2})\/(\d{4})[ ,]+(\d{2}):(\d{2}):(\d{2})/);
    let dateObj: Date;

    if (parts) {
      // new Date(year, monthIndex, day, hour, minute, second)
      // Note: month is 0-indexed in JavaScript (0-11)
      dateObj = new Date(parseInt(parts[3]), parseInt(parts[2]) - 1, parseInt(parts[1]), parseInt(parts[4]), parseInt(parts[5]), parseInt(parts[6]));
    } else {
      // Fallback for other formats like ISO strings that JS might handle
      dateObj = new Date(dateString);
    }
    
    // Check if the created date is valid
    if (isNaN(dateObj.getTime())) {
      return dateString; // Return original string if date is invalid
    }

    try {
      // Since the source timezone is ambiguous, we'll format it assuming it's local time
      // This is primarily for display consistency. The actual timezone conversion logic
      // is more reliably handled on the backend as done in other components.
      return new Intl.DateTimeFormat('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(dateObj);
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateString; // Return original string on formatting error
    }
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
