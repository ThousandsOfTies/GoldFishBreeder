# きんぎょの すいぞくかん

好きな金魚をかけあわせて新種を見つけ、名前をつけて水槽で眺める、子ども向けのReact Webゲームです。

## ゲームのルール

- 左の親から体形と尾びれ、右の親から色と模様を受け継ぎます。
- 同じ順番の組み合わせからは、必ず同じ種類が生まれます。
- 左右を逆にすると別の種類になります。
- 生まれた新種も次の親として使えます。
- かけあわせ5回ごとに、新しい基本の親金魚が増えます。
- 10個の水槽にはそれぞれ10匹まで入り、あふれた金魚は「おやすみ池」で安全に預かります。

進み具合はブラウザ内に自動保存されます。

## 遊ぶ

公開先: https://ThousandsOfTies.github.io/GoldFishBreeder/

GitHub Pages版では、ChatGPTへのログインやOpenAI APIキーは不要です。
金魚の表示・掛け合わせ・保存はブラウザ内で行います。

### セーブについて

- 同じ端末・同じブラウザ・同じ公開先で、進み具合を自動保存します（localStorage）。
- ブラウザのサイトデータを消すと、セーブも消えます。
- 別端末への同期、セーブの書き出し・読み込みはまだありません。
- 以前の公開先からのセーブデータは自動では移りません。
- URLを知っている人は誰でも遊べますが、他の人のセーブ内容は共有されません。

## GitHub Pages版の開発

Node.js 22.13以降が必要です。

```sh
npm ci
npm run dev:pages
```

公開用ファイルの作成と手元での確認:

```sh
npm run build:pages
npm run preview:pages
```

`dist-pages/` に静的なHTML・JavaScript・CSS・画像が出力されます。
サーバーのプログラムやデータベースは不要です。
ファイルを直接ダブルクリックするのではなく、上記のプレビューを使ってください。

## GitHub Pagesへの公開

1. リポジトリの **Settings → Pages → Source** を **GitHub Actions** にします。
2. `main` に変更を保存すると、`.github/workflows/pages.yml` がビルドと公開を行います。
3. **Actions** の `Deploy aquarium to GitHub Pages` で結果を確認できます。

GitHub用の秘密鍵やAPIキーをソースに書く必要はありません。
公開するのは `dist-pages/` だけで、開発用ファイルやSites用設定は配信されません。

## 構成

- `app/page.tsx`: 共通のゲーム画面・ルール・保存
- `app/globals.css`: 水族館の見た目と泳ぎのアニメーション
- `public/`: 背景とアイコン
- `vite.pages.config.ts`: GitHub Pages向けの静的ビルド設定
- `.github/workflows/pages.yml`: 自動公開

以前のSites向け設定も互換用に残しています（`npm run dev` / `npm run build`）。
GitHub PagesのビルドではSitesのサーバー機能は使用しません。
