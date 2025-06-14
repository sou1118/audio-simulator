import { useCallback, useEffect, useState } from "react"

interface AudioBufferData {
	buffer: AudioBuffer | null
	data: Float32Array | null
}

interface UseAudioProcessingProps {
	originalBuffer: AudioBufferData
	audioContext: AudioContext | null
	setProcessedBuffer: (buffer: AudioBufferData) => void
}

export function useAudioProcessing({
	originalBuffer,
	audioContext,
	setProcessedBuffer,
}: UseAudioProcessingProps) {
	const [sampleRate, setSampleRate] = useState(44100)
	const [bitDepth, setBitDepth] = useState(16)

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
	}, [
		originalBuffer.buffer,
		sampleRate,
		bitDepth,
		audioContext,
		setProcessedBuffer,
	])

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

	// エフェクト
	useEffect(() => {
		if (originalBuffer.buffer) {
			processAudio()
		}
	}, [originalBuffer.buffer, processAudio])

	const quantizationLevels = 2 ** bitDepth
	const bitRate = (sampleRate * bitDepth * 2) / 1000

	return {
		sampleRate,
		bitDepth,
		quantizationLevels,
		bitRate,
		setSampleRate,
		setBitDepth,
		processAudio,
		getBinaryRepresentation,
	}
}
