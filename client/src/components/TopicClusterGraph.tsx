import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ZoomIn, ZoomOut, RotateCcw, Download, Filter, Info } from 'lucide-react';

export interface TopicNode {
  id: string;
  label: string;
  type: 'pillar' | 'subtopic' | 'supporting';
  level: number;
  size?: number;
  color?: string;
  keywords?: string[];
  searchVolume?: number;
  difficulty?: number;
  x?: number;
  y?: number;
}

export interface TopicLink {
  source: string;
  target: string;
  strength?: number;
}

export interface TopicClusterGraphProps {
  nodes: TopicNode[];
  links: TopicLink[];
  width?: number;
  height?: number;
  onNodeClick?: (node: TopicNode) => void;
  onNodeHover?: (node: TopicNode | null) => void;
}

export function TopicClusterGraph({ 
  nodes, 
  links, 
  width = 800, 
  height = 600,
  onNodeClick,
  onNodeHover
}: TopicClusterGraphProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<TopicNode | null>(null);
  const [zoom, setZoom] = useState(1);

  // Filter nodes based on selected type
  const filteredNodes = selectedType 
    ? nodes.filter(node => node.type === selectedType)
    : nodes;

  const getNodeColor = (node: TopicNode) => {
    if (node.color) return node.color;
    
    switch (node.type) {
      case 'pillar':
        return '#ef4444'; // Red
      case 'subtopic':
        return '#06b6d4'; // Cyan
      case 'supporting':
        return '#84cc16'; // Lime
      default:
        return '#6b7280'; // Gray
    }
  };

  const getNodeSize = (node: TopicNode) => {
    switch (node.type) {
      case 'pillar':
        return 60;
      case 'subtopic':
        return 50;
      case 'supporting':
        return 40;
      default:
        return 45;
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.5));
  };

  const handleReset = () => {
    setZoom(1);
  };

  const handleDownload = () => {
    // Create a simple text export for now
    const data = {
      nodes: filteredNodes,
      links: links.filter(link => 
        filteredNodes.some(node => node.id === link.source) &&
        filteredNodes.some(node => node.id === link.target)
      )
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'topic-cluster-data.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const nodeTypes = ['pillar', 'subtopic', 'supporting'];

  // Simple grid layout for nodes
  const getNodePosition = (index: number, total: number) => {
    const cols = Math.ceil(Math.sqrt(total));
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    return {
      x: (col + 1) * (width / (cols + 1)),
      y: (row + 1) * (height / (Math.ceil(total / cols) + 1))
    };
  };

  return (
    <Card>
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
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Filter by type:</span>
            {nodeTypes.map(type => (
              <Button
                key={type}
                variant={selectedType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType(selectedType === type ? null : type)}
                className="capitalize"
              >
                {type}
              </Button>
            ))}
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-xs">Pillar</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
              <span className="text-xs">Subtopic</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-lime-500"></div>
              <span className="text-xs">Supporting</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="relative border rounded-lg bg-gray-50" style={{ height, overflow: 'hidden' }}>
          <div 
            className="relative w-full h-full"
            style={{ 
              transform: `scale(${zoom})`,
              transformOrigin: 'center center'
            }}
          >
            {/* Render nodes in a grid layout */}
            {filteredNodes.map((node, index) => {
              const position = getNodePosition(index, filteredNodes.length);
              const size = getNodeSize(node);
              
              return (
                <div
                  key={node.id}
                  className="absolute cursor-pointer transition-all duration-200 hover:scale-110"
                  style={{
                    left: position.x - size / 2,
                    top: position.y - size / 2,
                    width: size,
                    height: size
                  }}
                  onClick={() => onNodeClick?.(node)}
                  onMouseEnter={() => {
                    setHoveredNode(node);
                    onNodeHover?.(node);
                  }}
                  onMouseLeave={() => {
                    setHoveredNode(null);
                    onNodeHover?.(null);
                  }}
                >
                  <div
                    className="w-full h-full rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-xs"
                    style={{ backgroundColor: getNodeColor(node) }}
                  >
                    {node.label.length > 8 ? node.label.substring(0, 8) + '...' : node.label}
                  </div>
                  
                  {/* Node label */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1">
                    <div className="text-xs font-medium text-gray-700 text-center whitespace-nowrap">
                      {node.label}
                    </div>
                    <Badge variant="outline" className="text-xs mt-1">
                      {node.type}
                    </Badge>
                  </div>
                </div>
              );
            })}

            {/* Render connections (simplified) */}
            {links.map((link, index) => {
              const sourceNode = filteredNodes.find(n => n.id === link.source);
              const targetNode = filteredNodes.find(n => n.id === link.target);
              
              if (!sourceNode || !targetNode) return null;
              
              const sourceIndex = filteredNodes.indexOf(sourceNode);
              const targetIndex = filteredNodes.indexOf(targetNode);
              const sourcePos = getNodePosition(sourceIndex, filteredNodes.length);
              const targetPos = getNodePosition(targetIndex, filteredNodes.length);
              
              return (
                <svg
                  key={`${link.source}-${link.target}`}
                  className="absolute inset-0 pointer-events-none"
                  style={{ zIndex: -1 }}
                >
                  <line
                    x1={sourcePos.x}
                    y1={sourcePos.y}
                    x2={targetPos.x}
                    y2={targetPos.y}
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeOpacity={0.6}
                    markerEnd="url(#arrowhead)"
                  />
                </svg>
              );
            })}

            {/* Arrow marker definition */}
            <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: -2 }}>
              <defs>
                <marker
                  id="arrowhead"
                  viewBox="0 -5 10 10"
                  refX="8"
                  refY="0"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                >
                  <path d="M0,-5L10,0L0,5" fill="#94a3b8" />
                </marker>
              </defs>
            </svg>
          </div>

          {/* Tooltip */}
          {hoveredNode && (
            <div
              className="absolute z-10 p-3 bg-white border rounded-lg shadow-lg text-sm max-w-xs"
              style={{
                left: '50%',
                top: '10px',
                transform: 'translateX(-50%)',
                pointerEvents: 'none'
              }}
            >
              <div className="font-medium">{hoveredNode.label}</div>
              <div className="text-gray-600">Type: {hoveredNode.type}</div>
              {hoveredNode.searchVolume && (
                <div className="text-gray-600">Search Volume: {hoveredNode.searchVolume}</div>
              )}
              {hoveredNode.difficulty && (
                <div className="text-gray-600">Difficulty: {hoveredNode.difficulty}/100</div>
              )}
              {hoveredNode.keywords && hoveredNode.keywords.length > 0 && (
                <div className="text-gray-600">
                  Keywords: {hoveredNode.keywords.slice(0, 3).join(', ')}
                  {hoveredNode.keywords.length > 3 && '...'}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <p>Zoom: {zoom.toFixed(2)}x • Nodes: {filteredNodes.length} • Links: {links.length}</p>
          <p className="text-xs mt-1 flex items-center">
            <Info className="w-3 h-3 mr-1" />
            Click nodes for details • Hover for tooltips • Use buttons to zoom and filter
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 