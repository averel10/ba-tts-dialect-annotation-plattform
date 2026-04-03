'use client';

import { useEffect, useState } from 'react';
import { getAnnotationDistribution, DistributionDimension, DistributionData, DistributionItem, getAnnotatedSamples, AnnotatedSample } from '@/app/actions/annotation-stats';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import WaveformPlayer from './WaveformPlayer';

interface AnnotationDistributionProps {
  experimentId: number;
}

export default function AnnotationDistribution({ experimentId }: AnnotationDistributionProps) {
  const [dimension, setDimension] = useState<DistributionDimension>('dialect');
  const [data, setData] = useState<DistributionData | null>(null);
  const [samples, setSamples] = useState<AnnotatedSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [samplesLoading, setSamplesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [samplesError, setSamplesError] = useState<string | null>(null);

  const dimensions: { value: DistributionDimension; label: string }[] = [
    { value: 'dialect', label: 'Dialect' },
    { value: 'utteranceId', label: 'Utterance ID' },
    { value: 'model', label: 'Model' },
    { value: 'speaker', label: 'Speaker' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getAnnotationDistribution(experimentId, dimension);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load distribution');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [experimentId, dimension]);

  useEffect(() => {
    const fetchSamples = async () => {
      try {
        setSamplesLoading(true);
        const result = await getAnnotatedSamples(experimentId);
        setSamples(result);
        setSamplesError(null);
      } catch (err) {
        setSamplesError(err instanceof Error ? err.message : 'Failed to load samples');
        setSamples([]);
      } finally {
        setSamplesLoading(false);
      }
    };

    fetchSamples();
  }, [experimentId]);

  // Transform data for recharts
  const chartData = data?.items.map((item) => ({
    name: item.label,
    percentage: data.total > 0 ? ((item.count / data.total) * 100).toFixed(1) : 0,
    ...item,
  })) || [];

  // Calculate per-sample distribution (histogram of annotation counts)
  const sampleDistribution: { annotationCount: number; sampleCount: number; percentage: string }[] = [];
  const countMap = new Map<number, number>();
  
  samples.forEach((sample) => {
    const count = sample.annotationCount;
    countMap.set(count, (countMap.get(count) || 0) + 1);
  });
  
  // Convert to sorted array with percentages
  const totalSamples = samples.length;
  Array.from(countMap.entries())
    .map(([count, sampleCount]) => ({
      annotationCount: count,
      sampleCount,
      percentage: totalSamples > 0 ? ((sampleCount / totalSamples) * 100).toFixed(1) : '0',
    }))
    .sort((a, b) => a.annotationCount - b.annotationCount)
    .forEach((item) => sampleDistribution.push(item));

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Annotation Distribution</h2>
        
        {/* Dimension Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Group by:
          </label>
          <select
            value={dimension}
            onChange={(e) => setDimension(e.target.value as DistributionDimension)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {dimensions.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8 text-gray-600 h-[450px] flex items-center justify-center">
          Loading distribution data...
        </div>
      )}

      {error && (
        <div className="text-center py-8 text-red-600 h-[450px] flex items-center justify-center">
          Error: {error}
        </div>
      )}

      {data && !loading && (
        <div className="grid grid-cols-1 gap-6 mb-8">
          {/* Chart Section */}
          <div className="lg:col-span-2 h-[450px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis 
                    allowDecimals={false}
                    label={{ value: 'Annotation Count', angle: -90, position: 'insideLeft' }} 
                  />
                  <Tooltip 
                    formatter={(value: any, name: any) => {
                      if (name === 'count') return [value, 'Count'];
                      return [value, name];
                    }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                            <p className="font-semibold text-gray-900">{data.name}</p>
                            <p className="text-blue-600">Count: {data.count}</p>
                            <p className="text-gray-600 text-sm">Percentage: {data.percentage}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="count" 
                    fill="#3b82f6"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No annotations found for this distribution
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sample Annotation Distribution Chart */}
      {!samplesLoading && sampleDistribution.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Sample Annotation Coverage</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={sampleDistribution}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="annotationCount"
                  label={{ value: 'Annotations per Sample', position: 'bottom', offset: 10 }}
                />
                <YAxis 
                  label={{ value: 'Percentage of Samples (%)', angle: -90, position: 'insideLeft' }} 
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                          <p className="font-semibold text-gray-900">
                            {data.annotationCount} annotation{data.annotationCount !== 1 ? 's' : ''}
                          </p>
                          <p className="text-green-600">{data.percentage}% of samples</p>
                          <p className="text-gray-600 text-sm">({data.sampleCount} sample{data.sampleCount !== 1 ? 's' : ''})</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar 
                  dataKey="percentage" 
                  fill="#10b981"
                  name="Percentage (%)"
                  barCategoryGap="5%"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

    </div>
  );
}
