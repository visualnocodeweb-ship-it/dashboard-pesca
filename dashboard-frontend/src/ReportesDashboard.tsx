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
  const [showLongWeekendReport, setShowLongWeekendReport] = useState<boolean>(false);
  
  // State for Long Weekend Report data
  const [lwPermitsData, setLwPermitsData] = useState<DailyCountData[]>([]);
  const [lwRevenueData, setLwRevenueData] = useState<DailyRevenueData[]>([]);
  const [lwCategoryData, setLwCategoryData] = useState<CategoryData[]>([]);
  const [lwRegionData, setLwRegionData] = useState<RegionData[]>([]);
  const [lwTotalPermits, setLwTotalPermits] = useState<number | null>(null);
  const [lwTotalRecaudacion, setLwTotalRecaudacion] = useState<number | null>(null);
  const [lwTotalCategories, setLwTotalCategories] = useState<number | null>(null);
  const [lwTotalRegions, setLwTotalRegions] = useState<number | null>(null);
  
  const [lwLoading, setLwLoading] = useState(false);
  const [lwError, setLwError] = useState<string | null>(null);

  const LONG_WEEKEND_START_CHARTS = "21/11/2025";
  const LONG_WEEKEND_END_CHARTS = "24/11/2025"; // User specified up to 24th for charts
  const LONG_WEEKEND_START_TOTALS = "21/11/2025";
  const LONG_WEEKEND_END_TOTALS = "25/11/2025"; // User specified up to 25th for totals

  const reportRef = useRef(null); // Ref for the report content

  const handleDownloadPdf = () => {
    if (reportRef.current) {
      const element = reportRef.current;
      const opt = {
        margin:       0.5,
        filename:     'informe_fin_semana_largo.pdf',
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' as const }
      };
      html2pdf().from(element).set(opt).save();
    }
  };

  useEffect(() => {
    if (showLongWeekendReport) {
      setLwLoading(true);
      setLwError(null);

      const fetchLwData = async () => {
        try {
          // Fetch permits count per day
          const permitsRes = await axios.get('/api/chart-data', {
            params: { start_date: LONG_WEEKEND_START_CHARTS, end_date: LONG_WEEKEND_END_CHARTS }
          });
          setLwPermitsData(permitsRes.data);

          // Fetch revenue per day
          const revenueRes = await axios.get('/api/recaudacion-por-dia', {
            params: { start_date: LONG_WEEKEND_START_CHARTS, end_date: LONG_WEEKEND_END_CHARTS }
          });
          setLwRevenueData(revenueRes.data);

          // Fetch category quantity
          const categoryRes = await axios.get('/api/categoria-pesca', {
            params: { start_date: LONG_WEEKEND_START_CHARTS, end_date: LONG_WEEKEND_END_CHARTS }
          });
          setLwCategoryData(categoryRes.data);
          setLwTotalCategories(categoryRes.data.reduce((sum: number, item: CategoryData) => sum + item.count, 0));


          // Fetch regions quantity
          const regionRes = await axios.get('/api/regiones-count', {
            params: { start_date: LONG_WEEKEND_START_CHARTS, end_date: LONG_WEEKEND_END_CHARTS }
          });
          setLwRegionData(regionRes.data);
          setLwTotalRegions(regionRes.data.reduce((sum: number, item: RegionData) => sum + item.count, 0));

          // Fetch total permits for the period (Nov 21 to Nov 25)
          const totalPermitsRes = await axios.get('/api/permit-count', {
            params: { start_date: LONG_WEEKEND_START_TOTALS, end_date: LONG_WEEKEND_END_TOTALS }
          });
          setLwTotalPermits(totalPermitsRes.data.count);

          // Fetch total recaudacion for the period (Nov 21 to Nov 25)
          const totalRecaudacionRes = await axios.get('/api/total-recaudacion', {
            params: { start_date: LONG_WEEKEND_START_TOTALS, end_date: LONG_WEEKEND_END_TOTALS }
          });
          setLwTotalRecaudacion(totalRecaudacionRes.data.total);


        } catch (err) {
          console.error("Error fetching long weekend report data:", err);
          setLwError("No se pudieron cargar los datos del informe.");
        } finally {
          setLwLoading(false);
        }
      };

      fetchLwData();
    }
  }, [showLongWeekendReport]);


  return (
    <div className="reportes-dashboard-container">
      <h2>Reportes</h2>

      <div className="report-buttons-container">
        <button 
          className={`nav-button ${showLongWeekendReport ? 'active' : ''}`}
          onClick={() => setShowLongWeekendReport(!showLongWeekendReport)}
        >
          Informe Fin de Semana largo (21 al 25 de Nov)
        </button>
        {/* Add more report buttons here */}
      </div>

      {showLongWeekendReport && (
        <div className="long-weekend-report-section">
          <h3 style={{ marginBottom: '20px' }}>Informe Detallado: Fin de Semana Largo (21 al 24 de Noviembre)</h3>
          {lwLoading ? (
            <p>Cargando informe del fin de semana largo...</p>
          ) : lwError ? (
            <p className="error">{lwError}</p>
          ) : (
            <div ref={reportRef}> {/* Wrap report content in div with ref */}
              <div className="report-charts-grid">
                {/* Permits Sold Chart */}
                <div className="chart-container">
                  <h4>Permisos Vendidos por Día</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <ComposedChart data={lwPermitsData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
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

                {/* Revenue per Day Chart */}
                <div className="chart-container">
                  <h4>Recaudación por Día</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <ComposedChart data={lwRevenueData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis tickFormatter={(value) => new Intl.NumberFormat('es-AR', { notation: 'compact', compactDisplay: 'short' }).format(value)} />
                      <Tooltip formatter={(value: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)} />
                      <Legend />
                      <Line type="monotone" dataKey="recaudacion" stroke="#82ca9d" name="Recaudación" >
                        <LabelList dataKey="recaudacion" position="top" dy={10} formatter={(value: any) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)} style={{ fontSize: '10px' }} />
                      </Line>
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Category Quantity Chart */}
                <div className="chart-container">
                  <h4>Cantidad por Categoría</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <ComposedChart data={lwCategoryData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={false} /> {/* Removed angle, textAnchor, interval, height */}
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#ffc658" name="Cantidad" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Regions Quantity Chart */}
                <div className="chart-container">
                  <h4>Cantidad por Región</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <ComposedChart data={lwRegionData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={false} /> {/* Removed angle, textAnchor, interval, height */}
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#ff7300" name="Cantidad" >
                        <LabelList dataKey="count" position="top" />
                      </Bar>
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Summary Totals */}
                <div className="total-permits-container">
                  <h4>Resumen del Fin de Semana Largo (21 al 25 de Nov)</h4>
                  <div className="summary-grid">
                    {lwTotalPermits !== null && (
                      <div className="summary-item">
                        <span className="summary-label">Permisos Vendidos:</span>
                        <span className="summary-value">{lwTotalPermits}</span>
                      </div>
                    )}
                    {lwTotalRecaudacion !== null && (
                      <div className="summary-item">
                        <span className="summary-label">Recaudación Total:</span>
                        <span className="summary-value">{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(lwTotalRecaudacion)}</span>
                      </div>
                    )}
                    {lwTotalCategories !== null && (
                      <div className="summary-item">
                        <span className="summary-label">Total Categorías:</span>
                        <span className="summary-value">{lwTotalCategories}</span>
                      </div>
                    )}
                    {lwTotalRegions !== null && (
                      <div className="summary-item">
                        <span className="summary-label">Total Regiones:</span>
                        <span className="summary-value">{lwTotalRegions}</span>
                      </div>
                    )}
                  </div>

                  {/* New: Daily Summary */}
                  {lwPermitsData.length > 0 && lwRevenueData.length > 0 && (
                    <div className="daily-summary-section" style={{ marginTop: '20px' }}>
                      <h5>Detalle por Día:</h5>
                      {lwPermitsData.map((data, index) => (
                        <div key={data.date} className="summary-item-daily" style={{ marginBottom: '5px' }}>
                          <span style={{ fontWeight: 'bold' }}>{data.date}:</span>{' '}
                          <span>Permisos Vendidos: {data.count}</span>{' '}
                          {lwRevenueData[index] && (
                            <span>
                              Recaudación: {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(lwRevenueData[index].recaudacion)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
                            {lwRegionData.length > 0 && (
                              <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                                <h4>Desglose por Región (Total del Período):</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                                  {lwRegionData.map(region => (
                                    <div key={region.name} style={{ flex: '1 1 auto', minWidth: '150px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
                                      <span style={{ fontWeight: 'bold' }}>{region.name}:</span> {region.count}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
              
                            {/* New: Categories Breakdown */}
                            {lwCategoryData.length > 0 && (
                              <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                                <h4>Desglose por Categoría (Total del Período):</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                                  {lwCategoryData.map(category => (
                                    <div key={category.name} style={{ flex: '1 1 auto', minWidth: '150px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
                                      <span style={{ fontWeight: 'bold' }}>{category.name}:</span> {category.count}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
              
                            {/* PDF Download Button at the end */}
                            <div style={{ textAlign: 'center', marginTop: '30px' }}>
                              <button className="nav-button" onClick={handleDownloadPdf}>
                                Descargar en PDF
                              </button>
                            </div>
            </div>
          )}
        </div>
      )}


    </div>
  );
}

export default ReportesDashboard;
