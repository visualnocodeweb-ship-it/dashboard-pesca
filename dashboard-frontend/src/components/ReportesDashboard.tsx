import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import html2pdf from 'html2pdf.js';

// Interfaces for data
interface DailyCountData {
  date: string;
  count: number;
}

interface DailyRevenueData {
  date: string;
  recaudacion: number;
}

interface CategoryData {
  name: string;
  count: number;
}

interface RegionData {
  name: string;
  count: number;
}

function ReportesDashboard() {
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  const [startDate, setStartDate] = useState<string>(sevenDaysAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(today.toISOString().split('T')[0]);

  // State for Report data
  const [permitsData, setPermitsData] = useState<DailyCountData[]>([]);
  const [revenueData, setRevenueData] = useState<DailyRevenueData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [regionData, setRegionData] = useState<RegionData[]>([]);
  const [totalPermits, setTotalPermits] = useState<number | null>(null);
  const [totalRecaudacion, setTotalRecaudacion] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reportRef = useRef(null);

  const handleDownloadPdf = () => {
    if (reportRef.current) {
      // 1. Clone the report content to avoid modifying the live DOM
      const contentClone = (reportRef.current as HTMLElement).cloneNode(true) as HTMLElement;

      // 2. Remove the download button from the cloned content
      const buttonContainer = contentClone.querySelector('[style*="text-align: center"]');
      if (buttonContainer) {
        buttonContainer.remove();
      }

      // 3. Apply styles to avoid page breaks within elements
      const sectionsToKeepTogether = contentClone.querySelectorAll('.chart-container, .summary-section');
      sectionsToKeepTogether.forEach(section => {
        (section as HTMLElement).style.pageBreakInside = 'avoid';
      });
      
      // 4. Create a new container for the final PDF content
      const elementToPrint = document.createElement('div');

      // 5. Create the header
      const header = document.createElement('div');
      header.style.textAlign = 'center';
      header.style.marginBottom = '20px';
      header.style.padding = '20px';
      header.style.borderBottom = '1px solid #eee';

      const logo = document.createElement('img');
      logo.src = '/Guardafauna - 1.png';
      logo.style.width = '100px';
      logo.style.marginBottom = '10px';
      
      const title = document.createElement('h2');
      title.innerText = 'Reporte de Pesca';
      title.style.margin = '0';

      const dateRange = document.createElement('p');
      dateRange.innerText = `Período: ${startDate} al ${endDate}`;
      dateRange.style.margin = '5px 0 0 0';
      dateRange.style.color = '#555';

      header.appendChild(logo);
      header.appendChild(title);
      header.appendChild(dateRange);

      // 6. Append header and modified content to the print container
      elementToPrint.appendChild(header);
      elementToPrint.appendChild(contentClone);

      // 7. Set PDF options and save
      const opt = {
        margin: 0.5,
        filename: `reporte_pesca_${startDate}_a_${endDate}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
      };
      html2pdf().from(elementToPrint).set(opt).save();
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const start_date_formatted = new Date(startDate).toLocaleDateString('es-AR', { timeZone: 'UTC' });
        const end_date_formatted = new Date(endDate).toLocaleDateString('es-AR', { timeZone: 'UTC' });

        // Fetch permits count per day
        const permitsRes = await axios.get('/api/chart-data', {
          params: { start_date: start_date_formatted, end_date: end_date_formatted }
        });
        setPermitsData(permitsRes.data);

        // Fetch revenue per day
        const revenueRes = await axios.get('/api/recaudacion-por-dia', {
          params: { start_date: start_date_formatted, end_date: end_date_formatted }
        });
        setRevenueData(revenueRes.data);

        // Fetch category quantity
        const categoryRes = await axios.get('/api/categoria-pesca', {
          params: { start_date: start_date_formatted, end_date: end_date_formatted }
        });
        setCategoryData(categoryRes.data);

        // Fetch regions quantity
        const regionRes = await axios.get('/api/regiones-count', {
          params: { start_date: start_date_formatted, end_date: end_date_formatted }
        });
        setRegionData(regionRes.data);

        // Fetch total permits for the period
        const totalPermitsRes = await axios.get('/api/permit-count', {
          params: { start_date: start_date_formatted, end_date: end_date_formatted }
        });
        setTotalPermits(totalPermitsRes.data.count);

        // Fetch total recaudacion for the period
        const totalRecaudacionRes = await axios.get('/api/total-recaudacion', {
          params: { start_date: start_date_formatted, end_date: end_date_formatted }
        });
        setTotalRecaudacion(totalRecaudacionRes.data.total);

      } catch (err) {
        console.error("Error fetching report data:", err);
        setError("No se pudieron cargar los datos del informe. Asegúrate de que haya datos para las fechas seleccionadas.");
      } finally {
        setLoading(false);
      }
    };

    if (startDate && endDate) {
        fetchData();
    }
  }, [startDate, endDate]);


  return (
    <div className="reportes-dashboard-container">
      <h2>Reportes Personalizados</h2>

      <div className="date-picker-container" style={{ marginBottom: '20px', display: 'flex', gap: '15px', justifyContent: 'center', alignItems: 'center' }}>
        <label>
          Fecha de inicio:
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ marginLeft: '5px', padding: '5px', borderRadius: '5px', border: '1px solid #ccc' }}/>
        </label>
        <label>
          Fecha de fin:
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ marginLeft: '5px', padding: '5px', borderRadius: '5px', border: '1px solid #ccc' }}/>
        </label>
      </div>

      <div className="report-section">
        {loading ? (
          <p>Cargando informe...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : (
          <div ref={reportRef}>
            <h3 style={{ marginBottom: '20px' }}>Informe Detallado: {startDate} al {endDate}</h3>
            
            <div className="report-charts-grid">
              <div className="chart-container">
                <h4>Permisos Vendidos por Día</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <ComposedChart data={permitsData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" name="Permisos Vendidos" >
                      <LabelList dataKey="count" position="top" />
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-container">
                <h4>Recaudación por Día</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <ComposedChart data={revenueData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => new Intl.NumberFormat('es-AR', { notation: 'compact', compactDisplay: 'short' }).format(value)} />
                    <Tooltip formatter={(value: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="recaudacion" stroke="#82ca9d" name="Recaudación" >
                      <LabelList dataKey="recaudacion" position="top" dy={-10} formatter={(value: any) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', notation: 'compact', compactDisplay: 'short' }).format(value)} style={{ fontSize: '10px' }} />
                    </Line>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-container">
                <h4>Cantidad por Categoría</h4>
                <ResponsiveContainer width="100%" height={450}> {/* Increased height */}
                  <ComposedChart layout="vertical" data={categoryData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }} barCategoryGap={5}> {/* Adjusted bar gap */}
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: '10px' }} /> {/* Smaller X-axis ticks */}
                    <YAxis
                      type="category"
                      dataKey="name"
                      tickFormatter={(value: string) => value} // Full words
                      width={150} // Increased width for Y-axis labels
                      tick={{ fontSize: '10px' }} // Smaller Y-axis ticks
                    />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#ffc658" name="Cantidad" barSize={30} /> {/* Larger bars */}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-container">
                <h4>Cantidad por Región</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <ComposedChart layout="vertical" data={regionData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" dataKey="count" tick={{ fontSize: '10px' }} /> {/* Smaller X-axis labels */}
                    <YAxis type="category" dataKey="name" tick={{ fontSize: '10px' }} /> {/* Smaller Y-axis labels */}
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#ff7300" name="Cantidad" barSize={30} > {/* Larger bars */}
                      <LabelList dataKey="count" position="right" />
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="report-summary-details" style={{ marginTop: '30px' }}>
              <h4>Resumen del Período</h4>
              <div className="summary-section">
                <div className="summary-item-total">
                  {totalPermits !== null && (
                    <div className="summary-line">
                      <span className="summary-label">Permisos Vendidos:</span>
                      <span className="summary-value">{totalPermits}</span>
                    </div>
                  )}
                  {totalRecaudacion !== null && (
                    <div className="summary-line">
                      <span className="summary-label">Recaudación Total:</span>
                      <span className="summary-value">{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(totalRecaudacion)}</span>
                    </div>
                  )}
                </div>
              </div>

              {categoryData.length > 0 && (
                <div className="summary-section">
                  <h5>Detalle por Categoría:</h5>
                  <ul className="summary-list">
                    {categoryData.map((cat, index) => (
                      <li key={index}>
                        <strong>{cat.name}:</strong> {cat.count}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {regionData.length > 0 && (
                <div className="summary-section">
                  <h5>Detalle por Región:</h5>
                  <ul className="summary-list">
                    {regionData.map((reg, index) => (
                      <li key={index}>
                        <strong>{reg.name}:</strong> {reg.count}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {permitsData.length > 0 && (
                <div className="summary-section">
                  <h5>Permisos por Día:</h5>
                  <ul className="summary-list">
                    {permitsData.map((day, index) => (
                      <li key={index}>
                        <strong>{day.date}:</strong> {day.count} permisos
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {revenueData.length > 0 && (
                <div className="summary-section">
                  <h5>Recaudación por Día:</h5>
                  <ul className="summary-list">
                    {revenueData.map((day, index) => (
                      <li key={index}>
                        <strong>{day.date}:</strong> {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(day.recaudacion)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <button className="nav-button" onClick={handleDownloadPdf} style={{ color: 'black' }}>
                Descargar en PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportesDashboard;