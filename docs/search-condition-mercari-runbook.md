# メルカリ 保存済み検索条件の運用手順

## 目的

`docs/search-condition-mercari.md` に定義された検索条件を、メルカリの「保存済みの検索条件」に定期的に正しく反映する。

## 完了条件

- 保存件数が **20件**（10正式名称 x A/B）である
- 名前が **`{A|B}. 正式名称`** 形式である
- クリック時に適用される検索クエリが定義値と一致する
- 新着通知設定が **Push通知: ON / メール: OFF** である
- 期待外の保存条件（例: `BATONER`）が 0 件である

## 基本方針

部分修正よりも、紐づきズレを避けるために以下を基本とする。

1. 既存の保存条件を全削除
2. `docs/search-condition-mercari.md` から全20件を再登録
3. 一覧・実検索・通知設定を全件検証

## 事前準備

1. メルカリにログインする
2. 下記2ページを開く
   - 保存条件管理: `https://jp.mercari.com/mypage/follow/saved_searches`
   - 定義一覧: `docs/search-condition-mercari.md`

## 手順1: 既存条件を全削除

1. 保存条件管理ページを開く
2. 既存の保存条件を上から順に削除する
3. 保存条件が 0 件になったことを確認する

## 手順2: 定義どおりに20件を登録

各正式名称について **A → B の順** で登録する。

1. 検索窓にキーワードを入力して検索する
2. 検索条件を保存する
3. 保存名を設定する（例: `A. Apple Watch SE 第2世代 44mm GPS`）
4. 新着通知設定を以下にする
   - Push通知: ON
   - メール: OFF
5. 保存する

## 登録対象一覧（20件）

1. `A. Apple Watch SE 第2世代 44mm GPS` → `apple watch se 第2世代 44mm gps`
2. `B. Apple Watch SE 第2世代 44mm GPS` → `apple watch se2 44mm gps`
3. `A. Apple Watch SE 第2世代 40mm GPS` → `apple watch se 第2世代 40mm gps`
4. `B. Apple Watch SE 第2世代 40mm GPS` → `apple watch se2 40mm gps`
5. `A. Apple Watch Series 8 45mm GPS` → `apple watch series 8 45mm gps`
6. `B. Apple Watch Series 8 45mm GPS` → `apple watch8 45mm gps`
7. `A. Apple Watch Series 8 41mm GPS` → `apple watch series 8 41mm gps`
8. `B. Apple Watch Series 8 41mm GPS` → `apple watch8 41mm gps`
9. `A. SONY WH-1000XM5` → `sony ヘッドホン wh-1000xm5`
10. `B. SONY WH-1000XM5` → `wh-1000xm5`
11. `A. Nintendo Switch Lite` → `nintendo switch lite 本体`
12. `B. Nintendo Switch Lite` → `switch lite 本体`
13. `A. Nintendo Switch 有機ELモデル` → `nintendo switch 有機elモデル 本体`
14. `B. Nintendo Switch 有機ELモデル` → `switch 有機el 本体`
15. `A. Google Pixel 7a 128GB` → `google pixel 7a 128gb 本体`
16. `B. Google Pixel 7a 128GB` → `pixel7a 128gb`
17. `A. iPhone 13 128GB SIMフリー` → `iphone 13 128gb simフリー 本体`
18. `B. iPhone 13 128GB SIMフリー` → `iphone13 simフリー 128gb`
19. `A. iPhone 13 mini 128GB SIMフリー` → `iphone 13 mini 128gb simフリー 本体`
20. `B. iPhone 13 mini 128GB SIMフリー` → `iphone13mini simフリー 128gb`

## 手順3: 一覧確認（保存漏れ/不要条件）

1. 保存条件管理ページ、または検索窓フォーカス時に表示される保存済み一覧を開く
2. 件数が 20 件であることを確認する
3. 名前が上記20件と完全一致することを確認する
4. 期待外条件（例: `BATONER`）がないことを確認する

## 手順4: 実検索クエリの紐づき確認（全件）

保存済み一覧から1件ずつクリックし、実際に実行される検索条件を確認する。

1. 対象の保存条件をクリックする
2. 検索窓の文字列が登録対象一覧のクエリと一致するか確認する
3. 不一致ならその保存条件を削除して再登録する

## 手順5: 新着通知設定の確認（全件）

保存条件管理ページで各条件の「新着通知設定の編集」を開き、1件ずつ確認する。

1. Push通知が ON であることを確認する
2. メールが OFF であることを確認する
3. 不一致なら修正して保存する

## 最終チェックリスト

- [ ] 20件登録済み
- [ ] 名前が `{A|B}. 正式名称` 形式で全件一致
- [ ] クリック時の実検索クエリが全件一致
- [ ] Push通知が全件 ON
- [ ] メール通知が全件 OFF
- [ ] 期待外条件が 0 件

