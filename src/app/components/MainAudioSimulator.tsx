"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, AudioWaveform, BarChart3, Binary, Info } from "lucide-react"

import { useAudioContext } from "../../hooks/useAudioContext"
import { useAudioPlayback } from "../../hooks/useAudioPlayback"
import { useAudioProcessing } from "../../hooks/useAudioProcessing"
import { useWaveformVisualization } from "../../hooks/useWaveformVisualization"

import { AudioInfoPanel } from "../../components/AudioInfoPanel"
import { AudioLoader } from "../../components/AudioLoader"
import { AudioParameters } from "../../components/AudioParameters"
import { AudioPlaybackControls } from "../../components/AudioPlaybackControls"
import { BinaryEncodingDisplay } from "../../components/BinaryEncodingDisplay"
import { LearningHints } from "../../components/LearningHints"
import { VisualizationSettings } from "../../components/VisualizationSettings"
import { WaveformDisplay } from "../../components/WaveformDisplay"
import { WaveformViewControls } from "../../components/WaveformViewControls"

export default function MainAudioSimulator() {
	const {
		audioContext,
		originalBuffer,
		processedBuffer,
		currentSound,
		isPlaying,
		volume,
		gainNode,
		fileInputRef,
		setProcessedBuffer,
		setCurrentSound,
		setIsPlaying,
		setVolume,
		setGainNode,
		handleFileUpload,
		loadPreset,
	} = useAudioContext()

	const {
		sampleRate,
		bitDepth,
		quantizationLevels,
		bitRate,
		setSampleRate,
		setBitDepth,
		getBinaryRepresentation,
	} = useAudioProcessing({
		originalBuffer,
		audioContext,
		setProcessedBuffer,
	})

	const {
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
		drawWaveform,
		handleCanvasClick,
		resetViewControls,
		setSamplingObservationZoom,
	} = useWaveformVisualization({
		originalBuffer,
		processedBuffer,
		sampleRate,
		bitDepth,
	})

	const { playAudioBuffer, stopAllAudio } = useAudioPlayback({
		audioContext,
		currentSound,
		isPlaying,
		volume,
		gainNode,
		setCurrentSound,
		setIsPlaying,
		setGainNode,
	})

	const handleResetParameters = () => {
		setSampleRate(44100)
		setBitDepth(16)
	}

	const handleLoadPresetWithReset = (type: "sine" | "voice" | "music") => {
		loadPreset(type)
		resetViewControls()
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
			<div className="max-w-7xl mx-auto space-y-6">
				<div className="text-center space-y-2">
					<h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-3">
						<AudioWaveform className="h-10 w-10 text-blue-600" />
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
				<AudioLoader
					onLoadPreset={handleLoadPresetWithReset}
					onFileUpload={handleFileUpload}
					fileInputRef={fileInputRef}
				/>

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
						<AudioParameters
							sampleRate={sampleRate}
							bitDepth={bitDepth}
							quantizationLevels={quantizationLevels}
							onSampleRateChange={setSampleRate}
							onBitDepthChange={setBitDepth}
							onReset={handleResetParameters}
						/>
					</TabsContent>

					<TabsContent value="visualization">
						<VisualizationSettings
							showSamplingPoints={showSamplingPoints}
							showQuantizationLevels={showQuantizationLevels}
							showBinaryData={showBinaryData}
							onShowSamplingPointsChange={setShowSamplingPoints}
							onShowQuantizationLevelsChange={setShowQuantizationLevels}
							onShowBinaryDataChange={setShowBinaryData}
						/>
					</TabsContent>

					<TabsContent value="encoding">
						<BinaryEncodingDisplay
							processedData={processedBuffer.data}
							bitDepth={bitDepth}
							showBinaryData={showBinaryData}
							getBinaryRepresentation={getBinaryRepresentation}
						/>
					</TabsContent>
				</Tabs>

				{/* 情報表示 */}
				<AudioInfoPanel
					sampleRate={sampleRate}
					bitDepth={bitDepth}
					quantizationLevels={quantizationLevels}
					bitRate={bitRate}
				/>

				{/* 再生コントロール */}
				<AudioPlaybackControls
					originalBuffer={originalBuffer.buffer}
					processedBuffer={processedBuffer.buffer}
					isPlaying={isPlaying}
					volume={volume}
					onPlayOriginal={() =>
						playAudioBuffer(originalBuffer.buffer, "original")
					}
					onPlayProcessed={() =>
						playAudioBuffer(processedBuffer.buffer, "processed")
					}
					onStop={stopAllAudio}
					onVolumeChange={setVolume}
				/>

				{/* 波形表示 */}
				<div className="grid lg:grid-cols-2 gap-6">
					<WaveformDisplay
						title="元の波形（アナログ）"
						titleColor="text-blue-600"
						buffer={originalBuffer.buffer}
						data={originalBuffer.data}
						color="#3b82f6"
						isProcessed={false}
						drawWaveform={drawWaveform}
					/>
					<WaveformDisplay
						title="処理後の波形（デジタル）"
						titleColor="text-red-600"
						buffer={processedBuffer.buffer}
						data={processedBuffer.data}
						color="#ef4444"
						isProcessed={true}
						onCanvasClick={(event, isProcessed) =>
							handleCanvasClick(
								event as React.MouseEvent<HTMLCanvasElement>,
								isProcessed,
							)
						}
						selectedSampleIndex={selectedSampleIndex}
						showSamplingPoints={showSamplingPoints}
						bitDepth={bitDepth}
						sampleRate={sampleRate}
						getBinaryRepresentation={getBinaryRepresentation}
						drawWaveform={drawWaveform}
					/>
				</div>

				{/* 波形表示コントロール */}
				<WaveformViewControls
					xZoom={xZoom}
					xOffset={xOffset}
					yZoom={yZoom}
					yOffset={yOffset}
					onXZoomChange={setXZoom}
					onXOffsetChange={setXOffset}
					onYZoomChange={setYZoom}
					onYOffsetChange={setYOffset}
					onResetAll={resetViewControls}
					onSamplingObservationZoom={setSamplingObservationZoom}
				/>

				{/* 学習のヒント */}
				<LearningHints />
			</div>
		</div>
	)
}
