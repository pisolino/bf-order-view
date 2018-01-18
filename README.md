# bf-order-view
custom order view for bf - WIP
  
  
某取引所のRealtime APIを取得して、直近の約定履歴から現在の値幅を表示します。
最大値、最小値で指値注文する使い方を想定しています。  
  
まだ色々造りかけのため注文機能周りは画面から叩けません。  
あくまで技術的な実験のために作っているため、本プログラム利用によって生じた損害等につきましては作成者は一切関知いたしません。

## dependencies
node.js  
express  
socket.io  
pubnub  
vue.js  
axios  

etc...


## pre-setup
1. bfのAPIキーおよびシークレットを取得する（PermissionはTrade周りのみでOK）
2. `.env.sample` ファイルをコピーして同階層に `.env` ファイルを作成
3. `.env` ファイル内の `API_KEY` `API_SECRET` に1のフレーズを設定する

## setup
```sh
npm install
npm run build:server && npm run build:client
node ./dist/index.js
```
and open http://localhost:8081
