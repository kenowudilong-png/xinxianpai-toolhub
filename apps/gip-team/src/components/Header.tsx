import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { useTooltip } from '../hooks/useTooltip'
import ViewportTooltip from './ViewportTooltip'
import HelpModal from './HelpModal'
import HistoryModal from './HistoryModal'
import { HelpCircleIcon, HistoryIcon } from './icons'

export default function Header() {
  const setAppMode = useStore((s) => s.setAppMode)
  const [showHelp, setShowHelp] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const helpTooltip = useTooltip()

  useEffect(() => {
    setAppMode('gallery')
    setIsAdmin(document.querySelector('[data-team-role="admin"]') !== null)
  }, [setAppMode])

  return (
    <>
      <header data-no-drag-select className="safe-area-top fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur border-b border-gray-200 dark:border-white/[0.08] transition-transform duration-300 ease-in-out">
        <div className="safe-area-x safe-header-inner max-w-7xl mx-auto flex items-center justify-between relative">
          <div className="flex-1 min-w-0 pr-2 flex items-center gap-2">
            <h1 className="inline-flex items-start relative mr-2">
              <span className="inline-flex items-center gap-2 text-[17px] sm:text-lg font-bold tracking-tight text-brand-dark dark:text-brand-soft">
                <img src="/freshpi-logo.png" alt="芯鲜派" className="h-8 w-auto max-w-[150px] object-contain" />
              </span>
            </h1>
          </div>
          {isAdmin && (
            <a
              href="/admin"
              className="hidden sm:inline-flex rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-white/[0.04] dark:hover:text-gray-200"
            >
              管理
            </a>
          )}
          <div className="relative">
            <button
              onClick={() => setShowHistoryModal(true)}
              className="p-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/[0.04] rounded-xl transition-colors"
              title="历史记录"
            >
              <HistoryIcon className="w-5 h-5" />
            </button>
            {showHistoryModal && <HistoryModal onClose={() => setShowHistoryModal(false)} />}
          </div>
          <div className="relative" {...helpTooltip.handlers}>
            <button
              onClick={() => setShowHelp(true)}
              className="p-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/[0.04] rounded-xl transition-colors"
              aria-label="打开帮助"
            >
              <HelpCircleIcon className="w-5 h-5" />
            </button>
            <ViewportTooltip visible={helpTooltip.visible}>帮助</ViewportTooltip>
          </div>
        </div>
      </header>

      <div className="safe-area-top invisible pointer-events-none transition-all duration-300 ease-in-out" aria-hidden="true">
        <div className="safe-header-inner" />
        <div className="safe-area-x sm:hidden overflow-hidden transition-all duration-300 ease-in-out max-h-20 pb-2">
          <div className="p-1">
            <div className="py-1.5 text-sm">占位</div>
          </div>
        </div>
      </div>
      {showHelp && <HelpModal appMode="gallery" onClose={() => setShowHelp(false)} />}
    </>
  )
}
