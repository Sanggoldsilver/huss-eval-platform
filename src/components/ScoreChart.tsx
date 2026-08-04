'use client';

import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface ScoreChartProps {
  scores: {
    problemDefinitionScore: number;
    visualizationCreativityScore: number;
    socialValueScore: number;
    majorUtilizationScore: number;
    dataAccuracyScore: number;
  };
}

export default function ScoreChart({ scores }: ScoreChartProps) {
  const radarData = [
    { subject: '문제인식', score: scores.problemDefinitionScore, fullMark: 30 },
    { subject: '창의성', score: scores.visualizationCreativityScore, fullMark: 30 },
    { subject: '사회적가치', score: scores.socialValueScore, fullMark: 15 },
    { subject: '전공활용', score: scores.majorUtilizationScore, fullMark: 15 },
    { subject: '정확성', score: scores.dataAccuracyScore, fullMark: 10 },
  ];

  const barData = [
    { name: '문제인식', score: scores.problemDefinitionScore, max: 30 },
    { name: '창의성', score: scores.visualizationCreativityScore, max: 30 },
    { name: '사회적가치', score: scores.socialValueScore, max: 15 },
    { name: '전공활용', score: scores.majorUtilizationScore, max: 15 },
    { name: '정확성', score: scores.dataAccuracyScore, max: 10 },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-4 w-full h-[560px] md:h-[300px]">
      <div className="flex-1 min-w-0 bg-gray-50 rounded-lg p-2">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 30]} tick={false} axisLine={false} />
            <Radar name="점수" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
            <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a' }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 min-w-0 bg-gray-50 rounded-lg p-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 30]} />
            <Tooltip
              cursor={{ fill: '#f1f5f9', opacity: 0.4 }}
              contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a' }}
            />
            <Bar dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
