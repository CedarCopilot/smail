import React from 'react';
import { Node } from 'reactflow';
import { subscribeInputContext } from 'cedar-os';
import { Box } from 'lucide-react';
import { FeatureNodeData } from '@/components/react-flow/FeatureNode';

// [STEP 6]: To automatically make any part of your application state available to AI agents as context,
// We use the subscribeInputContext function. In this example, we subscribe to the selected nodes and specify how we want them to appear in the chat as "selected context".
// We also specify how we want to transform the selected nodes into a format that should be visible to the agent in its context.

export function useRoadmapContext(nodes: Node<FeatureNodeData>[]) {
  const [selectedNodes, setSelectedNodes] = React.useState<Node<FeatureNodeData>[]>([]);

  subscribeInputContext(
    selectedNodes,
    (nodes: Node<FeatureNodeData>[]) => ({
      selectedFeatures: nodes.map((node) => ({
        id: node.id,
        title: node.data.title,
        description: node.data.description,
        status: node.data.status,
        type: node.data.nodeType,
        upvotes: node.data.upvotes,
        commentCount: node.data.comments?.length || 0,
      })),
    }),
    {
      icon: React.createElement(Box, { size: 16 }),
      color: '#8B5CF6', // Purple color for selected nodes
    },
  );

  subscribeInputContext(nodes, (nodes: Node<FeatureNodeData>[]) => ({
    features: nodes.map((node) => ({
      id: node.id,
      title: node.data.title,
      description: node.data.description,
      status: node.data.status,
      type: node.data.nodeType,
      upvotes: node.data.upvotes,
      commentCount: node.data.comments?.length || 0,
    })),
  }));

  return {
    selectedNodes,
    setSelectedNodes,
  };
}
