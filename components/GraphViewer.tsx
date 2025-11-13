

import React, { useRef, useEffect, FC, useState } from 'react';
import * as d3 from 'd3';
import { GraphData, GraphNode, Selection } from '../types';
import { DownloadIcon, SaveIcon, CopyIcon } from './icons';
import { Tooltip } from './Tooltip';
import type { Theme } from './ThemeToggle';

interface GraphViewerProps {
    data: GraphData;
    onSelect: (selection: Selection) => void;
    selectedNodePath: string;
    collapsedNodes: Set<string>;
    onNodeToggle: (nodeId: string) => void;
    theme: Theme;
}

// --- Font Embedding Logic (for SVG export) ---
const fontCache = new Map<string, string>();
const getFontDataUrl = async (url: string): Promise<string> => {
    if (fontCache.has(url)) return fontCache.get(url)!;
    try {
        const cssResponse = await fetch(url);
        const cssText = await cssResponse.text();
        const fontUrlMatch = cssText.match(/url\((https:\/\/fonts\.gstatic\.com\/s\/inter\/[^)]+\.woff2)\)/);
        if (!fontUrlMatch) throw new Error("Could not find font URL in Google Fonts CSS.");
        
        const fontUrl = fontUrlMatch[1];
        const fontResponse = await fetch(fontUrl);
        const fontBlob = await fontResponse.blob();

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result as string;
                fontCache.set(url, base64data);
                resolve(base64data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(fontBlob);
        });
    } catch (error) {
        console.error("Failed to fetch and embed font:", error);
        throw error;
    }
};


export const GraphViewer: FC<GraphViewerProps> = ({ data, onSelect, selectedNodePath, collapsedNodes, onNodeToggle, theme }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [isDownloadOpen, setIsDownloadOpen] = useState(false);

    const isDarkMode =
        theme === 'dark' ||
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const getNodeAppearance = (node: GraphNode) => {
        const isSelected = selectedNodePath === node.id;
        const isCollapsed = collapsedNodes.has(node.id);
        const hasChildren = typeof node.value === 'object' && node.value !== null && Object.keys(node.value).length > 0;
        const type = Array.isArray(node.value) ? 'array' : typeof node.value;
    
        const radii = { object: 12, array: 12, string: 8, number: 8, boolean: 8, default: 8 };
        const baseRadius = radii[type] || radii.default;

        const light = { fill: '#64748b', stroke: '#94a3b8' };
        const dark = { fill: '#94a3b8', stroke: '#64748b' };
        
        let colors = isDarkMode ? dark : light;
        if (type === 'object') colors = { fill: '#0ea5e9', stroke: '#0369a1' };
        if (type === 'array') colors = { fill: '#10b981', stroke: '#047857' };
        if (type === 'string') colors = { fill: '#f59e0b', stroke: '#92400e' };
        if (type === 'number') colors = { fill: '#6366f1', stroke: '#3730a3' };
        if (type === 'boolean') colors = { fill: '#a855f7', stroke: '#6b21a8' };
        
        return {
            radius: baseRadius + node.depth * 0.5 + (hasChildren ? 2 : 0),
            fill: colors.fill,
            stroke: isSelected ? '#3b82f6' : (isCollapsed ? '#a855f7' : colors.stroke),
            strokeWidth: isSelected ? 3 : (isCollapsed ? 2.5 : 1.5),
        };
    };


    useEffect(() => {
        if (!svgRef.current || !data) return;

        const { nodes, edges } = data;
        const svg = d3.select(svgRef.current);
        const parent = svg.node().parentElement;
        const width = parent.clientWidth;
        const height = parent.clientHeight;
        svg.attr('viewBox', `0 0 ${width} ${height}`);

        svg.selectAll('*').remove(); // Clear previous render

        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(edges).id((d: any) => d.id).distance(d => 60 + (d.source.depth || 0) * 20).strength(0.6))
            .force('charge', d3.forceManyBody().strength(-400)) // Increased repulsion force to create more space
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collide', d3.forceCollide().radius((d: any) => getNodeAppearance(d).radius + 15)); // Increased padding

        const zoom = d3.zoom().scaleExtent([0.1, 8]).on('zoom', (event) => {
            g.attr('transform', event.transform);
        });
        svg.call(zoom);

        const g = svg.append('g').attr('class', 'everything');

        const link = g.append('g')
            .attr('stroke-opacity', 0.6)
            .selectAll('line')
            .data(edges)
            .join('line')
            .attr('stroke', isDarkMode ? '#4b5563' : '#cbd5e1')
            .attr('stroke-width', 1.5);

        const node = g.append('g')
            .selectAll('g')
            .data(nodes)
            .join('g')
            .attr('class', 'cursor-pointer')
            .call(drag(simulation));

        node.append('circle')
            .attr('r', d => getNodeAppearance(d).radius)
            .attr('fill', d => getNodeAppearance(d).fill)
            .attr('stroke', d => getNodeAppearance(d).stroke)
            .attr('stroke-width', d => getNodeAppearance(d).strokeWidth);

        const text = node.append('text')
            .attr('y', 5) // Vertically align text
            .attr('fill', isDarkMode ? '#f8fafc' : '#0f172a')
            .style('font-size', '13px')
            .style('font-weight', d => (d.depth === 0 ? 'bold' : 'normal'))
            .style('pointer-events', 'none');

        if (isDarkMode) {
            text.style('text-shadow', '0px 1px 3px rgba(0, 0, 0, 0.7)');
        }
        
        text.each(function(d) {
            const isObject = typeof d.value === 'object' && d.value !== null;
            const isCollapsed = collapsedNodes.has(d.id);
            const textSelection = d3.select(this);
            
            textSelection.append('tspan').text(d.key);

            if (isCollapsed && isObject) {
                const indicator = Array.isArray(d.value) ? ' [...]' : ' {...}';
                textSelection.append('tspan')
                    .text(indicator)
                    .style('fill-opacity', 0.7)
                    .style('font-style', 'italic');
            }
        });


        node.on('click', (event, d) => {
            event.stopPropagation();
            onSelect({ path: d.id, key: d.key, value: d.value });
            if (typeof d.value === 'object' && d.value !== null && Object.keys(d.value).length > 0) {
                onNodeToggle(d.id);
            }
        });

        simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            node.attr('transform', d => `translate(${d.x}, ${d.y})`);

            text
                .attr('x', d => getNodeAppearance(d).radius + 8)
                .attr('text-anchor', 'start');
        });

        simulation.on('end', () => {
            if (!svgRef.current) return;
        
            const svgEl = d3.select(svgRef.current);
            const contentGroup = svgEl.select<SVGGElement>('.everything');
            const parentEl = svgEl.node().parentElement;
        
            if (!contentGroup.node() || !parentEl) return;
        
            const width = parentEl.clientWidth;
            const height = parentEl.clientHeight;
        
            const bounds = contentGroup.node().getBBox();
            
            if (bounds.width === 0 || bounds.height === 0) return;
        
            const dx = bounds.width;
            const dy = bounds.height;
            const x = bounds.x + dx / 2;
            const y = bounds.y + dy / 2;
        
            const scale = Math.min(0.9, 0.9 / Math.max(dx / width, dy / height));
            const translate = [width / 2 - scale * x, height / 2 - scale * y];
        
            const transform = d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale);
        
            svgEl.transition()
                .duration(750)
                .call(zoom.transform, transform);
        });

        return () => {
            simulation.stop();
        };

    }, [data, isDarkMode, selectedNodePath, collapsedNodes, onNodeToggle, onSelect]);

    const drag = (simulation) => {
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }
        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }
        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
        return d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended);
    }
    
    const getStyledSvgString = async (): Promise<string> => {
        const originalSvg = svgRef.current;
        if (!originalSvg) throw new Error("SVG element not found for export.");

        const originalContentGroup = originalSvg.querySelector('.everything');
        if (!originalContentGroup) throw new Error("Could not find graph content for export.");
        
        const box = (originalContentGroup as SVGGElement).getBBox();
        const padding = 50;
        const finalWidth = box.width + padding * 2;
        const finalHeight = box.height + padding * 2;

        if (box.width === 0 || box.height === 0) {
            console.warn("Graph content has zero dimensions, export may be empty.");
        }
    
        const svgClone = originalSvg.cloneNode(true) as SVGSVGElement;
        
        const contentGroup = svgClone.querySelector('.everything');
        if (contentGroup) {
          contentGroup.removeAttribute('transform'); 
        }
    
        svgClone.setAttribute('width', String(finalWidth));
        svgClone.setAttribute('height', String(finalHeight));
        svgClone.setAttribute('viewBox', `${box.x - padding} ${box.y - padding} ${finalWidth} ${finalHeight}`);
    
        const fontDataUrl = await getFontDataUrl('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
        styleElement.textContent = `@font-face { font-family: 'Inter'; src: url(${fontDataUrl}) format('woff2'); } text { font-family: 'Inter', sans-serif; }`;
    
        const backgroundRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        backgroundRect.setAttribute('width', '100%');
        backgroundRect.setAttribute('height', '100%');
        backgroundRect.setAttribute('fill', isDarkMode ? '#0f172a' : '#f8fafc');
        backgroundRect.setAttribute('x', `${box.x - padding}`);
        backgroundRect.setAttribute('y', `${box.y - padding}`);
    
        svgClone.prepend(styleElement);
        svgClone.prepend(backgroundRect);
    
        return new XMLSerializer().serializeToString(svgClone);
    };

    const downloadSVG = async () => {
        try {
            const svgData = await getStyledSvgString();
            const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'graph.svg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            setIsDownloadOpen(false);
        } catch (e) {
            console.error("Failed to download SVG:", e);
        }
    };

    const downloadPNG = async () => {
        try {
            const svgData = await getStyledSvgString();
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const svgUrl = URL.createObjectURL(svgBlob);
            
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                
                const svgElement = new DOMParser().parseFromString(svgData, 'image/svg+xml').querySelector('svg');
                const svgWidth = parseFloat(svgElement?.getAttribute('width') || '1200');
                const svgHeight = parseFloat(svgElement?.getAttribute('height') || '800');

                const MAX_CANVAS_DIMENSION = 16384;
                const scale = 2;

                let canvasWidth = svgWidth * scale;
                let canvasHeight = svgHeight * scale;

                if (canvasWidth > MAX_CANVAS_DIMENSION || canvasHeight > MAX_CANVAS_DIMENSION) {
                    const ratio = Math.min(MAX_CANVAS_DIMENSION / canvasWidth, MAX_CANVAS_DIMENSION / canvasHeight);
                    canvasWidth *= ratio;
                    canvasHeight *= ratio;
                    console.warn(`Graph is too large for high-res export. Scaling down to fit within ${MAX_CANVAS_DIMENSION}px.`);
                }
                
                canvas.width = canvasWidth;
                canvas.height = canvasHeight;
                const ctx = canvas.getContext('2d');
                
                if (ctx) {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const pngUrl = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = pngUrl;
                            link.download = 'graph.png';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(pngUrl);
                        }
                        URL.revokeObjectURL(svgUrl);
                        setIsDownloadOpen(false);
                    }, 'image/png');
                } else {
                     URL.revokeObjectURL(svgUrl);
                }
            };
            img.onerror = (e) => {
                console.error("Failed to load SVG into Image for PNG conversion.", e);
                URL.revokeObjectURL(svgUrl);
            };
            img.src = svgUrl;
        } catch (e) {
            console.error("Failed to download PNG:", e);
        }
    };

    const saveGraph = async () => {
        try {
            const svgData = await getStyledSvgString();
            const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            
            // Use File System Access API if available (modern browsers)
            if ('showSaveFilePicker' in window) {
                const handle = await (window as any).showSaveFilePicker({
                    suggestedName: 'graph.svg',
                    types: [{
                        description: 'SVG Image',
                        accept: { 'image/svg+xml': ['.svg'] }
                    }]
                });
                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
            } else {
                // Fallback to download
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'graph.svg';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
        } catch (e) {
            console.error("Failed to save graph:", e);
        }
    };

    const copyGraphToClipboard = async () => {
        try {
            const svgData = await getStyledSvgString();
            
            // Try to copy as image first (PNG)
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const svgUrl = URL.createObjectURL(svgBlob);
            
            const img = new Image();
            img.onload = async () => {
                const canvas = document.createElement('canvas');
                const svgElement = new DOMParser().parseFromString(svgData, 'image/svg+xml').querySelector('svg');
                const svgWidth = parseFloat(svgElement?.getAttribute('width') || '1200');
                const svgHeight = parseFloat(svgElement?.getAttribute('height') || '800');
                
                canvas.width = svgWidth;
                canvas.height = svgHeight;
                const ctx = canvas.getContext('2d');
                
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    
                    canvas.toBlob(async (blob) => {
                        if (blob) {
                            try {
                                await navigator.clipboard.write([
                                    new ClipboardItem({ 'image/png': blob })
                                ]);
                                console.log('Graph copied to clipboard as image');
                            } catch (clipboardError) {
                                console.error("Failed to copy to clipboard:", clipboardError);
                            }
                        }
                        URL.revokeObjectURL(svgUrl);
                    }, 'image/png');
                }
            };
            img.onerror = () => {
                URL.revokeObjectURL(svgUrl);
            };
            img.src = svgUrl;
        } catch (e) {
            console.error("Failed to copy graph:", e);
        }
    };

    return (
        <div 
            className="w-full h-full relative" 
            style={{ minHeight: '400px' }}
            onClick={() => setIsDownloadOpen(false)}
        >
            <svg ref={svgRef} width="100%" height="100%" className="bg-slate-50 dark:bg-dark-bg/50 select-none"></svg>
             <div className="absolute top-2 right-2 flex gap-2" style={{ zIndex: 100000 }}>
                <Tooltip content="Save to System">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            saveGraph();
                        }} 
                        className="control-button save-button"
                        style={{ position: 'relative', zIndex: 100001 }}
                    >
                        <SaveIcon className="w-5 h-5" />
                    </button>
                </Tooltip>
                <Tooltip content="Copy Graph">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            copyGraphToClipboard();
                        }} 
                        className="control-button copy-button"
                        style={{ position: 'relative', zIndex: 100001 }}
                    >
                        <CopyIcon className="w-5 h-5" />
                    </button>
                </Tooltip>
                <div className="relative" style={{ zIndex: 100001 }}>
                    <Tooltip content="Download Graph">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsDownloadOpen(p => !p);
                            }} 
                            className="control-button download-button"
                            style={{ position: 'relative', zIndex: 100001 }}
                        >
                            <DownloadIcon className="w-5 h-5" />
                        </button>
                    </Tooltip>
                    {isDownloadOpen && (
                        <div 
                            className="absolute top-full right-0 mt-2 w-40 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-slate-200 dark:border-slate-700"
                            style={{ zIndex: 100002 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button onClick={downloadSVG} className="download-option">Download as SVG</button>
                            <button onClick={downloadPNG} className="download-option">Download as PNG</button>
                        </div>
                    )}
                </div>
            </div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-max max-w-[90%] text-center text-xs text-slate-500 dark:text-slate-400 p-2 bg-white/70 dark:bg-dark-card/70 rounded-md backdrop-blur-sm pointer-events-none shadow-md">
                Tip: Click nodes to expand/collapse. Scroll to zoom, and drag to explore the graph.
            </div>
             <style>{`
                .control-button {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 36px;
                    height: 36px;
                    background-color: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 0.375rem;
                    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
                    transition: all 0.2s;
                    color: #475569;
                    cursor: pointer;
                }
                .dark .control-button {
                    background-color: #1e293b;
                    border-color: #334155;
                    color: #cbd5e1;
                }
                
                /* Save Button - Green */
                .save-button {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    border-color: #059669;
                    color: white;
                }
                .dark .save-button {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    border-color: #047857;
                }
                .save-button:hover {
                    background: linear-gradient(135deg, #059669 0%, #047857 100%);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3), 0 2px 4px -1px rgba(16, 185, 129, 0.2);
                }
                
                /* Copy Button - Blue */
                .copy-button {
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    border-color: #2563eb;
                    color: white;
                }
                .dark .copy-button {
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    border-color: #1d4ed8;
                }
                .copy-button:hover {
                    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3), 0 2px 4px -1px rgba(59, 130, 246, 0.2);
                }
                
                /* Download Button - Purple */
                .download-button {
                    background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
                    border-color: #9333ea;
                    color: white;
                }
                .dark .download-button {
                    background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
                    border-color: #7e22ce;
                }
                .download-button:hover {
                    background: linear-gradient(135deg, #9333ea 0%, #7e22ce 100%);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 6px -1px rgba(168, 85, 247, 0.3), 0 2px 4px -1px rgba(168, 85, 247, 0.2);
                }
                
                .download-option {
                    display: block;
                    width: 100%;
                    padding: 0.5rem 1rem;
                    text-align: left;
                    font-size: 0.875rem;
                    color: #1f2937;
                    transition: background-color 0.2s;
                }
                .dark .download-option {
                    color: #e5e7eb;
                }
                .download-option:hover {
                    background-color: #f0f9ff;
                }
                .dark .download-option:hover {
                    background-color: #1e293b;
                }
            `}</style>
        </div>
    );
};
