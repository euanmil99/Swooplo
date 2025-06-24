import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';
import * as d3 from 'd3';

interface TopicNode {
  id: string;
  name: string;
  value: number;
  type: 'pillar' | 'subtopic' | 'supporting';
  level: number;
  searchVolume?: number;
  difficulty?: number;
  keywords?: string[];
}

interface TopicLink {
  source: string;
  target: string;
  value: number;
}

interface TopicClusterData {
  nodes: TopicNode[];
  links: TopicLink[];
}

interface TopicClusterGraphProps {
  data?: TopicClusterData;
  width?: number;
  height?: number;
  onNodeClick?: (node: TopicNode) => void;
}

export default function TopicClusterGraph({ 
  data, 
  width = 800, 
  height = 600,
  onNodeClick 
}: TopicClusterGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Mock data if none provided
  const mockData: TopicClusterData = {
    nodes: [
      { id: "1", name: "Affiliate Marketing", value: 100, type: "pillar", level: 0, searchVolume: 12000, difficulty: 45 },
      { id: "2", name: "Product Selection", value: 70, type: "subtopic", level: 1, searchVolume: 8500, difficulty: 38 },
      { id: "3", name: "Traffic Sources", value: 80, type: "subtopic", level: 1, searchVolume: 9200, difficulty: 42 },
      { id: "4", name: "Content Strategy", value: 85, type: "subtopic", level: 1, searchVolume: 7800, difficulty: 35 },
      { id: "5", name: "Conversion Optimization", value: 75, type: "subtopic", level: 1, searchVolume: 6800, difficulty: 48 },
      { id: "6", name: "Digital Products", value: 50, type: "supporting", level: 2, searchVolume: 5600, difficulty: 28 },
      { id: "7", name: "Physical Products", value: 50, type: "supporting", level: 2, searchVolume: 4200, difficulty: 52 },
      { id: "8", name: "SEO Traffic", value: 60, type: "supporting", level: 2, searchVolume: 6800, difficulty: 31 },
      { id: "9", name: "Social Traffic", value: 55, type: "supporting", level: 2, searchVolume: 5900, difficulty: 25 },
      { id: "10", name: "Blogging", value: 65, type: "supporting", level: 2, searchVolume: 7200, difficulty: 35 },
      { id: "11", name: "Video Content", value: 70, type: "supporting", level: 2, searchVolume: 8100, difficulty: 42 },
      { id: "12", name: "Landing Pages", value: 55, type: "supporting", level: 2, searchVolume: 4800, difficulty: 38 },
      { id: "13", name: "Email Funnels", value: 60, type: "supporting", level: 2, searchVolume: 5200, difficulty: 33 }
    ],
    links: [
      { source: "1", target: "2", value: 5 },
      { source: "1", target: "3", value: 5 },
      { source: "1", target: "4", value: 5 },
      { source: "1", target: "5", value: 5 },
      { source: "2", target: "6", value: 3 },
      { source: "2", target: "7", value: 3 },
      { source: "3", target: "8", value: 3 },
      { source: "3", target: "9", value: 3 },
      { source: "4", target: "10", value: 3 },
      { source: "4", target: "11", value: 3 },
      { source: "5", target: "12", value: 3 },
      { source: "5", target: "13", value: 3 }
    ]
  };
  
  const graphData = data || mockData;
  
  useEffect(() => {
    if (!svgRef.current) return;
    
    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove();
    
    // Set up the SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
    
    // Create a force simulation
    const simulation = d3.forceSimulation(graphData.nodes as any)
      .force("link", d3.forceLink(graphData.links as any).id((d: any) => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(0, 0))
      .force("collide", d3.forceCollide().radius((d: any) => d.value / 8 + 25));
    
    // Node color scale based on type
    const colorScale = (type: string) => {
      switch(type) {
        case 'pillar': return "#4f46e5"; // Indigo
        case 'subtopic': return "#2563eb"; // Blue
        case 'supporting': return "#7c3aed"; // Purple
        default: return "#9ca3af"; // Gray
      }
    };

    // Node size scale based on value
    const sizeScale = (value: number) => {
      return Math.max(value / 10 + 15, 20);
    };
    
    // Draw links
    const link = svg.append("g")
      .selectAll("line")
      .data(graphData.links)
      .enter()
      .append("line")
      .attr("stroke", "#9ca3af")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d: any) => Math.sqrt(d.value) * 2);
    
    // Create node groups
    const node = svg.append("g")
      .selectAll(".node")
      .data(graphData.nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .style("cursor", "pointer")
      .on("click", (event, d: any) => {
        if (onNodeClick) onNodeClick(d);
      })
      .call(d3.drag()
        .on("start", dragStarted)
        .on("drag", dragged)
        .on("end", dragEnded));
    
    // Add circles to node groups
    node.append("circle")
      .attr("r", (d: any) => sizeScale(d.value))
      .attr("fill", (d: any) => colorScale(d.type))
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2)
      .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.1))");
    
    // Add labels to node groups
    node.append("text")
      .attr("dy", 3)
      .attr("text-anchor", "middle")
      .text((d: any) => d.name.length > 12 ? d.name.substring(0, 12) + "..." : d.name)
      .attr("fill", "#ffffff")
      .attr("font-size", "11px")
      .attr("font-weight", "bold");
    
    // Add type badges
    node.append("text")
      .attr("dy", 20)
      .attr("text-anchor", "middle")
      .text((d: any) => d.type.toUpperCase())
      .attr("fill", "#ffffff")
      .attr("font-size", "8px")
      .attr("opacity", 0.8);
    
    // Define drag functions
    function dragStarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragEnded(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    
    // Update function for the simulation
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);
      
      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });
    
    // Add zoom functionality
    const zoom = d3.zoom()
      .extent([[0, 0], [width, height]])
      .scaleExtent([0.1, 8])
      .on("zoom", zoomed);
    
    d3.select(svgRef.current).call(zoom as any);
    
    function zoomed(event: any) {
      svg.attr("transform", event.transform);
    }
    
    // Cleanup function
    return () => {
      simulation.stop();
    };
    
  }, [graphData, width, height, onNodeClick]);
  
  const handleZoomIn = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().call(
      d3.zoom().scaleBy as any,
      1.5
    );
  };

  const handleZoomOut = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().call(
      d3.zoom().scaleBy as any,
      1 / 1.5
    );
  };

  const handleReset = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().call(
      d3.zoom().transform as any,
      d3.zoomIdentity
    );
  };

  const handleDownload = () => {
    const svg = d3.select(svgRef.current);
    const svgData = svg.node()?.outerHTML;
    if (svgData) {
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'topic-cluster-graph.svg';
      link.click();
      URL.revokeObjectURL(url);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Topic Cluster Visualization</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 mt-2">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
            <span className="text-xs">Pillar Topics</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-xs">Subtopic Clusters</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-xs">Supporting Content</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto">
          <svg ref={svgRef} className="w-full h-[600px]" />
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <p>Nodes: {graphData.nodes.length} • Links: {graphData.links.length}</p>
          <p className="text-xs mt-1">
            Click and drag nodes to reposition • Use zoom controls to explore • Click nodes for details
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 