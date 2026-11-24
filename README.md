# よみバトル（仮）

漢字の読みで、歩いてくるまもの（漢字の札）とたたかう1人用ゲーム。小学4〜6年・学校の iPad（横画面）向け。

- 仕様：`docs/00〜05`（戦略・要件・構造・ワイヤー・デザイン）
- 見た目の見本：`design/style-tile.html`／ワイヤーフレーム：`wireframes/index.html`
- 問題：`js/data/questions.js`（漢字すごろくと同じファイル。足すときは「漢字 よみ」を1つ足す）
- 数字（敵の数・秒数・確率など）：`js/config.js`

## 動かしかた

ビルドはいりません。フォルダをそのまま Web サーバーで開きます。

```
python -m http.server 5185
```

→ http://localhost:5185/

## ファイル

| ファイル | 中身 |
|---|---|
| index.html / css/style.css | 画面のわく・見た目 |
| js/main.js | 画面の切りかえ（タイトル・学年・場所えらび・かばん・結果・せってい・にがてノート） |
| js/battle.js | 闘い（敵が歩いてくる・入力・攻撃・ボス） |
| js/quiz.js | 問題のえらび方・答えの判定 |
| js/state.js | 記録（iPad の中だけ・学年ごと） |
| js/art.js | 主人公・ちぎり紙の背景・はなまる |
| js/sound.js | 効果音（その場で作る音） |
| vendor/wanakana.min.js | ローマ字→ひらがな（MIT） |
