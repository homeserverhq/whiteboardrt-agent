import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState
} from 'react'
import {
  CaptureUpdateAction,
  exportToBlob,
  loadFromBlob,
  serializeAsJSON
} from '@excalidraw/excalidraw'
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'

import { PRODUCT_NAME } from '../brand'
import { downloadBlob } from '../utils/download'

export type LoadSceneDialogHandle = {
  openFilePicker: () => void
}

type LoadSceneDialogProps = {
  open: boolean
  onClose: () => void
  excalidrawAPI: ExcalidrawImperativeAPI | null
  onSceneLoaded: () => void
}

const describeError = (error: unknown): string =>
  error instanceof Error ? error.message : 'Could not load this file.'

export const LoadSceneDialog = forwardRef<
  LoadSceneDialogHandle,
  LoadSceneDialogProps
>(function LoadSceneDialog(
  { open, onClose, excalidrawAPI, onSceneLoaded },
  ref
) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const openFilePicker = (): void => {
    setError(null)
    setStatus(null)
    inputRef.current?.click()
  }

  useImperativeHandle(
    ref,
    () => ({
      openFilePicker: () => {
        setError(null)
        setStatus(null)
        inputRef.current?.click()
      }
    }),
    []
  )

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file || !excalidrawAPI) return

    setBusy(true)
    setError(null)
    setStatus(null)

    try {
      const restored = await loadFromBlob(
        file,
        excalidrawAPI.getAppState(),
        excalidrawAPI.getSceneElements()
      )

      const files = Object.values(restored.files)
      if (files.length > 0) {
        excalidrawAPI.addFiles(files)
      }

      excalidrawAPI.updateScene({
        elements: restored.elements,
        appState: restored.appState,
        captureUpdate: CaptureUpdateAction.IMMEDIATELY
      })

      onSceneLoaded()
      onClose()
    } catch (loadError) {
      setError(describeError(loadError))
    } finally {
      setBusy(false)
    }
  }

  const handleExportImage = async (): Promise<void> => {
    if (!excalidrawAPI) return

    setBusy(true)
    setError(null)
    setStatus(null)

    try {
      const appState = excalidrawAPI.getAppState()
      const blob = await exportToBlob({
        elements: excalidrawAPI.getSceneElements(),
        appState: {
          ...appState,
          exportBackground: true,
          exportEmbedScene: true
        },
        files: excalidrawAPI.getFiles(),
        mimeType: 'image/png',
        exportPadding: 10
      })

      downloadBlob(blob, 'whiteboardrt-agent-backup.png')
      setStatus('Image backup downloaded.')
    } catch (exportError) {
      setError(describeError(exportError))
    } finally {
      setBusy(false)
    }
  }

  const handleSaveToDisk = (): void => {
    if (!excalidrawAPI) return

    setError(null)
    setStatus(null)

    try {
      const json = serializeAsJSON(
        excalidrawAPI.getSceneElements(),
        excalidrawAPI.getAppState(),
        excalidrawAPI.getFiles(),
        'local'
      )
      const parsed = JSON.parse(json)
      parsed.source = PRODUCT_NAME
      const blob = new Blob([JSON.stringify(parsed, null, 2)], {
        type: 'application/json'
      })
      downloadBlob(blob, 'whiteboardrt-agent-backup.excalidraw')
      setStatus('Scene backup downloaded.')
    } catch (saveError) {
      setError(describeError(saveError))
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".excalidraw,.json,application/json"
        hidden
        onChange={(event) => void handleFileChange(event)}
      />

      {open && (
        <div
          className="whiteboardrt-agent-load-dialog-backdrop"
          onClick={onClose}
        >
          <div
            className="whiteboardrt-agent-load-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="whiteboardrt-agent-load-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="whiteboardrt-agent-load-dialog-title">Load from file</h2>
            <p className="whiteboardrt-agent-load-dialog-description">
              Loading from a file will <strong>replace your existing content</strong>.
              <br />
              You can back up your drawing first using one of the options below.
            </p>

            <button
              type="button"
              className="whiteboardrt-agent-load-dialog-primary"
              onClick={openFilePicker}
              disabled={busy || !excalidrawAPI}
            >
              Load from file
            </button>

            <div className="whiteboardrt-agent-load-dialog-actions">
              <div className="whiteboardrt-agent-load-dialog-action">
                <h3>Export as image</h3>
                <p>
                  Export the scene data as an image from which you can import
                  later.
                </p>
                <button
                  type="button"
                  onClick={() => void handleExportImage()}
                  disabled={busy || !excalidrawAPI}
                >
                  Export as image
                </button>
              </div>

              <div className="whiteboardrt-agent-load-dialog-action">
                <h3>Save to disk</h3>
                <p>
                  Export the scene data to a file from which you can import
                  later.
                </p>
                <button
                  type="button"
                  onClick={handleSaveToDisk}
                  disabled={busy || !excalidrawAPI}
                >
                  Save to disk
                </button>
              </div>
            </div>

            {status && (
              <p className="whiteboardrt-agent-load-dialog-status">{status}</p>
            )}
            {error && (
              <p
                className="whiteboardrt-agent-load-dialog-error"
                role="alert"
              >
                {error}
              </p>
            )}

            <button
              type="button"
              className="whiteboardrt-agent-load-dialog-cancel"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )
})
