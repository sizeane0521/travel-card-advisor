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
        <button onClick={() => { stopCamera(); onBack() }}
          className="text-sm flex items-center gap-1 transition-colors"
          style={{ color: '#c8901a' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          返回
        </button>
        <h1 className="text-lg font-semibold text-[#f2e8c9]">掃碼匯入</h1>
      </div>

      <div className="beast-card rounded-xl overflow-hidden mb-4"
        style={{ background: '#1a1208', border: '1px solid #3a2810' }}>
        {scanning ? (
          <div className="relative">
            <video ref={videoRef} className="w-full" playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 rounded"
                style={{ border: '2px solid #c8901a', boxShadow: '0 0 20px rgba(200,144,26,0.3)' }} />
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <svg className="mx-auto mb-3 opacity-40" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d4a017" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 7 23 1 17 1"/><line x1="16" y1="8" x2="23" y2="1"/>
              <polyline points="1 17 1 23 7 23"/><line x1="8" y1="16" x2="1" y2="23"/>
              <polyline points="23 17 23 23 17 23"/><line x1="16" y1="16" x2="23" y2="23"/>
              <polyline points="1 7 1 1 7 1"/><line x1="8" y1="8" x2="1" y2="1"/>
            </svg>
            <p className="text-sm text-[#7a5c2a] mb-4">點擊下方按鈕開啟相機掃描 QR Code</p>
            <button onClick={startCamera}
              className="px-6 py-2.5 rounded font-medium text-sm transition-all"
              style={{ background: 'linear-gradient(135deg, #c8901a, #d4a017)', color: '#0d0a06' }}>
              開啟相機
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl p-3 mb-4"
          style={{ background: '#1a0808', border: '1px solid #5a1010' }}>
          <p className="text-sm" style={{ color: '#c0392b' }}>{error}</p>
          <button onClick={startCamera}
            className="text-xs mt-1 underline" style={{ color: '#c0392b' }}>重試</button>
        </div>
      )}

      {scanning && (
        <button onClick={stopCamera}
          className="w-full rounded-lg py-2.5 text-sm border transition-colors"
          style={{ borderColor: '#3a2810', color: '#7a5c2a' }}>
          停止掃描
        </button>
      )}

      <p className="text-xs text-[#3a2810] mt-4 text-center">
        請確認在 Safari 瀏覽器（非無痕模式）中操作，以確保資料正確儲存。
      </p>
    </div>
  )
}
