"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useRef } from "react"

interface WaveformDisplayProps {
	title: string
	titleColor: string
	buffer: AudioBuffer | null
	data: Float32Array | null
	color: string
	isProcessed?: boolean
	onCanvasClick?: (
		event:
			| React.MouseEvent<HTMLCanvasElement>
			| React.KeyboardEvent<HTMLCanvasElement>,
		isProcessed: boolean,
	) => void
	selectedSampleIndex?: number | null
	showSamplingPoints?: boolean
	bitDepth?: number
	sampleRate?: number
	getBinaryRepresentation?: (value: number, bits: number) => string
	drawWaveform: (
		canvas: HTMLCanvasElement,
		data: Float32Array | null,
		color: string,
		buffer: AudioBuffer | null,
		isProcessed?: boolean,
	) => void
}

export function WaveformDisplay({
	title,
	titleColor,
	buffer,
	data,
	color,
	isProcessed = false,
	onCanvasClick,
	selectedSampleIndex,
	showSamplingPoints,
	bitDepth,
	sampleRate,
	getBinaryRepresentation,
	drawWaveform,
}: WaveformDisplayProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null)

	useEffect(() => {
		if (canvasRef.current && data && buffer) {
			canvasRef.current.width = canvasRef.current.offsetWidth
			canvasRef.current.height = 200
			drawWaveform(canvasRef.current, data, color, buffer, isProcessed)
		}
	}, [data, buffer, drawWaveform, color, isProcessed])

	// リサイズ時の再描画
	useEffect(() => {
		let resizeTimer: NodeJS.Timeout | null = null

		const handleResize = () => {
			if (resizeTimer) {
				clearTimeout(resizeTimer)
			}

			resizeTimer = setTimeout(() => {
				if (canvasRef.current && data && buffer) {
					canvasRef.current.width = canvasRef.current.offsetWidth
					canvasRef.current.height = 200
					drawWaveform(canvasRef.current, data, color, buffer, isProcessed)
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
	}, [data, buffer, drawWaveform, color, isProcessed])

	return (
		<Card>
			<CardHeader>
				<CardTitle className={`text-center ${titleColor}`}>{title}</CardTitle>
			</CardHeader>
			<CardContent>
				<canvas
					ref={canvasRef}
					className={`w-full h-48 bg-white border border-gray-200 rounded-lg ${
						isProcessed ? "cursor-pointer" : "cursor-crosshair"
					}`}
					onClick={
						onCanvasClick ? (e) => onCanvasClick(e, isProcessed) : undefined
					}
					onKeyDown={
						onCanvasClick
							? (e) => {
									if (e.key === "Enter") {
										onCanvasClick(e, isProcessed)
									}
								}
							: undefined
					}
					tabIndex={0}
				/>
				{selectedSampleIndex !== null &&
					selectedSampleIndex !== undefined &&
					showSamplingPoints &&
					data &&
					selectedSampleIndex >= 0 &&
					selectedSampleIndex < data.length &&
					isProcessed &&
					bitDepth &&
					sampleRate &&
					getBinaryRepresentation && (
						<div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono">
							<p>選択されたサンプル: #{selectedSampleIndex}</p>
							<p>時間: {(selectedSampleIndex / sampleRate).toFixed(4)}秒</p>
							<p>値: {data[selectedSampleIndex].toFixed(4)}</p>
							<p>
								2進数:{" "}
								{getBinaryRepresentation(data[selectedSampleIndex], bitDepth)}
							</p>
						</div>
					)}
			</CardContent>
		</Card>
	)
}
