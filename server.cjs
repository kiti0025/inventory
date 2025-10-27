const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const https = require('https');

const app = express();
const PORT = 3002;

// 中间件
app.use(cors({
  origin: true, // 允许所有来源
  credentials: true
}));
app.use(express.json());

// 提供前端静态文件
app.use(express.static(path.join(__dirname, 'build')));

// 数据库配置
const dbConfig = {
  user: 'sa',
  password: 'wintaiwoo2016',
  server: '172.16.8.203',
  database: 'XJL_151022',
  options: {
    encrypt: false, // 根据需要设置
    trustServerCertificate: true // 仅在开发环境中设置为true
  }
};

// 连接数据库
const connectDB = async () => {
  try {
    await sql.connect(dbConfig);
    console.log('数据库连接成功');
  } catch (err) {
    console.error('数据库连接失败:', err);
  }
};

// API路由 - 根据库位查询库存
app.get('/api/inventory/bin/:binCode', async (req, res) => {
  try {
    const binCode = req.params.binCode;
    
    const pool = await sql.connect(dbConfig);
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
    
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('ItemCode', sql.VarChar(50), itemCode)
      .execute('usp_GetWhQohByBinCode');
    
    res.json(result.recordset);
  } catch (err) {
    console.error('查询失败:', err);
    res.status(500).json({ error: '查询失败', message: err.message });
  }
});

// 对于其他路由，返回前端应用
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.get('/scan', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.get('/results/:type/:code', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// 启动服务器：如果存在 cert/key 则使用 HTTPS，否则回退到 HTTP（方便本地开发）
const keyPath = path.join(__dirname, 'key.pem')
const certPath = path.join(__dirname, 'cert.pem')
if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  }
  https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`HTTPS服务器运行在端口 ${PORT}`);
    connectDB();
  });
} else {
  // fallback to HTTP for easier local testing
  app.listen(PORT, () => {
    console.log(`HTTP服务器运行在端口 ${PORT}（未找到 key.pem/cert.pem，已回退为 HTTP）`);
    connectDB();
  });
}
