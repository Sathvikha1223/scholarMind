import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  flowchart: { useMaxWidth: true, htmlLabels: true }
});

interface MindmapProps {
  code: string;
}

export const Mindmap: React.FC<MindmapProps> = ({ code }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code || !containerRef.current) return;
    
    setError(null);
    const id = `mermaid-svg-${Math.floor(Math.random() * 10000)}`;
    
    const renderChart = async () => {
      try {
        // Clean double lines or characters
        let cleanCode = code.trim();
        if (!cleanCode.startsWith('graph') && !cleanCode.startsWith('flowchart')) {
          cleanCode = `graph TD\n${cleanCode}`;
        }
        
        const { svg: renderedSvg } = await mermaid.render(id, cleanCode);
        setSvg(renderedSvg);
      } catch (err: any) {
        console.error("Mermaid parsing error:", err);
        setError("Failed to render mind map. Concept mapping is currently building or syntax is complex.");
        // Clear broken SVG state
        setSvg('');
      }
    };

    renderChart();
  }, [code]);

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-900/50">
        {error}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full flex items-center justify-center p-4 bg-gray-900 rounded-2xl border border-gray-800 overflow-x-auto">
      {svg ? (
        <div 
          className="max-w-full text-white" 
          dangerouslySetInnerHTML={{ __html: svg }} 
        />
      ) : (
        <div className="text-gray-400 animate-pulse text-sm">Generating visual connections...</div>
      )}
    </div>
  );
};
