
import React from 'react';
import { AnalysisResult, Determination } from '../types';

const determinationStyles: { [key in Determination]: string } = {
    'Likely AI-Generated': 'bg-red-500/20 text-red-400 border-red-500/50',
    'Likely Human-Generated': 'bg-green-500/20 text-green-400 border-green-500/50',
    'Inconclusive': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
};

const confidenceColor = (confidence: number) => {
    if (confidence > 75) return 'bg-red-500';
    if (confidence > 50) return 'bg-yellow-500';
    return 'bg-green-500';
};

const ResultDisplay: React.FC<{ result: AnalysisResult }> = ({ result }) => {
    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mt-6 animate-fade-in">
            <h2 className="text-2xl font-bold mb-4 text-gray-100">Analysis Result</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Determination */}
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Determination</h3>
                    <p className={`text-lg font-semibold px-3 py-1 rounded-full inline-block ${determinationStyles[result.determination]}`}>
                        {result.determination}
                    </p>
                </div>

                {/* Confidence Score */}
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Confidence Score</h3>
                    <div className="flex items-center gap-3">
                        <div className="w-full bg-gray-700 rounded-full h-4">
                             <div 
                                className={`h-4 rounded-full transition-all duration-500 ${confidenceColor(result.confidence)}`} 
                                style={{ width: `${result.confidence}%` }}
                             ></div>
                        </div>
                        <span className="font-bold text-lg text-gray-200">{result.confidence}%</span>
                    </div>
                </div>
            </div>

            {/* Rationale */}
            <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-300 mb-2">Rationale</h3>
                <div className="prose prose-invert prose-sm sm:prose-base max-w-none text-gray-400 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                   <p dangerouslySetInnerHTML={{ __html: result.rationale.replace(/\n/g, '<br />') }} />
                </div>
            </div>
        </div>
    );
};

export default ResultDisplay;
