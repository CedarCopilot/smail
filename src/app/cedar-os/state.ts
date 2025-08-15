import React, { useEffect } from 'react';
import { Node, Edge } from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import { useCedarState, useRegisterState } from 'cedar-os';
import { FeatureNodeData } from '@/components/react-flow/FeatureNode';

// [STEP 4]: There are a few ways to make your application states visible to your agent.
// This allows your agent to understand and manipulate roadmap features using the state functions
export function useRoadmapState(
  nodes: Node<FeatureNodeData>[],
  setNodes: React.Dispatch<React.SetStateAction<Node<FeatureNodeData>[]>>,
  edges: Edge[],
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>,
) {
  // Using the useCedarState hook, we wrap and manage the entire state.
  const [currentDate] = useCedarState(
    'currentDate',
    Date.now().toString(),
    'The current date and time',
  );

  useEffect(() => {
    console.log('The current date and time is ' + currentDate);
  }, [currentDate]);

  // We can also register state using the useRegisterState hook, and attach custom setters to it.
  useRegisterState({
    value: nodes,
    setValue: setNodes,
    key: 'nodes',
    description: 'Product roadmap features and bugs that can be managed through conversation',
    customSetters: {
      addNode: {
        name: 'addNode',
        description: 'Add a new feature or bug to the product roadmap',
        parameters: [
          {
            name: 'node',
            type: 'Node<FeatureNodeData>',
            description: 'The feature/bug to add with title, description, type, and status',
          },
        ],
        execute: (currentNodes, node) => {
          const nodes = currentNodes as Node<FeatureNodeData>[];
          const nodeData = node as Node<FeatureNodeData>;

          const newNode: Node<FeatureNodeData> = {
            ...nodeData,
            type: 'featureNode',
            position: {
              x: Math.random() * 400 + 100,
              y: Math.random() * 300 + 100,
            },
            id: nodeData.id || uuidv4(),
            data: {
              ...nodeData.data,
              nodeType: nodeData.data.nodeType || 'feature',
              status: nodeData.data.status || 'planned',
              upvotes: nodeData.data.upvotes || 0,
              comments: nodeData.data.comments || [],
            },
          };

          setNodes([...nodes, newNode]);
        },
      },

      removeNode: {
        name: 'removeNode',
        description: 'Remove a feature or bug from the product roadmap',
        parameters: [
          {
            name: 'id',
            type: 'string',
            description: 'The unique ID of the node to remove',
          },
        ],
        execute: (currentNodes, id) => {
          const nodeId = id as string;
          const nodes = currentNodes as Node<FeatureNodeData>[];

          // Remove the node
          setNodes(nodes.filter((node) => node.id !== nodeId));

          // Clean up any connected edges
          setEdges((edges) =>
            edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
          );
        },
      },

      changeNode: {
        name: 'changeNode',
        description: 'Update an existing feature or bug in the roadmap',
        parameters: [
          {
            name: 'newNode',
            type: 'Node<FeatureNodeData>',
            description: 'The updated feature data including any changed fields',
          },
        ],
        execute: (currentNodes, newNode) => {
          const nodes = currentNodes as Node<FeatureNodeData>[];
          const updatedNode = newNode as Node<FeatureNodeData>;

          setNodes(
            nodes.map((node) =>
              node.id === updatedNode.id
                ? { ...node, data: { ...node.data, ...updatedNode.data } }
                : node,
            ),
          );
        },
      },
    },
  });

  useRegisterState({
    key: 'edges',
    value: edges,
    setValue: setEdges,
    description:
      'Connections between roadmap features showing dependencies, relationships, and workflow order',
  });
}
