import { useCallback, useEffect } from "react"

interface UseAudioPlaybackProps {
	audioContext: AudioContext | null
	currentSound: AudioBufferSourceNode | null
	isPlaying: { original: boolean; processed: boolean }
	volume: number
	gainNode: GainNode | null
	setCurrentSound: (sound: AudioBufferSourceNode | null) => void
	setIsPlaying: (playing: { original: boolean; processed: boolean }) => void
	setGainNode: (node: GainNode | null) => void
}

export function useAudioPlayback({
	audioContext,
	currentSound,
	isPlaying,
	volume,
	gainNode,
	setCurrentSound,
	setIsPlaying,
	setGainNode,
}: UseAudioPlaybackProps) {
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
		[
			audioContext,
			currentSound,
			volume,
			setCurrentSound,
			setIsPlaying,
			setGainNode,
		],
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
	}, [currentSound, setCurrentSound, setGainNode, setIsPlaying])

	// ボリューム変更時の処理
	useEffect(() => {
		if (gainNode) {
			gainNode.gain.value = volume
		}
	}, [volume, gainNode])

	// クリーンアップ
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

	return {
		playAudioBuffer,
		stopAllAudio,
	}
}
