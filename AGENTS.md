# Models の開発ガイド

## アプリの概要

3Dプリント向けのパラメトリックモデルをブラウザで生成し、STL / 3MF として出力するアプリ。React + TypeScript + Vite を使い、形状生成は JSCAD、プレビューは Three.js / React Three Fiber で行う。

## コードの配置

- `src/App.tsx`: モデルの切り替えと各ワークスペースの接続。
- `src/domain/`・`src/geometry/model.ts`: Instrument Stand のパラメータ、寸法計算、検証、形状生成。
- `src/microphone/`: VideoMic Me-C Stand。
- `src/clip/`: モニター用クリップ。
- `src/keycap/`: Cherry Keycap。
- `src/switchTester/`: 3-Key Switch Tester。
- `src/components/`: 操作パネルと共通プレビュー。
- `src/geometry/types.ts`・`src/geometry/toThree.ts`: 共通の部品型と表示用ジオメトリ変換。
- `src/settings/`・各モデルの `preset.ts`: 設定 JSON の保存・読み込み。
- `src/export/download.ts`: STL / 3MF のシリアライズとダウンロード。

## 開発と検証

CI の環境は Node.js 22 / pnpm 10。依存管理には pnpm と `pnpm-lock.yaml` を使う。

```sh
pnpm install
pnpm dev
pnpm test
pnpm build
```

型チェックのみなら `pnpm typecheck`。テストはソースと同じディレクトリの `*.test.ts` に置き、Vitest で実行する。対象を絞る場合は `pnpm test -- src/switchTester/model.test.ts` のように指定する。

コード変更時は関連テストと `pnpm build` を確認する。ドキュメントのみの変更ではリンクと差分を確認する。

## モデルを変更するとき

- 寸法の単位は mm。モデル側で寸法計算と形状生成を行い、UI はパラメータの操作と表示を担当する。
- パラメータを追加・変更したら、既定値、入力 UI、検証、設定 JSON の読み書き、出力への反映を確認する。保存済み設定の読み込みも確認する。
- プレビューの参照形状と印刷対象を区別する。`AssemblyPart.printable === false` の部品を印刷用出力へ混入させない。
- 表示向きと印刷向きが異なるモデルがある。形状変更では出力時の向き、接地位置、部品分割、3MF の色も確認する。
- 形状テストでは外形寸法、穴・空洞、肉厚、干渉、無効な入力など、変更した仕様を確認する。
- 自動テスト、スライサー確認、実プリント、実物との嵌合確認は別々に記録する。自動テストの成功だけで実物の嵌合や強度を確認済みにしない。

## ドキュメント

README は概要、モデル仕様へのリンク、開発コマンドに留める。モデルごとの寸法、形状、参考資料、印刷条件、検証状況は `docs/specs/` に記載する。仕様を変更したら対応する文書も更新する。

## 配信と生成物

GitHub Pages の公開パスは `/models/`。`vite.config.ts` の `base` と整合するようにアセットのパスを扱う。`main` への push で `.github/workflows/deploy-pages.yml` がビルド・配信する。

`dist/`、`node_modules/`、`.pnpm-store/`、`*.tsbuildinfo`、ビルドで生成される `vite.config.js` / `vite.config.d.ts` は編集・コミット対象にしない。
