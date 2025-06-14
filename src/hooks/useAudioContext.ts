import { useCallback, useRef, useState } from "react"

interface AudioBufferData {
	buffer: AudioBuffer | null
	data: Float32Array | null
}

export function useAudioContext() {
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
	const [isPlaying, setIsPlaying] = useState({
		original: false,
		processed: false,
	})
	const [volume, setVolume] = useState(0.5)
	const [gainNode, setGainNode] = useState<GainNode | null>(null)
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
		},
		[generatePresetAudio],
	)

	return {
		audioContext,
		originalBuffer,
		processedBuffer,
		currentSound,
		isPlaying,
		volume,
		gainNode,
		fileInputRef,
		setAudioContext,
		setOriginalBuffer,
		setProcessedBuffer,
		setCurrentSound,
		setIsPlaying,
		setVolume,
		setGainNode,
		initAudioContext,
		generatePresetAudio,
		handleFileUpload,
		loadPreset,
	}
}
