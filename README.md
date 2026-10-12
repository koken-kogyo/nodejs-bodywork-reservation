# からだや予約システム  
- [KGA002JW] 60-bodywork-reservation  

## 概要  
- からだやの予約や一覧表示を行うAPIサーバー  

## 開発環境  
- Node.js v18.12.1  
- MySQL 8.0.32  
- nvm-windows 1.1.10  

## npmパッケージ
- ejs@3.1.9  
- express@4.18.3  
- mysql2@3.9.3  
- serve-favicon@2.5.0  

## メンバー  
- y.watanabe  

## プロジェクト構成  
~~~
./
│  .gitignore                                  # ソース管理除外対象
│  config.js                                   # webアプリケーション設定ファイル (git管理外)
│  package.json                                # パッケージ管理ファイル
│  README.md                                   # このファイル
│  server.js                                   # メインとなるサーバー起動ファイル
│  
├─ handler                                    # ☆サーバー側で使用するハンドラー群
│          mysql.js                            # MySQL関連のハンドラー
│  
├─ public                                     # ☆クライアントに公開するモジュール群
│  ├─ css
│  │      style-basic.css                     # 共通で使用するスタイルシート
│  │      style-index.css                     # メインのスタイルシート
│  │
│  ├─ imsges                                 # クライアントに提供するファイル群
│  │
│  └─ pdfs                                   # クライアントに提供する電子マニュアル群
│  
├─ settingfiles                               # 設定ファイルのバックアップ用フォルダ・・・ (未使用)
│  
├─ views                                      # ☆EJSテンプレートエンジン群
│          popup.ejs                           # 表示履歴表示画面
│          index.ejs                           # TopPage
        
~~~

## メール送信
- Microsoft Graph API メール送信
- > npm install @azure/identity @microsoft/microsoft-graph-client isomorphic-fetch

## データベース  

| Table    | Name                      |  
| :------: | :------------------------ |  
| kd7000   | からだや予約ファイル      |  

## アセンブリ情報  

- 著作権： © 2026 koken-kogyo CO,LTD.

