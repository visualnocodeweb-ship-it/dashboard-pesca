import { useEffect, useState } from 'react';
import axios from 'axios';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Interface for the region chart data
interface RegionData {
  name: string;
  count: number;
}

function RegionesDashboard() {
  const [chartData, setChartData] = useState<RegionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = () => {
      axios.get('/api/regiones-count')
        .then(response => {
          setChartData(response.data);
          setLoading(false);
        })
        .catch(error => {
          console.error("Error fetching regions data:", error);
          setError("No se pudieron cargar los datos de las regiones.");
          setLoading(false);
        });
    };

    fetchData();
    const intervalId = setInterval(fetchData, 10000); // Poll every 10 seconds
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="dashboard-grid">
      <div className="chart-container">
        <h2>Cantidad por Región</h2>
        {loading ? <p>Cargando gráfico...</p> : error ? <p className="error">{error}</p> :
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart
              data={chartData}
              margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#2C3E50" fillOpacity={0.95} name="Cantidad" />
              <Line type="monotone" dataKey="count" stroke="#d9006c" strokeOpacity={0.8} name="Línea" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        }
      </div>
    </div>
  );
}

export default RegionesDashboard;
