import React, { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
);

// Custom dropdown component to replace the native select
function CustomSelect({ options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOptionClick = (opt) => {
    onChange(opt);
    setOpen(false);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'inline-block',
        height: '54.5px',
      }}
    >
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: '18px 12px',
          cursor: 'pointer',
          backgroundColor: '#f88379',
          color: 'black',
          display: 'inline-block',
        }}
      >
        {value || 'Select instance'}
      </div>
      <span
        onClick={() => setOpen(!open)}
        style={{
          cursor: 'pointer',
          marginLeft: '5px',
          fontSize: '12px',
          display: 'inline-block',
        }}
      >
        &#x25BC;
      </span>
      {open && (
        <div
          style={{
            position: 'absolute',
            background: 'white',
            border: '1px solid #ccc',
            zIndex: 1000,
          }}
        >
          {options.map((opt) => (
            <div
              key={opt}
              onClick={() => handleOptionClick(opt)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                backgroundColor: '#f88379',
              }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardCharts() {
  const [userData, setUserData] = useState(null);
  const [selectedInstance, setSelectedInstance] = useState(
    () => localStorage.getItem('selectedInstance') || null,
  );
  const [loading, setLoading] = useState(true);
  const [timeWindow, setTimeWindow] = useState(900000); // 15 minutes in ms
  const [visibleRange, setVisibleRange] = useState({ start: null, end: null });
  const [chartData1, setChartData1] = useState({ datasets: [] });
  const [chartData2, setChartData2] = useState({ datasets: [] });
  const [chartData3, setChartData3] = useState({ datasets: [] });
  const [chartOptions1, setChartOptions1] = useState({});
  const [chartOptions2, setChartOptions2] = useState({});
  const [chartOptions3, setChartOptions3] = useState({});
  const [selectedChart, setSelectedChart] = useState('chart1');

  const chartRef1 = useRef(null);
  const chartRef2 = useRef(null);
  const chartRef3 = useRef(null);
  const chartContainer1Ref = useRef(null);
  const chartContainer2Ref = useRef(null);
  const chartContainer3Ref = useRef(null);

  let lastFetchTime = 0;

  const arrowButtonStyle = {
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    cursor: 'pointer',
    margin: '0 5px',
  };

  // Helper: finds the closest price for a target time.
  function findClosestPrice(arr, targetTime) {
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i].time <= targetTime && targetTime <= arr[i + 1].time) {
        return arr[i].value;
      }
    }
    return arr[arr.length - 1]?.value;
  }

  // Build chart data using the provided user object and fields.
  function buildChartDataForChart(
    userObj,
    numericFields,
    fallbackMapping,
    multipleY = false,
    extendTime,
  ) {
    const colorMapping = {
      balance: '#2ecc71',
      unrealizedBalance: '#3498db',
      btcPrice: '#e74c3c',
      ndxPrice: '#9b59b6',
      btcAmount: '#f1c40f',
      ndxAmount: '#e67e22',
    };

    const lineDatasets = numericFields
      .filter((field) => userObj[field])
      .map((field) => {
        const ds = {
          label: field,
          data: userObj[field].map((entry) => ({
            x: entry.time,
            y: entry.value,
          })),
          pointRadius: 1.5,
          borderWidth: 2,
          borderColor: colorMapping[field],
          backgroundColor: colorMapping[field],
          stepped: 'before',
          spanGaps: true,
        };
        if (multipleY) {
          if (field === numericFields[0]) ds.yAxisID = 'y';
          else if (field === numericFields[1]) ds.yAxisID = 'y1';
        }
        return ds;
      });

    lineDatasets.forEach((dataset) => {
      if (dataset.data.length > 0) {
        const lastData = dataset.data[dataset.data.length - 1];
        if (lastData.x < extendTime) {
          dataset.data.push({ x: extendTime, y: lastData.y });
        }
      }
    });

    const btcSignal = userObj.btcSignal || [];
    const btcAction = userObj.btcAction || [];
    const ndxSignal = userObj.ndxSignal || [];
    const ndxAction = userObj.ndxAction || [];

    const btcSignalBuy = btcSignal.filter((s) => s.value === 'BUY');
    const btcSignalSell = btcSignal.filter((s) => s.value === 'SELL');
    const btcActionBuy = btcAction.filter((a) => a.value === 'BUY');
    const btcActionSell = btcAction.filter((a) => a.value === 'SELL');

    const ndxSignalBuy = ndxSignal.filter((s) => s.value === 'BUY');
    const ndxSignalSell = ndxSignal.filter((s) => s.value === 'SELL');
    const ndxActionBuy = ndxAction.filter((a) => a.value === 'BUY');
    const ndxActionSell = ndxAction.filter((a) => a.value === 'SELL');

    const btcSignalBuyData = btcSignalBuy.map((s) => ({
      x: s.time,
      y: findClosestPrice(userObj[fallbackMapping.btc] || [], s.time),
    }));
    const btcSignalSellData = btcSignalSell.map((s) => ({
      x: s.time,
      y: findClosestPrice(userObj[fallbackMapping.btc] || [], s.time),
    }));
    const btcActionBuyData = btcActionBuy.map((a) => ({
      x: a.time,
      y: findClosestPrice(userObj[fallbackMapping.btc] || [], a.time),
    }));
    const btcActionSellData = btcActionSell.map((a) => ({
      x: a.time,
      y: findClosestPrice(userObj[fallbackMapping.btc] || [], a.time),
    }));

    const ndxSignalBuyData = ndxSignalBuy.map((s) => ({
      x: s.time,
      y: findClosestPrice(userObj[fallbackMapping.ndx] || [], s.time),
    }));
    const ndxSignalSellData = ndxSignalSell.map((s) => ({
      x: s.time,
      y: findClosestPrice(userObj[fallbackMapping.ndx] || [], s.time),
    }));
    const ndxActionBuyData = ndxActionBuy.map((a) => ({
      x: a.time,
      y: findClosestPrice(userObj[fallbackMapping.ndx] || [], a.time),
    }));
    const ndxActionSellData = ndxActionSell.map((a) => ({
      x: a.time,
      y: findClosestPrice(userObj[fallbackMapping.ndx] || [], a.time),
    }));

    function assignYAxis(dataset, labelContains) {
      if (multipleY) {
        if (
          labelContains === 'BTC' &&
          fallbackMapping.btc !== fallbackMapping.ndx
        )
          dataset.yAxisID = 'y';
        else dataset.yAxisID = 'y1';
      }
      return dataset;
    }

    const ndxSignalBuyDataset = assignYAxis(
      {
        label: 'NDX Signal - BUY',
        data: ndxSignalBuyData,
        showLine: false,
        pointStyle: 'circle',
        pointRadius: 8,
        borderWidth: 2,
        borderColor: 'purple',
        backgroundColor: 'transparent',
      },
      'NDX',
    );
    const ndxSignalSellDataset = assignYAxis(
      {
        label: 'NDX Signal - SELL',
        data: ndxSignalSellData,
        showLine: false,
        pointStyle: 'rectRot',
        pointRadius: 8,
        borderWidth: 2,
        borderColor: 'blue',
        backgroundColor: 'transparent',
      },
      'NDX',
    );

    const ndxActionBuyDataset = assignYAxis(
      {
        label: 'NDX Action - BUY',
        data: ndxActionBuyData,
        showLine: false,
        pointStyle: 'circle',
        pointRadius: 10,
        borderColor: 'purple',
        backgroundColor: 'purple',
      },
      'NDX',
    );
    const ndxActionSellDataset = assignYAxis(
      {
        label: 'NDX Action - SELL',
        data: ndxActionSellData,
        showLine: false,
        pointStyle: 'rectRot',
        pointRadius: 10,
        borderColor: 'blue',
        backgroundColor: 'blue',
      },
      'NDX',
    );

    const btcSignalBuyDataset = assignYAxis(
      {
        label:
          fallbackMapping.btc === 'btcPrice'
            ? 'BTC Signal - BUY'
            : 'BTC Signal',
        data: btcSignalBuyData,
        showLine: false,
        pointStyle: 'triangle',
        pointRadius: 8,
        borderWidth: 2,
        borderColor: 'green',
        backgroundColor: 'transparent',
      },
      'BTC',
    );
    const btcSignalSellDataset = assignYAxis(
      {
        label:
          fallbackMapping.btc === 'btcPrice'
            ? 'BTC Signal - SELL'
            : 'BTC Signal',
        data: btcSignalSellData,
        showLine: false,
        pointStyle: 'rect',
        pointRadius: 8,
        borderWidth: 2,
        borderColor: 'red',
        backgroundColor: 'transparent',
      },
      'BTC',
    );
    const actionBuyDataset = assignYAxis(
      {
        label:
          fallbackMapping.btc === 'btcPrice'
            ? 'BTC Action - BUY'
            : 'BTC Action',
        data: btcActionBuyData,
        showLine: false,
        pointStyle: 'triangle',
        pointRadius: 10,
        borderColor: 'green',
        backgroundColor: 'green',
      },
      'BTC',
    );
    const actionSellDataset = assignYAxis(
      {
        label:
          fallbackMapping.btc === 'btcPrice'
            ? 'BTC Action - SELL'
            : 'BTC Action',
        data: btcActionSellData,
        showLine: false,
        pointStyle: 'rect',
        pointRadius: 10,
        borderColor: 'red',
        backgroundColor: 'red',
      },
      'BTC',
    );

    return {
      datasets: [
        ...lineDatasets,
        btcSignalBuyDataset,
        btcSignalSellDataset,
        actionBuyDataset,
        actionSellDataset,
        ndxSignalBuyDataset,
        ndxSignalSellDataset,
        ndxActionBuyDataset,
        ndxActionSellDataset,
      ],
    };
  }

  function updateSignalPositionsForChart(
    chartRef,
    userData,
    instanceKey,
    fallbackMapping,
  ) {
    if (!chartRef.current || !userData) return;
    const chartInstance = chartRef.current;
    const datasets = chartInstance.data.datasets;
    datasets.forEach((ds) => {
      if (
        ds.label &&
        (ds.label.includes('Signal') || ds.label.includes('Action'))
      ) {
        let baseField = ds.label.includes('BTC')
          ? fallbackMapping.btc
          : ds.label.includes('NDX')
          ? fallbackMapping.ndx
          : null;
        if (baseField && userData[instanceKey][baseField]) {
          ds.data.forEach((pt) => {
            pt.y = findClosestPrice(userData[instanceKey][baseField], pt.x);
          });
        } else {
          const yScale = chartInstance.scales['y'];
          const midY = yScale ? (yScale.min + yScale.max) / 2 : 0;
          ds.data.forEach((pt) => {
            pt.y = midY;
          });
        }
      }
    });
    chartInstance.update();
  }

  function mergeData(prev, incoming) {
    if (!prev) return incoming;
    const newState = { ...prev };

    for (const instanceKey in incoming) {
      newState[instanceKey] = newState[instanceKey] || {};

      for (const field in incoming[instanceKey]) {
        newState[instanceKey][field] = newState[instanceKey][field] || [];

        for (const newItem of incoming[instanceKey][field]) {
          if (
            !newState[instanceKey][field].some((p) => p.time === newItem.time)
          ) {
            newState[instanceKey][field].push(newItem);
          }
        }
      }
    }

    return newState;
  }

  // Poll for new data every 30 seconds.
  useEffect(() => {
    let init = true;
    const fetchData = async () => {
      try {
        const res = await fetch(
          `https://lehre.bpm.in.tum.de/ports/14533/dashboard/data/poll?lastFetchTime=${lastFetchTime}`,
        );
        let { events, lastFetchTime: newFetchTime } = await res.json();
        lastFetchTime = newFetchTime;
        if (init) {
          setUserData(events);
          if (events && Object.keys(events).length > 0 && !selectedInstance) {
            const defaultInstance = Object.keys(events)[0];
            setSelectedInstance(defaultInstance);
            localStorage.setItem('selectedInstance', defaultInstance);
          }
          setLoading(false);
          init = false;
        } else {
          setUserData((prev) => mergeData(prev, events));
        }
      } catch (e) {
        console.error('Polling error:', e);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [selectedInstance]);

  const getAllTimes = () => {
    if (!userData) return [];
    let instanceKey = selectedInstance || Object.keys(userData)[0];
    if (!userData[instanceKey]) {
      instanceKey = Object.keys(userData)[0];
      setSelectedInstance(instanceKey);
      localStorage.setItem('selectedInstance', instanceKey);
      window.location.reload();
    }
    const userObj = userData[instanceKey];
    if (!userObj) return [];
    const times = Object.values(userObj)
      .flat()
      .map((entry) => entry.time)
      .filter((time) => time);
    return times.sort((a, b) => a - b);
  };

  useEffect(() => {
    if (!userData) return;
    const allTimes = getAllTimes();
    if (allTimes.length === 0) return;
    const dataMaxTime = allTimes[allTimes.length - 1];
    if (!visibleRange.start || !visibleRange.end) {
      setVisibleRange({ start: dataMaxTime - timeWindow, end: dataMaxTime });
    }
    const instanceKey = selectedInstance || Object.keys(userData)[0];
    const userObj = userData[instanceKey];
    setChartData1(
      buildChartDataForChart(
        userObj,
        ['btcPrice', 'ndxPrice'],
        { btc: 'btcPrice', ndx: 'ndxPrice' },
        true,
        visibleRange.end,
      ),
    );
    setChartData2(
      buildChartDataForChart(
        userObj,
        ['balance', 'unrealizedBalance'],
        { btc: 'unrealizedBalance', ndx: 'unrealizedBalance' },
        true,
        visibleRange.end,
      ),
    );
    setChartData3(
      buildChartDataForChart(
        userObj,
        ['btcAmount', 'ndxAmount'],
        { btc: 'btcAmount', ndx: 'btcAmount' },
        true,
        visibleRange.end,
      ),
    );
    if (chartRef1.current)
      updateSignalPositionsForChart(chartRef1, userData, instanceKey, {
        btc: 'btcPrice',
        ndx: 'ndxPrice',
      });
    if (chartRef2.current)
      updateSignalPositionsForChart(chartRef2, userData, instanceKey, {
        btc: 'unrealizedBalance',
        ndx: 'unrealizedBalance',
      });
    if (chartRef3.current)
      updateSignalPositionsForChart(chartRef3, userData, instanceKey, {
        btc: 'btcAmount',
        ndx: 'btcAmount',
      });
  }, [userData, timeWindow, selectedInstance, visibleRange]);

  useEffect(() => {
    if (!visibleRange.start || !visibleRange.end) return;
    setChartOptions1({
      scales: {
        x: {
          type: 'time',
          time: { unit: 'minute' },
          min: visibleRange.start,
          max: visibleRange.end,
        },
        y: {
          type: 'linear',
          position: 'left',
          title: { text: 'BTC Price', display: true },
        },
        y1: {
          type: 'linear',
          position: 'right',
          grid: { drawOnChartArea: false },
          title: { text: 'NDX Price', display: true },
        },
      },
      plugins: {
        title: { display: true, text: 'BTC/NDX Price' },
        legend: {
          display: true,
          labels: { usePointStyle: true },
          onClick: (e, legendItem, legend) => {
            const index = legendItem.datasetIndex;
            const ci = legend.chart;
            ci.isDatasetVisible(index) ? ci.hide(index) : ci.show(index);
            updateSignalPositionsForChart(
              chartRef1,
              userData,
              selectedInstance,
              {
                btc: 'btcPrice',
                ndx: 'ndxPrice',
              },
            );
          },
        },
      },
    });
    setChartOptions2({
      scales: {
        x: {
          type: 'time',
          time: { unit: 'minute' },
          min: visibleRange.start,
          max: visibleRange.end,
        },
        y: {
          type: 'linear',
          position: 'left',
          title: { text: 'Balance', display: true },
        },
        y1: {
          type: 'linear',
          position: 'right',
          grid: { drawOnChartArea: false },
          title: { text: 'Unrealized Balance', display: true },
        },
      },
      plugins: {
        title: { display: true, text: 'Balance/Unrealized Balance' },
        legend: {
          display: true,
          labels: { usePointStyle: true },
          onClick: (e, legendItem, legend) => {
            const index = legendItem.datasetIndex;
            const ci = legend.chart;
            ci.isDatasetVisible(index) ? ci.hide(index) : ci.show(index);
            updateSignalPositionsForChart(
              chartRef2,
              userData,
              selectedInstance,
              {
                btc: 'unrealizedBalance',
                ndx: 'unrealizedBalance',
              },
            );
          },
        },
      },
    });
    setChartOptions3({
      scales: {
        x: {
          type: 'time',
          time: { unit: 'minute' },
          min: visibleRange.start,
          max: visibleRange.end,
        },
        y: {
          type: 'linear',
          position: 'left',
          title: { text: 'BTC Amount', display: true },
        },
        y1: {
          type: 'linear',
          position: 'right',
          grid: { drawOnChartArea: false },
          title: { text: 'NDX Amount', display: true },
        },
      },
      plugins: {
        title: { display: true, text: 'BTC/NDX Amount' },
        legend: {
          display: true,
          labels: { usePointStyle: true },
          onClick: (e, legendItem, legend) => {
            const index = legendItem.datasetIndex;
            const ci = legend.chart;
            ci.isDatasetVisible(index) ? ci.hide(index) : ci.show(index);
            updateSignalPositionsForChart(
              chartRef3,
              userData,
              selectedInstance,
              {
                btc: 'btcAmount',
                ndx: 'btcAmount',
              },
            );
          },
        },
      },
    });
  }, [visibleRange, userData, selectedInstance]);

  useEffect(() => {
    if (selectedChart === 'chart1' && chartContainer1Ref.current) {
      chartContainer1Ref.current.scrollIntoView({ behavior: 'smooth' });
    } else if (selectedChart === 'chart2' && chartContainer2Ref.current) {
      chartContainer2Ref.current.scrollIntoView({ behavior: 'smooth' });
    } else if (selectedChart === 'chart3' && chartContainer3Ref.current) {
      chartContainer3Ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedChart]);

  useEffect(() => {
    navigateToLatestData();
  }, [userData]);

  const navigateToLatestData = () => {
    const allTimes = getAllTimes();
    if (allTimes.length === 0) return;
    const lastTime = allTimes[allTimes.length - 1];
    const currentTime = new Date().getTime() + 15000;
    if (
      lastTime - visibleRange.end < timeWindow ||
      currentTime - visibleRange.end < timeWindow
    ) {
      setVisibleRange({ start: currentTime - timeWindow, end: currentTime });
    }
  };

  const handleTimeWindowChange = (e) => {
    const newWindow = parseInt(e.target.value);
    setTimeWindow(newWindow);
    const allTimes = getAllTimes();
    if (allTimes.length > 0) {
      const dataMaxTime = allTimes[allTimes.length - 1];
      setVisibleRange({ start: dataMaxTime - newWindow, end: dataMaxTime });
    }
  };

  const handlePrev = () => {
    const allTimes = getAllTimes();
    if (allTimes.length === 0) return;
    let { start, end } = visibleRange;
    let found = false;
    while (allTimes.some((t) => t <= end - timeWindow)) {
      start = Math.max(start - timeWindow, allTimes[0]);
      end = start + timeWindow;
      if (allTimes.some((t) => t >= start && t <= end)) {
        found = true;
        break;
      }
    }
    if (found) setVisibleRange({ start, end });
  };

  const handleNext = () => {
    const allTimes = getAllTimes();
    if (allTimes.length === 0) return;
    let { start, end } = visibleRange;
    let found = false;
    while (allTimes.some((t) => t >= start + timeWindow)) {
      end = Math.min(end + timeWindow, allTimes[allTimes.length - 1]);
      start = end - timeWindow;
      if (allTimes.some((t) => t >= start && t <= end)) {
        found = true;
        break;
      }
    }
    if (found) setVisibleRange({ start, end });
  };

  if (loading) return <div>Loading...</div>;
  if (
    !chartData1.datasets.length &&
    !chartData2.datasets.length &&
    !chartData3.datasets.length
  )
    return <div>No data available to display.</div>;

  return (
    <div>
      {/* Fixed top bar */}
      <div className="fixed-top-bar">
        <div className="selection-container">
          {/* Time Window Group */}
          <div className="group">
            <label>Time Window</label>
            <div className="clickable-line">
              {[
                { label: '15min', value: 900000 },
                { label: '30min', value: 1800000 },
                { label: '1 hr', value: 3600000 },
                { label: '2 hr', value: 7200000 },
                { label: '3 hr', value: 10800000 },
                { label: '6 hr', value: 21600000 },
                { label: '12 hr', value: 43200000 },
              ].map((option, index, arr) => (
                <React.Fragment key={option.value}>
                  <span
                    className={timeWindow === option.value ? 'selected' : ''}
                    onClick={() =>
                      handleTimeWindowChange({
                        target: { value: option.value },
                      })
                    }
                  >
                    {option.label}
                  </span>
                  {index < arr.length - 1 && <div className="separator" />}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Instance Group using custom dropdown */}
          <div className="group">
            <label>Instance</label>
            <div className="custom-select-wrapper">
              <CustomSelect
                options={userData ? Object.keys(userData) : []}
                value={selectedInstance}
                onChange={(val) => {
                  setSelectedInstance(val);
                  localStorage.setItem('selectedInstance', val);
                }}
              />
            </div>
          </div>

          {/* Chart Selection Group */}
          <div className="group">
            <label>Chart</label>
            <div className="clickable-line">
              {[
                { label: 'BTC/NDX Price', value: 'chart1' },
                { label: 'Balance', value: 'chart2' },
                { label: 'BTC/NDX Amount', value: 'chart3' },
              ].map((option, index, arr) => (
                <React.Fragment key={option.value}>
                  <span
                    className={selectedChart === option.value ? 'selected' : ''}
                    onClick={() => setSelectedChart(option.value)}
                  >
                    {option.label}
                  </span>
                  {index < arr.length - 1 && <div className="separator" />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Margin to avoid charts being hidden under fixed bar */}
      <div style={{ marginTop: '120px' }}>
        {/* Chart 1 */}
        <div
          ref={chartContainer1Ref}
          className="chart-container"
          style={{ marginBottom: '20px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={handlePrev} style={arrowButtonStyle}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path
                  fillRule="evenodd"
                  d="M11.354 1.646a.5.5 0 0 1 0 .708L6.707 7l4.647 4.646a.5.5 0 0 1-.708.708l-5-5a.5.5 0 0 1 0-.708l5-5a.5.5 0 0 1 .708 0z"
                />
              </svg>
            </button>
            <div style={{ flex: 1 }}>
              <Line ref={chartRef1} data={chartData1} options={chartOptions1} />
            </div>
            <button onClick={handleNext} style={arrowButtonStyle}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path
                  fillRule="evenodd"
                  d="M4.646 1.646a.5.5 0 0 1 .708 0l5 5a.5.5 0 0 1 0 .708l-5 5a.5.5 0 0 1-.708-.708L9.293 7 4.646 2.354a.5.5 0 0 1 0-.708z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Chart 2 */}
        <div
          ref={chartContainer2Ref}
          className="chart-container"
          style={{ marginBottom: '20px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={handlePrev} style={arrowButtonStyle}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path
                  fillRule="evenodd"
                  d="M11.354 1.646a.5.5 0 0 1 0 .708L6.707 7l4.647 4.646a.5.5 0 0 1-.708.708l-5-5a.5.5 0 0 1 0-.708l5-5a.5.5 0 0 1 .708 0z"
                />
              </svg>
            </button>
            <div style={{ flex: 1 }}>
              <Line ref={chartRef2} data={chartData2} options={chartOptions2} />
            </div>
            <button onClick={handleNext} style={arrowButtonStyle}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path
                  fillRule="evenodd"
                  d="M4.646 1.646a.5.5 0 0 1 .708 0l5 5a.5.5 0 0 1 0 .708l-5 5a.5.5 0 0 1-.708-.708L9.293 7 4.646 2.354a.5.5 0 0 1 0-.708z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Chart 3 */}
        <div ref={chartContainer3Ref} className="chart-container">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={handlePrev} style={arrowButtonStyle}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path
                  fillRule="evenodd"
                  d="M11.354 1.646a.5.5 0 0 1 0 .708L6.707 7l4.647 4.646a.5.5 0 0 1-.708.708l-5-5a.5.5 0 0 1 0-.708l5-5a.5.5 0 0 1 .708 0z"
                />
              </svg>
            </button>
            <div style={{ flex: 1 }}>
              <Line ref={chartRef3} data={chartData3} options={chartOptions3} />
            </div>
            <button onClick={handleNext} style={arrowButtonStyle}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path
                  fillRule="evenodd"
                  d="M4.646 1.646a.5.5 0 0 1 .708 0l5 5a.5.5 0 0 1 0 .708l-5 5a.5.5 0 0 1-.708-.708L9.293 7 4.646 2.354a.5.5 0 0 1 0-.708z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <style jsx>{`
        .fixed-top-bar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: white;
          z-index: 1000;
          padding: 10px 0;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          font-family: 'Roboto', sans-serif;
        }
        .selection-container {
          display: flex;
          justify-content: center;
          align-items: stretch;
          gap: 20px;
        }
        .group {
          text-align: center;
          padding: 0 10px;
          border-right: 1px solid black;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .group:last-child {
          border-right: none;
        }
        .group label {
          margin-bottom: 10px;
          font-weight: bold;
          color: #2c3e50;
          font-family: 'Roboto', sans-serif;
        }
        .clickable-line {
          display: inline-flex;
          background-color: #f88379;
          padding: 10px;
          border-radius: 5px;
          font-family: 'Roboto', sans-serif;
          align-items: center;
        }
        .clickable-line span {
          padding: 8px 12px;
          cursor: pointer;
          color: black;
          transition: background-color 0.3s, color 0.3s;
        }
        .clickable-line span.selected {
          background-color: black;
          color: #f88379;
          border-radius: 4px;
        }
        .separator {
          width: 1px;
          background-color: black;
          margin: 0 10px;
        }
        .custom-select-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
          background-color: #f88379;
          border-radius: 5px;
          padding: 0 10px;
        }
        .chart-container {
          scroll-margin-top: 120px;
        }
      `}</style>
    </div>
  );
}
