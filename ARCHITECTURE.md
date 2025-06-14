# アーキテクチャドキュメント

```txt
src/
├── app/
│   ├── components/
│   │   └── MainAudioSimulator.tsx  # メインコンポーネント
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── hooks/                          # カスタムフック
│   ├── useAudioContext.ts          # 音声コンテキスト管理
│   ├── useAudioProcessing.ts       # 音声処理ロジック
│   ├── useWaveformVisualization.ts # 波形表示ロジック
│   └── useAudioPlayback.ts         # 音声再生ロジック
├── components/                     # UIコンポーネント
│   ├── AudioLoader.tsx             # 音声ファイル読み込み
│   ├── AudioParameters.tsx         # デジタル化パラメータ設定
│   ├── VisualizationSettings.tsx   # 可視化設定
│   ├── BinaryEncodingDisplay.tsx   # バイナリデータ表示
│   ├── AudioInfoPanel.tsx          # 音声情報パネル
│   ├── AudioPlaybackControls.tsx   # 再生コントロール
│   ├── WaveformDisplay.tsx         # 波形表示
│   ├── WaveformViewControls.tsx    # 波形ビューコントロール
│   ├── LearningHints.tsx           # 学習のヒント
│   └── ui/                         # 基本UIコンポーネント
└── lib/
    └── utils.ts
```
