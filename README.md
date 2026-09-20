# Models

3Dプリント向けのパラメトリックモデルを生成するブラウザアプリ。

現在収録しているモデル:

- 3-Key Switch Tester: 横一列の3穴、底なし・基板なしの枠。外形62×24×12mm、19.05mmピッチ、穴14.1mm、天板1.5mm、側壁2mmが既定。
  - 穴幅・全高・側壁厚を調整でき、STL/3MFは天板を下にした印刷向きで出力。
  - 穴と天板厚の基準は[CHERRY MX寸法図](https://www.smcelectronics.com/DOWNLOADS/CHERRYMX.PDF)の14mm角・1.5mm厚。既定穴には幅全体で+0.1mmの印刷補正を追加。ユーザーの実物確認でスイッチがぴったり嵌合。
- Instrument Stand: 脚と梁を生成
- VideoMic Me-C Stand: 3点接地ベース、325mm一体支柱、USB-C開口付きホルダーを生成
- Cherry Keycap: R1〜R4、MX互換ステム、2色の角丸菱形インレイを生成
  - 角形ステムの寸法参考: [Keycap Playground / stems.scad](https://github.com/riskable/keycap_playground/blob/master/stems.scad)。コード転載ではなくJSCADで独自構築。
  - 既定は角丸5.37mm四方、嵌合補正0.1mm、十字穴4.10×1.40 / 1.30×4.025mm、差し込み深さ4mm。根元だけにT字リブを配置。丸形も選択可能。補正0.2mmでは緩く、0.1mmの試験軸はユーザーの実物確認でぴったり嵌合。
  - 0.2mmノズル向け。実スイッチの嵌合はテスト印刷で確認する。

VideoMic Me-Cモードの初期値は、一体支柱長325mm、マイク中心高376.5mm、設置径240mm。ホルダーは支柱の直上へ28mm持ち上げ、USB-Cケーブルはホルダー側面から逃がす。支柱とベースにケーブル溝は設けない。公式外形寸法を参照した形状で、実機との嵌合と実プリント強度は別途確認が必要。

```sh
pnpm install
pnpm dev
```

```sh
pnpm test
pnpm build
```
