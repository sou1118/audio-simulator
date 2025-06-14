"use client"

import type React from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
	Activity,
	BarChart3,
	Binary,
	Info,
	Play,
	RotateCcw,
	Square,
	Upload,
	Volume2,
	AudioWaveformIcon as Waveform,
	ZoomIn,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

interface AudioBufferData {
	buffer: AudioBuffer | null
	data: Float32Array | null
}

export default function AudioSimulator() {
	const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
	const [originalBuffer, setOriginalBuffer] = useState<AudioBufferData>({
		buffer: null,
		data: null,
	})
	const [processedBuffer, setProcessedBuffer] = useState<AudioBufferData>({
		buffer: null,
		data: null,
	})
	const [currentSound, setCurrentSound] =
		useState<AudioBufferSourceNode | null>(null)
	const [sampleRate, setSampleRate] = useState(44100)
	const [bitDepth, setBitDepth] = useState(16)
	const [xZoom, setXZoom] = useState(1)
	const [xOffset, setXOffset] = useState(0)
	const [yZoom, setYZoom] = useState(1)
	const [yOffset, setYOffset] = useState(0)
	const [isPlaying, setIsPlaying] = useState({
		original: false,
		processed: false,
	})
	const [volume, setVolume] = useState(0.5)
	const [gainNode, setGainNode] = useState<GainNode | null>(null)

	// 新しい状態：可視化モード
	const [showSamplingPoints, setShowSamplingPoints] = useState(false)
	const [showQuantizationLevels, setShowQuantizationLevels] = useState(false)
	const [showBinaryData, setShowBinaryData] = useState(false)
	const [selectedSampleIndex, setSelectedSampleIndex] = useState<number | null>(
		null,
	)

	const originalCanvasRef = useRef<HTMLCanvasElement>(null)
	const processedCanvasRef = useRef<HTMLCanvasElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)

	// AudioContext初期化
	const initAudioContext = useCallback(() => {
		if (!audioContext) {
			const ctx = new (
				window.AudioContext ||
				(window as unknown as { webkitAudioContext: typeof AudioContext })
					.webkitAudioContext
			)()
			setAudioContext(ctx)
			return ctx
		}
		return audioContext
	}, [audioContext])

	// プリセット音声生成
	const generatePresetAudio = useCallback(
		(type: "sine" | "voice" | "music") => {
			const ctx = initAudioContext()
			const sampleRate = 44100
			const duration = 2
			const length = sampleRate * duration
			const buffer = ctx.createBuffer(2, length, sampleRate)

			for (let channel = 0; channel < 2; channel++) {
				const data = buffer.getChannelData(channel)

				switch (type) {
					case "sine":
						for (let i = 0; i < length; i++) {
							data[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.3
						}
						break
					case "voice":
						for (let i = 0; i < length; i++) {
							data[i] =
								(Math.sin((2 * Math.PI * 200 * i) / sampleRate) * 0.2 +
									Math.sin((2 * Math.PI * 400 * i) / sampleRate) * 0.15 +
									Math.sin((2 * Math.PI * 800 * i) / sampleRate) * 0.1 +
									Math.random() * 0.02) *
								Math.sin((Math.PI * i) / length)
						}
						break
					case "music": {
						const notes = [261.63, 329.63, 392.0]
						for (let i = 0; i < length; i++) {
							let sample = 0
							for (const freq of notes) {
								sample += Math.sin((2 * Math.PI * freq * i) / sampleRate) * 0.15
							}
							data[i] = sample * Math.sin((Math.PI * i) / length)
						}
						break
					}
				}
			}

			return { buffer, data: buffer.getChannelData(0) }
		},
		[initAudioContext],
	)

	// 音声処理
	const processAudio = useCallback(() => {
		if (!originalBuffer.buffer || !audioContext) return

		const ctx = audioContext
		const targetSampleRate = sampleRate
		const originalSampleRate = originalBuffer.buffer.sampleRate
		const downsampleRatio = originalSampleRate / targetSampleRate

		const processedAudioBuffer = ctx.createBuffer(
			originalBuffer.buffer.numberOfChannels,
			originalBuffer.buffer.length,
			originalBuffer.buffer.sampleRate,
		)

		const quantizationLevels = 2 ** bitDepth

		for (
			let channel = 0;
			channel < originalBuffer.buffer.numberOfChannels;
			channel++
		) {
			const originalData = originalBuffer.buffer.getChannelData(channel)
			const processedData = processedAudioBuffer.getChannelData(channel)

			for (let i = 0; i < processedData.length; i++) {
				const downsampledIndex =
					Math.floor(i / downsampleRatio) * downsampleRatio
				let sample = originalData[Math.floor(downsampledIndex)]

				sample =
					Math.round(sample * (quantizationLevels / 2)) /
					(quantizationLevels / 2)
				processedData[i] = sample
			}
		}

		setProcessedBuffer({
			buffer: processedAudioBuffer,
			data: processedAudioBuffer.getChannelData(0),
		})
	}, [originalBuffer.buffer, sampleRate, bitDepth, audioContext])

	// 波形描画（改良版）
	const drawWaveform = useCallback(
		(
			canvas: HTMLCanvasElement,
			data: Float32Array | null,
			color: string,
			buffer: AudioBuffer | null,
			isProcessed = false,
		) => {
			if (!data || !canvas || !buffer) return

			const ctx = canvas.getContext("2d")
			if (!ctx) return
			const width = canvas.width
			const height = canvas.height

			ctx.clearRect(0, 0, width, height)

			const totalSamples = data.length
			const samplesPerWindow = Math.max(1, totalSamples / Math.max(0.1, xZoom))
			const startSample = Math.max(
				0,
				Math.floor((xOffset / 100) * (totalSamples - samplesPerWindow)),
			)
			const endSample = Math.min(totalSamples, startSample + samplesPerWindow)

			// サンプル範囲の検証
			if (
				startSample >= endSample ||
				startSample < 0 ||
				endSample > totalSamples
			) {
				console.warn("Invalid sample range:", {
					startSample,
					endSample,
					totalSamples,
				})
				return
			}

			const amp = height / 2
			const safeYZoom = Math.max(0.1, Math.min(10, yZoom))
			const safeYOffset = Math.max(-100, Math.min(100, yOffset))
			const centerY = amp + (safeYOffset * amp) / 100

			// 量子化レベルの表示
			if (showQuantizationLevels && isProcessed) {
				const quantLevels = 2 ** bitDepth
				ctx.strokeStyle = "#e5e7eb"
				ctx.lineWidth = 0.5
				ctx.setLineDash([2, 2])

				for (let i = 0; i <= quantLevels; i++) {
					const level = (i / quantLevels) * 2 - 1
					const y = centerY - level * amp * safeYZoom
					if (y >= 0 && y <= height) {
						ctx.beginPath()
						ctx.moveTo(0, y)
						ctx.lineTo(width, y)
						ctx.stroke()
					}
				}
				ctx.setLineDash([])
			}

			// 背景グリッド
			ctx.strokeStyle = "#e5e7eb"
			ctx.lineWidth = 1
			ctx.beginPath()
			ctx.moveTo(0, centerY)
			ctx.lineTo(width, centerY)
			ctx.stroke()

			// 波形描画
			ctx.strokeStyle = color
			ctx.lineWidth = 2

			const samplesPerPixel = (endSample - startSample) / width

			if (samplesPerPixel < 1) {
				// 拡大時：線形補間を使用
				ctx.beginPath()
				let firstPoint = true

				for (let i = 0; i < width; i++) {
					const samplePosition =
						startSample + (i / width) * (endSample - startSample)
					const sampleIndexFloor = Math.floor(samplePosition)
					const sampleIndexCeil = Math.ceil(samplePosition)
					const fraction = samplePosition - sampleIndexFloor

					let sample = 0
					if (sampleIndexFloor >= 0 && sampleIndexFloor < data.length) {
						if (sampleIndexCeil < data.length) {
							// 線形補間
							sample =
								data[sampleIndexFloor] * (1 - fraction) +
								data[sampleIndexCeil] * fraction
						} else {
							sample = data[sampleIndexFloor]
						}

						const y = centerY - sample * amp * safeYZoom
						const clampedY = Math.max(0, Math.min(height, y))

						if (firstPoint) {
							ctx.moveTo(i, clampedY)
							firstPoint = false
						} else {
							ctx.lineTo(i, clampedY)
						}
					}
				}

				if (!firstPoint) {
					ctx.stroke()
				}

				// サンプリングポイントの表示
				if (showSamplingPoints && isProcessed && originalBuffer.buffer) {
					const downsampleRatio = originalBuffer.buffer.sampleRate / sampleRate
					ctx.fillStyle = color
					ctx.strokeStyle = "#fff"
					ctx.lineWidth = 2

					// サンプリングポイントを適切な間隔で表示
					const firstSamplePoint =
						Math.ceil(startSample / downsampleRatio) * downsampleRatio

					for (
						let samplePoint = firstSamplePoint;
						samplePoint < endSample;
						samplePoint += downsampleRatio
					) {
						const sampleIndex = Math.floor(samplePoint)
						if (sampleIndex >= 0 && sampleIndex < data.length) {
							const x =
								((sampleIndex - startSample) / (endSample - startSample)) *
								width
							if (x >= 0 && x <= width) {
								const y = centerY - data[sampleIndex] * amp * safeYZoom
								const clampedY = Math.max(0, Math.min(height, y))

								ctx.beginPath()
								ctx.arc(x, clampedY, 4, 0, Math.PI * 2)
								ctx.fill()
								ctx.stroke()

								// 選択されたサンプルの情報表示
								if (selectedSampleIndex === sampleIndex) {
									ctx.fillStyle = "#000"
									ctx.font = "12px monospace"
									const value = data[sampleIndex]
									const quantized =
										Math.round(value * (2 ** bitDepth / 2)) /
										(2 ** bitDepth / 2)
									ctx.fillText(`値: ${value.toFixed(4)}`, x + 10, clampedY - 10)
									ctx.fillText(
										`量子化: ${quantized.toFixed(4)}`,
										x + 10,
										clampedY + 5,
									)
									ctx.fillStyle = color
								}
							}
						}
					}
				}
			} else {
				// 縮小時
				ctx.beginPath()
				let firstPoint = true

				for (let i = 0; i < width; i++) {
					let min = 1.0
					let max = -1.0
					let hasData = false

					const startIdx = Math.floor(startSample + i * samplesPerPixel)
					const endIdx = Math.min(
						data.length,
						Math.floor(startSample + (i + 1) * samplesPerPixel),
					)

					for (let j = startIdx; j < endIdx; j++) {
						if (j >= 0 && j < data.length) {
							const datum = data[j]
							if (!Number.isNaN(datum) && Number.isFinite(datum)) {
								hasData = true
								if (datum < min) min = datum
								if (datum > max) max = datum
							}
						}
					}

					if (hasData) {
						const minY = Math.max(
							0,
							Math.min(height, centerY - max * amp * safeYZoom),
						)
						const maxY = Math.max(
							0,
							Math.min(height, centerY - min * amp * safeYZoom),
						)

						if (firstPoint) {
							ctx.moveTo(i, minY)
							firstPoint = false
						} else {
							if (Math.abs(maxY - minY) > 1) {
								ctx.lineTo(i, minY)
								ctx.lineTo(i, maxY)
							} else {
								const avgY = (minY + maxY) / 2
								ctx.lineTo(i, avgY)
							}
						}
					}
				}

				if (!firstPoint) {
					ctx.stroke()
				}
			}

			// 情報表示
			if (xZoom > 5 || safeYZoom > 2) {
				ctx.fillStyle = "#666"
				ctx.font = "12px sans-serif"
				const timeStart = startSample / buffer.sampleRate
				const timeEnd = endSample / buffer.sampleRate
				ctx.fillText(
					`Time: ${timeStart.toFixed(3)}s - ${timeEnd.toFixed(3)}s`,
					10,
					15,
				)
				ctx.fillText(
					`Y-Zoom: ${safeYZoom.toFixed(1)}x, Y-Offset: ${safeYOffset.toFixed(1)}%`,
					10,
					30,
				)
			}
		},
		[
			xZoom,
			xOffset,
			yZoom,
			yOffset,
			showSamplingPoints,
			showQuantizationLevels,
			selectedSampleIndex,
			originalBuffer.buffer,
			sampleRate,
			bitDepth,
		],
	)

	// バイナリデータの取得
	const getBinaryRepresentation = useCallback(
		(value: number, bits: number): string => {
			const quantLevels = 2 ** bits
			const quantized = Math.round((value + 1) * (quantLevels / 2))
			const clamped = Math.max(0, Math.min(quantLevels - 1, quantized))
			return clamped.toString(2).padStart(bits, "0")
		},
		[],
	)

	// 音声再生
	const playAudioBuffer = useCallback(
		(buffer: AudioBuffer | null, type: "original" | "processed") => {
			if (!buffer || !audioContext) return

			if (currentSound) {
				try {
					currentSound.stop()
					currentSound.disconnect()
				} catch (error) {
					console.log("Error stopping audio:", error)
				}
			}

			setCurrentSound(null)
			setIsPlaying({ original: false, processed: false })

			try {
				const source = audioContext.createBufferSource()
				const gain = audioContext.createGain()

				source.buffer = buffer
				gain.gain.value = volume

				source.connect(gain)
				gain.connect(audioContext.destination)

				source.onended = () => {
					setIsPlaying({ original: false, processed: false })
					setCurrentSound(null)
					setGainNode(null)
				}

				setCurrentSound(source)
				setGainNode(gain)
				setIsPlaying({ original: false, processed: false, [type]: true })

				source.start()
			} catch (error) {
				console.error("Error playing audio:", error)
				setIsPlaying({ original: false, processed: false })
				setCurrentSound(null)
				setGainNode(null)
			}
		},
		[audioContext, currentSound, volume],
	)

	const stopAllAudio = useCallback(() => {
		if (currentSound) {
			try {
				currentSound.stop()
				currentSound.disconnect()
			} catch (error) {
				console.log("Error stopping audio:", error)
			}
		}
		setCurrentSound(null)
		setGainNode(null)
		setIsPlaying({ original: false, processed: false })
	}, [currentSound])

	// ファイル読み込み
	const handleFileUpload = useCallback(
		async (event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0]
			if (!file) return

			const ctx = initAudioContext()
			const arrayBuffer = await file.arrayBuffer()
			const buffer = await ctx.decodeAudioData(arrayBuffer)

			setOriginalBuffer({ buffer, data: buffer.getChannelData(0) })
		},
		[initAudioContext],
	)

	// プリセット読み込み
	const loadPreset = useCallback(
		(type: "sine" | "voice" | "music") => {
			const audioData = generatePresetAudio(type)
			setOriginalBuffer(audioData)
			setXZoom(1)
			setXOffset(0)
			setYZoom(1)
			setYOffset(0)
		},
		[generatePresetAudio],
	)

	// キャンバスクリックハンドラ
	const handleCanvasClick = useCallback(
		(event: React.MouseEvent<HTMLCanvasElement>, isProcessed: boolean) => {
			if (!isProcessed || !showSamplingPoints || !processedBuffer.data) return

			const canvas = event.currentTarget
			const rect = canvas.getBoundingClientRect()
			const x = (event.clientX - rect.left) * (canvas.width / rect.width)

			const totalSamples = processedBuffer.data.length
			const samplesPerWindow = Math.max(1, totalSamples / Math.max(0.1, xZoom))
			const startSample = Math.max(
				0,
				Math.floor((xOffset / 100) * (totalSamples - samplesPerWindow)),
			)
			const endSample = Math.min(totalSamples, startSample + samplesPerWindow)

			const clickedSample = Math.floor(
				startSample + (x / canvas.width) * (endSample - startSample),
			)

			if (!originalBuffer.buffer) return

			const downsampleRatio = originalBuffer.buffer.sampleRate / sampleRate

			// 最も近いサンプリングポイントを見つける
			const nearestSampleIndex =
				Math.round(clickedSample / downsampleRatio) * downsampleRatio
			const actualIndex = Math.floor(nearestSampleIndex)

			if (actualIndex >= 0 && actualIndex < processedBuffer.data.length) {
				setSelectedSampleIndex(actualIndex)
			} else {
				// 範囲外の場合はnullに設定
				setSelectedSampleIndex(null)
			}
		},
		[
			xZoom,
			xOffset,
			processedBuffer.data,
			showSamplingPoints,
			originalBuffer.buffer,
			sampleRate,
		],
	)

	// エフェクト
	useEffect(() => {
		if (originalBuffer.buffer) {
			processAudio()
		}
	}, [originalBuffer.buffer, processAudio])

	useEffect(() => {
		if (
			originalCanvasRef.current &&
			originalBuffer.data &&
			originalBuffer.buffer
		) {
			drawWaveform(
				originalCanvasRef.current,
				originalBuffer.data,
				"#3b82f6",
				originalBuffer.buffer,
				false,
			)
		}
		if (
			processedCanvasRef.current &&
			processedBuffer.data &&
			processedBuffer.buffer
		) {
			drawWaveform(
				processedCanvasRef.current,
				processedBuffer.data,
				"#ef4444",
				processedBuffer.buffer,
				true,
			)
		}
	}, [
		originalBuffer.data,
		originalBuffer.buffer,
		processedBuffer.data,
		processedBuffer.buffer,
		drawWaveform,
	])

	// リサイズ時の再描画用のuseEffect
	useEffect(() => {
		let resizeTimer: NodeJS.Timeout | null = null

		const handleResize = () => {
			// デバウンス処理
			if (resizeTimer) {
				clearTimeout(resizeTimer)
			}

			resizeTimer = setTimeout(() => {
				if (originalCanvasRef.current) {
					originalCanvasRef.current.width =
						originalCanvasRef.current.offsetWidth
					originalCanvasRef.current.height = 200

					// 波形を再描画
					if (originalBuffer.data && originalBuffer.buffer) {
						drawWaveform(
							originalCanvasRef.current,
							originalBuffer.data,
							"#3b82f6",
							originalBuffer.buffer,
							false,
						)
					}
				}

				if (processedCanvasRef.current) {
					processedCanvasRef.current.width =
						processedCanvasRef.current.offsetWidth
					processedCanvasRef.current.height = 200

					// 波形を再描画
					if (processedBuffer.data && processedBuffer.buffer) {
						drawWaveform(
							processedCanvasRef.current,
							processedBuffer.data,
							"#ef4444",
							processedBuffer.buffer,
							true,
						)
					}
				}
			}, 100)
		}

		window.addEventListener("resize", handleResize)

		return () => {
			if (resizeTimer) {
				clearTimeout(resizeTimer)
			}
			window.removeEventListener("resize", handleResize)
		}
	}, [
		originalBuffer.data,
		originalBuffer.buffer,
		processedBuffer.data,
		processedBuffer.buffer,
		drawWaveform,
	])

	useEffect(() => {
		return () => {
			if (currentSound) {
				try {
					currentSound.stop()
					currentSound.disconnect()
				} catch (error) {
					console.log("Cleanup error:", error)
				}
			}
		}
	}, [currentSound])

	useEffect(() => {
		if (gainNode) {
			gainNode.gain.value = volume
		}
	}, [volume, gainNode])

	const quantizationLevels = 2 ** bitDepth
	const bitRate = (sampleRate * bitDepth * 2) / 1000

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
			<div className="max-w-7xl mx-auto space-y-6">
				<div className="text-center space-y-2">
					<h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-3">
						<Waveform className="h-10 w-10 text-blue-600" />
						音のデジタル化シミュレーター
					</h1>
					<p className="text-gray-600">
						標本化・量子化・符号化のプロセスを視覚的に学習
					</p>
				</div>

				{/* デジタル化プロセスの説明 */}
				<Alert className="bg-blue-50 border-blue-200">
					<Info className="h-4 w-4" />
					<AlertDescription className="text-sm">
						<strong>音のデジタル化の3ステップ：</strong>
						<span className="ml-2">
							①標本化（サンプリング）：連続的な音を一定間隔で測定
						</span>
						<span className="ml-2">②量子化：測定値を限られた段階に丸める</span>
						<span className="ml-2">③符号化：デジタル値を2進数で表現</span>
					</AlertDescription>
				</Alert>

				{/* 音声選択 */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Upload className="h-5 w-5" />
							音声ファイルの選択
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex flex-wrap gap-2">
							<Button
								variant="outline"
								onClick={() => loadPreset("sine")}
								className="flex items-center gap-2"
							>
								<Volume2 className="h-4 w-4" />
								正弦波（440Hz）
							</Button>
							<Button
								variant="outline"
								onClick={() => loadPreset("voice")}
								className="flex items-center gap-2"
							>
								<Volume2 className="h-4 w-4" />
								音声サンプル
							</Button>
							<Button
								variant="outline"
								onClick={() => loadPreset("music")}
								className="flex items-center gap-2"
							>
								<Volume2 className="h-4 w-4" />
								音楽サンプル
							</Button>
						</div>
						<Separator />
						<div className="space-y-2">
							<Label htmlFor="file-upload">
								または、音声ファイルをアップロード:
							</Label>
							<Input
								id="file-upload"
								type="file"
								accept="audio/*"
								onChange={handleFileUpload}
								ref={fileInputRef}
							/>
						</div>
					</CardContent>
				</Card>

				{/* デジタル化パラメータ */}
				<Tabs defaultValue="parameters" className="w-full">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="parameters">
							<Activity className="h-4 w-4 mr-2" />
							パラメータ設定
						</TabsTrigger>
						<TabsTrigger value="visualization">
							<BarChart3 className="h-4 w-4 mr-2" />
							可視化設定
						</TabsTrigger>
						<TabsTrigger value="encoding">
							<Binary className="h-4 w-4 mr-2" />
							符号化表示
						</TabsTrigger>
					</TabsList>

					<TabsContent value="parameters">
						<Card>
							<CardHeader>
								<CardTitle>デジタル化パラメータ</CardTitle>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="grid md:grid-cols-2 gap-6">
									<div className="space-y-3">
										<Label className="text-sm font-medium">
											標本化周波数（サンプリングレート）:
											<Badge variant="secondary" className="ml-2">
												{sampleRate.toLocaleString()} Hz
											</Badge>
										</Label>
										<Slider
											value={[sampleRate]}
											onValueChange={(value) => setSampleRate(value[0])}
											min={1000}
											max={48000}
											step={100}
											className="w-full"
										/>
										<p className="text-xs text-gray-600">
											1秒間に{sampleRate.toLocaleString()}回の測定
										</p>
									</div>
									<div className="space-y-3">
										<Label className="text-sm font-medium">
											量子化ビット数:
											<Badge variant="secondary" className="ml-2">
												{bitDepth} bit
											</Badge>
										</Label>
										<Slider
											value={[bitDepth]}
											onValueChange={(value) => setBitDepth(value[0])}
											min={1}
											max={16}
											step={1}
											className="w-full"
										/>
										<p className="text-xs text-gray-600">
											{quantizationLevels.toLocaleString()}段階で表現
										</p>
									</div>
								</div>
								<Button
									variant="outline"
									onClick={() => {
										setSampleRate(44100)
										setBitDepth(16)
									}}
									className="flex items-center gap-2"
								>
									<RotateCcw className="h-4 w-4" />
									パラメータを初期値に戻す
								</Button>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="visualization">
						<Card>
							<CardHeader>
								<CardTitle>可視化設定</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<Label
											htmlFor="sampling-points"
											className="text-sm font-medium cursor-pointer"
										>
											サンプリングポイントを表示
										</Label>
										<Switch
											id="sampling-points"
											checked={showSamplingPoints}
											onCheckedChange={setShowSamplingPoints}
										/>
									</div>
									<div className="flex items-center justify-between">
										<Label
											htmlFor="quantization-levels"
											className="text-sm font-medium cursor-pointer"
										>
											量子化レベルを表示
										</Label>
										<Switch
											id="quantization-levels"
											checked={showQuantizationLevels}
											onCheckedChange={setShowQuantizationLevels}
										/>
									</div>
									<div className="flex items-center justify-between">
										<Label
											htmlFor="binary-data"
											className="text-sm font-medium cursor-pointer"
										>
											バイナリデータを表示
										</Label>
										<Switch
											id="binary-data"
											checked={showBinaryData}
											onCheckedChange={setShowBinaryData}
										/>
									</div>
								</div>
								{showSamplingPoints && (
									<Alert>
										<Info className="h-4 w-4" />
										<AlertDescription className="text-xs">
											処理後の波形上の白い点をクリックすると、そのサンプルの詳細情報が表示されます。
										</AlertDescription>
									</Alert>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="encoding">
						<Card>
							<CardHeader>
								<CardTitle>符号化の例</CardTitle>
							</CardHeader>
							<CardContent>
								{processedBuffer.data && showBinaryData ? (
									<div className="space-y-4">
										<p className="text-sm text-gray-600">
											現在表示されている範囲の最初の10サンプル：
										</p>
										<div className="overflow-x-auto">
											<table className="min-w-full text-xs font-mono">
												<thead>
													<tr className="border-b">
														<th className="text-left p-2">サンプル#</th>
														<th className="text-left p-2">アナログ値</th>
														<th className="text-left p-2">量子化値</th>
														<th className="text-left p-2">2進数表現</th>
													</tr>
												</thead>
												<tbody>
													{Array.from({
														length: Math.min(10, processedBuffer.data.length),
													}).map((_, i) => {
														const value = processedBuffer.data?.[i]
														if (value === undefined) return null
														const quantized =
															Math.round(value * (quantizationLevels / 2)) /
															(quantizationLevels / 2)
														const binary = getBinaryRepresentation(
															value,
															bitDepth,
														)
														return (
															<tr
																key={`sample-${i}-${value.toFixed(4)}`}
																className="border-b hover:bg-gray-50"
															>
																<td className="p-2">{i}</td>
																<td className="p-2">{value.toFixed(4)}</td>
																<td className="p-2">{quantized.toFixed(4)}</td>
																<td className="p-2">{binary}</td>
															</tr>
														)
													})}
												</tbody>
											</table>
										</div>
										<Alert>
											<Info className="h-4 w-4" />
											<AlertDescription className="text-xs">
												各サンプルは{bitDepth}ビットの2進数で表現されます。
												これが音声データの基本的な符号化形式です。
											</AlertDescription>
										</Alert>
									</div>
								) : (
									<p className="text-sm text-gray-500">
										バイナリデータ表示を有効にしてください。
									</p>
								)}
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>

				{/* 情報表示 */}
				<Card className="bg-blue-50 border-blue-200">
					<CardContent className="pt-6">
						<div className="grid md:grid-cols-4 gap-4 text-sm">
							<div className="space-y-1">
								<p className="font-medium text-blue-900">📊 標本化周波数</p>
								<p className="text-blue-700">
									{sampleRate.toLocaleString()} Hz
								</p>
								<p className="text-xs text-blue-600">
									1秒間に {sampleRate.toLocaleString()} 回サンプリング
								</p>
							</div>
							<div className="space-y-1">
								<p className="font-medium text-blue-900">📏 量子化レベル</p>
								<p className="text-blue-700">{bitDepth} bit</p>
								<p className="text-xs text-blue-600">
									{quantizationLevels.toLocaleString()} 段階
								</p>
							</div>
							<div className="space-y-1">
								<p className="font-medium text-blue-900">💾 データレート</p>
								<p className="text-blue-700">{bitRate.toFixed(1)} kbps</p>
								<p className="text-xs text-blue-600">ステレオ</p>
							</div>
							<div className="space-y-1">
								<p className="font-medium text-blue-900">🔢 符号化</p>
								<p className="text-blue-700">{bitDepth}ビット符号</p>
								<p className="text-xs text-blue-600">
									各サンプル{bitDepth}桁の2進数
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* 再生コントロール */}
				<Card>
					<CardContent className="pt-6">
						<div className="space-y-4">
							<div className="flex items-center justify-center gap-4 px-4">
								<Volume2 className="h-5 w-5 text-gray-600" />
								<div className="flex-1 max-w-xs">
									<Slider
										value={[volume * 100]}
										onValueChange={(value) => setVolume(value[0] / 100)}
										min={0}
										max={100}
										step={1}
										className="w-full"
									/>
								</div>
								<Badge variant="outline" className="min-w-[60px] text-center">
									{Math.round(volume * 100)}%
								</Badge>
							</div>

							<Separator />

							<div className="flex flex-wrap justify-center gap-3">
								<Button
									onClick={() =>
										playAudioBuffer(originalBuffer.buffer, "original")
									}
									disabled={!originalBuffer.buffer}
									className="flex items-center gap-2"
									variant={isPlaying.original ? "default" : "outline"}
								>
									<Play className="h-4 w-4" />
									{isPlaying.original ? "再生中..." : "元の音を再生"}
								</Button>
								<Button
									onClick={() =>
										playAudioBuffer(processedBuffer.buffer, "processed")
									}
									disabled={!processedBuffer.buffer}
									variant={isPlaying.processed ? "secondary" : "outline"}
									className="flex items-center gap-2"
								>
									<Play className="h-4 w-4" />
									{isPlaying.processed ? "再生中..." : "処理後の音を再生"}
								</Button>
								<Button
									onClick={stopAllAudio}
									variant="destructive"
									className="flex items-center gap-2"
									disabled={!isPlaying.original && !isPlaying.processed}
								>
									<Square className="h-4 w-4" />
									停止
								</Button>
							</div>
							{(isPlaying.original || isPlaying.processed) && (
								<div className="text-center mt-3">
									<Badge variant="outline" className="animate-pulse">
										{isPlaying.original ? "元の音" : "処理後の音"}を再生中
									</Badge>
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				{/* 波形表示 */}
				<div className="grid lg:grid-cols-2 gap-6">
					<Card>
						<CardHeader>
							<CardTitle className="text-center text-blue-600">
								元の波形（アナログ）
							</CardTitle>
						</CardHeader>
						<CardContent>
							<canvas
								ref={originalCanvasRef}
								className="w-full h-48 bg-white border border-gray-200 rounded-lg cursor-crosshair"
							/>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle className="text-center text-red-600">
								処理後の波形（デジタル）
							</CardTitle>
						</CardHeader>
						<CardContent>
							<canvas
								ref={processedCanvasRef}
								className="w-full h-48 bg-white border border-gray-200 rounded-lg cursor-pointer"
								onClick={(e) => handleCanvasClick(e, true)}
								onKeyDown={(e) => {
									console.log("Key Down Event:", e)
								}}
								tabIndex={0}
							/>
							{selectedSampleIndex !== null &&
								showSamplingPoints &&
								processedBuffer.data &&
								selectedSampleIndex >= 0 &&
								selectedSampleIndex < processedBuffer.data.length && (
									<div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono">
										<p>選択されたサンプル: #{selectedSampleIndex}</p>
										<p>
											時間: {(selectedSampleIndex / sampleRate).toFixed(4)}秒
										</p>
										<p>
											値: {processedBuffer.data[selectedSampleIndex].toFixed(4)}
										</p>
										<p>
											2進数:{" "}
											{getBinaryRepresentation(
												processedBuffer.data[selectedSampleIndex],
												bitDepth,
											)}
										</p>
									</div>
								)}
						</CardContent>
					</Card>
				</div>

				{/* 波形表示コントロール */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<ZoomIn className="h-5 w-5" />
							波形表示コントロール
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="grid gap-6">
							<div className="space-y-4">
								<h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
									📈 X軸（時間軸）コントロール
								</h4>
								<div className="grid md:grid-cols-2 gap-4">
									<div className="space-y-3">
										<Label className="text-sm font-medium">
											時間軸拡大率:
											<Badge variant="secondary" className="ml-2">
												{xZoom}x
											</Badge>
										</Label>
										<Slider
											value={[Math.max(1, Math.min(50, xZoom))]}
											onValueChange={(value) =>
												setXZoom(Math.max(1, Math.min(50, value[0])))
											}
											min={1}
											max={50}
											step={0.5}
											className="w-full"
										/>
									</div>
									<div className="space-y-3">
										<Label className="text-sm font-medium">
											時間軸表示位置:
											<Badge variant="secondary" className="ml-2">
												{Math.round(xOffset)}%
											</Badge>
										</Label>
										<Slider
											value={[
												Math.max(
													0,
													Math.min(
														Math.max(0, 100 - 100 / Math.max(1, xZoom)),
														xOffset,
													),
												),
											]}
											onValueChange={(value) =>
												setXOffset(
													Math.max(
														0,
														Math.min(
															Math.max(0, 100 - 100 / Math.max(1, xZoom)),
															value[0],
														),
													),
												)
											}
											min={0}
											max={Math.max(0, 100 - 100 / Math.max(1, xZoom))}
											step={1}
											className="w-full"
										/>
									</div>
								</div>
							</div>

							<Separator />

							<div className="space-y-4">
								<h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
									📊 Y軸（振幅軸）コントロール
								</h4>
								<div className="grid md:grid-cols-2 gap-4">
									<div className="space-y-3">
										<Label className="text-sm font-medium">
											振幅拡大率:
											<Badge variant="secondary" className="ml-2">
												{Math.max(0.1, Math.min(10, yZoom)).toFixed(1)}x
											</Badge>
										</Label>
										<Slider
											value={[Math.max(0.1, Math.min(10, yZoom))]}
											onValueChange={(value) =>
												setYZoom(Math.max(0.1, Math.min(10, value[0])))
											}
											min={0.1}
											max={10}
											step={0.1}
											className="w-full"
										/>
									</div>
									<div className="space-y-3">
										<Label className="text-sm font-medium">
											振幅オフセット:
											<Badge variant="secondary" className="ml-2">
												{Math.round(Math.max(-100, Math.min(100, yOffset)))}%
											</Badge>
										</Label>
										<Slider
											value={[Math.max(-100, Math.min(100, yOffset))]}
											onValueChange={(value) =>
												setYOffset(Math.max(-100, Math.min(100, value[0])))
											}
											min={-100}
											max={100}
											step={1}
											className="w-full"
										/>
									</div>
								</div>
							</div>
						</div>

						<div className="flex flex-wrap gap-2">
							<Button
								variant="outline"
								onClick={() => {
									setXZoom(1)
									setXOffset(0)
									setYZoom(1)
									setYOffset(0)
								}}
								className="flex items-center gap-2"
							>
								<RotateCcw className="h-4 w-4" />
								すべてリセット
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									setXZoom(10)
									setXOffset(25)
								}}
							>
								サンプリング観察用拡大
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* 学習のヒント */}
				<Card className="bg-yellow-50 border-yellow-200">
					<CardHeader>
						<CardTitle className="text-yellow-900">💡 学習のヒント</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 text-sm text-yellow-800">
						<p>
							•
							サンプリングレートを下げると、音の細かい変化が失われます（エイリアシング）
						</p>
						<p>
							• ビット数を下げると、音の滑らかさが失われます（量子化ノイズ）
						</p>
						<p>
							•
							「サンプリング観察用拡大」ボタンで、個々のサンプリングポイントを確認できます
						</p>
						<p>• CD音質は44,100Hz・16bitが標準です</p>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
