import { useEffect, useState } from 'react';
import axios from 'axios';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Interface for the category chart data
interface CategoryData {
  name: string;
  count: number;
}

function CategoriaPescaDashboard() {
  const [chartData, setChartData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = () => {
      axios.get('/api/categoria-pesca')
        .then(response => {
          if (Array.isArray(response.data)) {
            setChartData(response.data);
          } else {
            console.error("Received non-array response for category data:", response.data);
            setError("El formato de los datos de las categorías es incorrecto.");
          }
          setLoading(false);
        })
        .catch(error => {
          console.error("Error fetching category data:", error);
          setError("No se pudieron cargar los datos de las categorías.");
          setLoading(false);
        });
    };

    fetchData();
    const intervalId = setInterval(fetchData, 10000); // Poll every 10 seconds
    return () => clearInterval(intervalId);
  }, []);

  // Calculate dynamic height for the chart
  const chartHeight = Math.max(400, chartData.length * 35);

  // Function to format Y-axis labels
  const formatYAxisTick = (tickItem: string) => {
    const words = tickItem.split(' ');
    if (words.length > 2) {
      return words.slice(0, 2).join(' ') + '...'; // Truncate to first two words and add ellipsis
    }
    return tickItem;
  };

  return (
    <div className="dashboard-grid">
      <div className="chart-container">
        <h2>Cantidad por Categoría de Permiso</h2>
        {loading ? <p>Cargando gráfico...</p> : error ? <p className="error">{error}</p> :
          <ResponsiveContainer width="100%" height={chartHeight}>
            <ComposedChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }} // Adjusted left margin to bring chart left
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={150} interval={0} tickFormatter={formatYAxisTick} /> {/* YAxis width maintained */}
              <Tooltip formatter={(value: number) => [new Intl.NumberFormat('es-ES').format(value), 'Cantidad']} />
              <Legend />
              <Bar dataKey="count" fill="#2C3E50" fillOpacity={0.9} name="Cantidad" />
              <Line dataKey="count" stroke="#d9006c" strokeWidth={2} name="Línea" />
            </ComposedChart>
          </ResponsiveContainer>
        }
      </div>
    </div>
  );
}

export default CategoriaPescaDashboard;
