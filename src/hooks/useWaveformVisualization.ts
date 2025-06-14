import { useCallback, useState } from "react"

interface UseWaveformVisualizationProps {
	originalBuffer: { buffer: AudioBuffer | null; data: Float32Array | null }
	processedBuffer: { buffer: AudioBuffer | null; data: Float32Array | null }
	sampleRate: number
	bitDepth: number
}

export function useWaveformVisualization({
	originalBuffer,
	processedBuffer,
	sampleRate,
	bitDepth,
}: UseWaveformVisualizationProps) {
	const [xZoom, setXZoom] = useState(1)
	const [xOffset, setXOffset] = useState(0)
	const [yZoom, setYZoom] = useState(1)
	const [yOffset, setYOffset] = useState(0)
	const [showSamplingPoints, setShowSamplingPoints] = useState(false)
	const [showQuantizationLevels, setShowQuantizationLevels] = useState(false)
	const [showBinaryData, setShowBinaryData] = useState(false)
	const [selectedSampleIndex, setSelectedSampleIndex] = useState<number | null>(
		null,
	)

	// 波形描画
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
			const nearestSampleIndex =
				Math.round(clickedSample / downsampleRatio) * downsampleRatio
			const actualIndex = Math.floor(nearestSampleIndex)

			if (actualIndex >= 0 && actualIndex < processedBuffer.data.length) {
				setSelectedSampleIndex(actualIndex)
			} else {
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

	const resetViewControls = useCallback(() => {
		setXZoom(1)
		setXOffset(0)
		setYZoom(1)
		setYOffset(0)
	}, [])

	const setSamplingObservationZoom = useCallback(() => {
		setXZoom(10)
		setXOffset(25)
	}, [])

	return {
		xZoom,
		xOffset,
		yZoom,
		yOffset,
		showSamplingPoints,
		showQuantizationLevels,
		showBinaryData,
		selectedSampleIndex,
		setXZoom,
		setXOffset,
		setYZoom,
		setYOffset,
		setShowSamplingPoints,
		setShowQuantizationLevels,
		setShowBinaryData,
		setSelectedSampleIndex,
		drawWaveform,
		handleCanvasClick,
		resetViewControls,
		setSamplingObservationZoom,
	}
}
