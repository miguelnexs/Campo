import { useState } from 'react'
import { Minus, Square, X, Copy } from 'lucide-react'
import { isElectron, safeIpc } from '../utils/platform'

export function TitleBar(): JSX.Element {
  const [isMaximized, setIsMaximized] = useState(false)

  const handleMaximize = () => {
    safeIpc.send('window-maximize', null)
    setIsMaximized((v) => !v)
  }

  return (
    <header className="h-9 bg-background/95 border-b border-border/60 flex items-center justify-end px-2 select-none drag z-40 shrink-0">
      {isElectron() && (
        <div className="flex items-center gap-0.5 no-drag">
          <button
            type="button"
            onClick={() => safeIpc.send('window-minimize', null)}
            className="h-7 w-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="Minimizar"
            title="Minimizar"
          >
            <Minus className="w-3.5 h-3.5 text-foreground" />
          </button>
          <button
            type="button"
            onClick={handleMaximize}
            className="h-7 w-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
            aria-label={isMaximized ? 'Reducir' : 'Expandir'}
            title={isMaximized ? 'Reducir' : 'Expandir'}
          >
            {isMaximized ? (
              <Copy className="w-3 h-3 text-foreground rotate-180" />
            ) : (
              <Square className="w-3 h-3 text-foreground" />
            )}
          </button>
          <button
            type="button"
            onClick={() => safeIpc.send('window-close', null)}
            className="h-7 w-8 rounded-lg flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"
            aria-label="Cerrar"
            title="Cerrar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </header>
  )
}
