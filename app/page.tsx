import { MenuPanel } from '@/components/menu-panel'
import { DiscussionPanel } from '@/components/discussion-panel'
import { ContentFrame } from '@/components/ContentFrame'

export default function Home() {
  return (
    <main className="flex h-screen w-screen overflow-hidden">
      {/* Menu/Settings Panel - 15% width */}
      <div className="w-[15%] h-full border-r border-gray-200">
        <MenuPanel />
      </div>

      {/* Discussion Panel - 35% width */}
      <div className="w-[35%] h-full border-r border-gray-200">
        <DiscussionPanel />
      </div>

      {/* Content Frame - 50% width */}
      <div className="w-[50%] h-full">
        <ContentFrame />
      </div>
    </main>
  )
} 