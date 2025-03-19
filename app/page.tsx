import { MenuPanel } from '@/components/menu-panel'
import { DiscussionPanel } from '@/components/discussion-panel'
import { ContentFrame } from '@/components/ContentFrame'

export default function Home() {
  return (
    <main className="flex h-screen w-screen overflow-hidden">
      {/* Menu/Settings Panel - 20% width */}
      <div className="w-1/5 h-full border-r border-gray-200">
        <MenuPanel />
      </div>

      {/* Main Content Area - 80% width */}
      <div className="w-4/5 h-full flex flex-col">
        {/* Content Frame - 70% height */}
        <div className="h-[70%] border-b border-gray-200">
          <ContentFrame />
        </div>
        
        {/* Discussion Panel - 30% height */}
        <div className="h-[30%]">
          <DiscussionPanel />
        </div>
      </div>
    </main>
  )
} 