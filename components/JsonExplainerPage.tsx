import React, { useState, useCallback } from 'react';
import { ExplainerView } from './ExplainerView';
import { Explanation, Selection, GraphData } from '../types';
import { convertJsonToGraphData } from '../utils/graphUtils';
import { generateSingleExplanation, generateSummary } from '../services/geminiService';
import SEO from './SEO';
import { ThemeToggle, Theme } from './ThemeToggle';

type ViewMode = 'tree' | 'graph';
type ExplanationTab = 'details' | 'summary';

export const JsonExplainerPage: React.FC = () => {
  const [jsonData, setJsonData] = useState<object | null>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [explanations, setExplanations] = useState<Map<string, Explanation>>(new Map());
  const [summary, setSummary] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<Selection | null>(null);
  const [isExplanationLoading, setIsExplanationLoading] = useState(false);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [fileName, setFileName] = useState('Pasted JSON');
  const [activeView, setActiveView] = useState<ViewMode>('tree');
  const [activeExplanationTab, setActiveExplanationTab] = useState<ExplanationTab>('details');
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [theme, setTheme] = useState<Theme>('light');

  const handleJsonUpload = useCallback((data: object, name: string) => {
    setJsonData(data);
    setFileName(name);
    setGraphData(convertJsonToGraphData(data, new Set()));
    setExplanations(new Map());
    setSummary(null);
    setSelectedNode(null);
    setCollapsedNodes(new Set());
  }, []);

  const handleJsonError = useCallback((error: string) => {
    console.error('JSON Error:', error);
  }, []);

  const handleNodeSelect = useCallback(async (selection: Selection) => {
    setSelectedNode(selection);
    setActiveExplanationTab('details');

    if (explanations.has(selection.path)) {
      return;
    }

    setIsExplanationLoading(true);
    try {
      const explanation = await generateSingleExplanation(selection.path, selection.value);
      setExplanations(prev => new Map(prev).set(selection.path, { value: JSON.stringify(selection.value), explanation }));
    } catch (error) {
      console.error('Failed to generate explanation:', error);
    } finally {
      setIsExplanationLoading(false);
    }
  }, [explanations]);

  const handleGenerateSummary = useCallback(async () => {
    if (!jsonData || isSummaryLoading) return;

    setIsSummaryLoading(true);
    setActiveExplanationTab('summary');
    try {
      const generatedSummary = await generateSummary(jsonData);
      setSummary(generatedSummary);
    } catch (error) {
      console.error('Failed to generate summary:', error);
    } finally {
      setIsSummaryLoading(false);
    }
  }, [jsonData, isSummaryLoading]);

  const handleExpandAllGraphNodes = useCallback(() => {
    setCollapsedNodes(new Set());
  }, []);

  const handleCollapseAllGraphNodes = useCallback(() => {
    if (!graphData) return;
    const allNodeIds = new Set<string>();
    const collectNodeIds = (node: any) => {
      if (node.id) allNodeIds.add(node.id);
      if (node.children) {
        node.children.forEach(collectNodeIds);
      }
    };
    collectNodeIds(graphData);
    setCollapsedNodes(allNodeIds);
  }, [graphData]);

  const handleGraphNodeToggle = useCallback((nodeId: string) => {
    setCollapsedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  return (
    <>
      <SEO
        title="JSON Explainer | AI JSON Tools"
        description="Understand complex JSON files instantly with AI-powered explanations. Upload or paste JSON to get detailed insights and summaries."
        keywords="json explainer, AI JSON Tools, json analysis, explain json, json viewer"
        canonical="https://yourdomain.com/json-explainer"
        ogImage="https://yourdomain.com/images/json-explainer.jpg"
        ogUrl="https://yourdomain.com/json-explainer"
      />
      <ThemeToggle theme={theme} setTheme={setTheme} />
      <ExplainerView
        jsonData={jsonData}
        graphData={graphData}
        explanations={explanations}
        summary={summary}
        selectedNode={selectedNode}
        isExplanationLoading={isExplanationLoading}
        isSummaryLoading={isSummaryLoading}
        fileName={fileName}
        activeView={activeView}
        setActiveView={setActiveView}
        activeExplanationTab={activeExplanationTab}
        setActiveExplanationTab={setActiveExplanationTab}
        onNodeSelect={handleNodeSelect}
        collapsedNodes={collapsedNodes}
        onExpandAllGraphNodes={handleExpandAllGraphNodes}
        onCollapseAllGraphNodes={handleCollapseAllGraphNodes}
        onGraphNodeToggle={handleGraphNodeToggle}
        theme={theme}
        onJsonUpload={handleJsonUpload}
        onJsonError={handleJsonError}
        onGenerateSummary={handleGenerateSummary}
      />
    </>
  );
};
