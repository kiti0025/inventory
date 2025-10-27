# inventory

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) 
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Backend (本项目后端)

项目包含一个简单的 Node 后端（连接 SQL Server 并提供查询 API）。开发时建议使用 `server.cjs`：

1. 安装后端依赖（如果尚未安装）：

```powershell
npm install express mssql cors
```

2. 启动后端：

```powershell
node server.cjs
```

后端默认监听 3002 端口，提供两个接口：

- GET /api/inventory/bin/:binCode  （按库位查询）
- GET /api/inventory/item/:itemCode （按料号查询）

注意：如果在项目根目录下放置 `key.pem` 和 `cert.pem`，后端会以 HTTPS 启动；否则自动回退为 HTTP 以方便本地开发。

开发时先确保后端运行（node server.cjs），然后在另一个终端运行 `npm run dev`，在浏览器打开 http://localhost:5173 开始扫码测试。

### Compile and Minify for Production

```sh
npm run build
```
