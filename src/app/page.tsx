'use client';

import React from 'react';
import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';

import { RoadmapCanvas } from '@/components/roadmap/RoadmapCanvas';
import { ChatModeSelector } from '@/components/roadmap/ChatModeSelector';
import { FloatingCedarChat } from '@/components/cedar-os/chatComponents/FloatingCedarChat';
import { SidePanelCedarChat } from '@/components/cedar-os/chatComponents/SidePanelCedarChat';
import { CedarCaptionChat } from '@/components/cedar-os/chatComponents/CedarCaptionChat';

type ChatMode = 'floating' | 'sidepanel' | 'caption';

export default function ProductRoadmapPage() {
  // [STEP 2]: To enable a chat, we have to add one of the Cedar Chat components to the app.
  // Here we render all three with a selector for you to play around!
  // All the components are downloaded to your repo, so feel free to click in and tweak the styling
  // At this point (after you've set up your env variables), you should be able to chat with the app.
  const [chatMode, setChatMode] = React.useState<ChatMode>('caption');

  const renderContent = () => (
    <ReactFlowProvider>
      <div className="relative h-screen w-full">
        <RoadmapCanvas />

        <ChatModeSelector currentMode={chatMode} onModeChange={setChatMode} />

        {chatMode === 'caption' && <CedarCaptionChat />}

        {chatMode === 'floating' && (
          <FloatingCedarChat
            side="right"
            title="🚀 Product Roadmap Assistant"
            collapsedLabel="💬 Need help with your roadmap?"
          />
        )}
      </div>
    </ReactFlowProvider>
  );

  if (chatMode === 'sidepanel') {
    return (
      <SidePanelCedarChat
        side="right"
        title="🚀 Product Roadmap Assistant"
        collapsedLabel="💬 Need help with your roadmap?"
        showCollapsedButton={true}
      >
        {renderContent()}
      </SidePanelCedarChat>
    );
  }

  return renderContent();
}
