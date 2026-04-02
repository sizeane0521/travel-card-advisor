import { useRef, useState } from 'react'
import jsQR from 'jsqr'
import type { Card } from '../types'

interface Props {
  onImport: (cards: Card[]) => void
  onBack: () => void
}

export default function QRImportPanel({ onImport, onBack }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)

  async function startCamera() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setScanning(true)
        scanFrame()
      }
    } catch {
      setError('無法存取相機。請確認已授予相機權限。')
    }
  }

  function stopCamera() {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setScanning(false)
  }

  function scanFrame() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(scanFrame)
      return
    }
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, canvas.width, canvas.height)
    if (code) {
      stopCamera()
      parseQRCode(code.data)
      return
    }
    rafRef.current = requestAnimationFrame(scanFrame)
  }

  function parseQRCode(data: string) {
    try {
      const json = decodeURIComponent(escape(atob(data)))
      const cards = JSON.parse(json) as Card[]
      if (!Array.isArray(cards)) throw new Error('invalid')
      onImport(cards)
    } catch {
      setError('QR Code 格式不正確，請重新掃描。')
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => { stopCamera(); onBack() }} className="text-blue-500 text-sm">← 返回</button>
        <h1 className="text-lg font-semibold text-gray-900">掃碼匯入</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
        {scanning ? (
          <div className="relative">
            <video ref={videoRef} className="w-full" playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-2 border-blue-400 rounded-lg w-48 h-48 opacity-70" />
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-4xl mb-3">📷</p>
            <p className="text-sm text-gray-500 mb-4">點擊下方按鈕開啟相機掃描 QR Code</p>
            <button
              onClick={startCamera}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm"
            >
              開啟相機
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
          <p className="text-red-600 text-sm">{error}</p>
          <button onClick={startCamera} className="text-red-600 text-xs mt-1 underline">重試</button>
        </div>
      )}

      {scanning && (
        <button
          onClick={stopCamera}
          className="w-full border border-gray-300 text-gray-600 rounded-lg py-2 text-sm"
        >
          停止掃描
        </button>
      )}

      <p className="text-xs text-gray-400 mt-4 text-center">
        ⚠️ 請確認在 Safari 瀏覽器（非無痕模式）中操作，以確保資料正確儲存。
      </p>
    </div>
  )
}
