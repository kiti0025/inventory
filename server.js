const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = 3002;

// 配置中间件
app.use(cors({
  origin: true, // 允许所有来源
  credentials: true
}));
app.use(express.json());

// 配置静态文件服务 - 适配Vue 3 + Vite的dist目录
const staticDir = path.join(__dirname, 'dist');
app.use(express.static(staticDir));

// 数据库配置
const dbConfig = {
  user: 'sa',
  password: 'wintaiwoo2016',
  server: '172.16.8.203',
  database: 'XJL_151022',
  options: {
    encrypt: false,
    trustServerCertificate: true // 仅在开发环境中设置为true
  }
};

// 数据库连接池管理
let dbPool = null;

async function initializeDbPool() {
  try {
    if (!dbPool) {
      dbPool = await sql.connect(dbConfig);
      console.log('数据库连接成功');
    }
    return dbPool;
  } catch (err) {
    console.error('数据库连接失败:', err);
    dbPool = null;
    throw err;
  }
}

// 定期检查数据库连接状态
setInterval(async () => {
  try {
    const pool = await initializeDbPool();
    await pool.request().query('SELECT 1');
  } catch (err) {
    console.log('数据库连接已断开，尝试重新连接...');
    try {
      await initializeDbPool();
    } catch (reconnectErr) {
      console.error('重新连接失败:', reconnectErr);
    }
  }
}, 60000); // 每分钟检查一次

// API路由 - 根据库位查询库存
app.get('/api/inventory/bin/:binCode', async (req, res) => {
  try {
    const binCode = req.params.binCode;
    const pool = await initializeDbPool();
    const result = await pool.request()
      .input('BinInfoCode', sql.VarChar(50), binCode)
      .execute('usp_GetWhQohByBinCode');
    
    res.json(result.recordset);
  } catch (err) {
    console.error('查询失败:', err);
    res.status(500).json({ error: '查询失败', message: err.message });
  }
});

// API路由 - 根据料号查询库存
app.get('/api/inventory/item/:itemCode', async (req, res) => {
  try {
    const itemCode = req.params.itemCode;
    const pool = await initializeDbPool();
    const result = await pool.request()
      .input('ItemCode', sql.VarChar(50), itemCode)
      .execute('usp_GetWhQohByBinCode');
    
    res.json(result.recordset);
  } catch (err) {
    console.error('查询失败:', err);
    res.status(500).json({ error: '查询失败', message: err.message });
  }
});

// Vue 3 SPA路由处理 - 确保所有路由都返回index.html
app.get('*', (req, res) => {
  const indexPath = path.join(staticDir, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(500).send('服务器错误');
    }
  });
});

// 启动HTTP服务器（简化配置，避免HTTPS证书问题）
const server = app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  initializeDbPool();
});

// 优雅关闭处理
process.on('SIGTERM', () => {
  console.log('收到关闭信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});