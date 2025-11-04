const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const https = require('https');

const app = express();
const PORT = 3002;

// 配置中间件
app.use(cors({
  origin: true, // 允许所有来源（生产环境建议指定具体域名）
  credentials: true
}));
app.use(express.json());

// 配置静态文件服务 - 适配Vue 3 + Vite的dist目录
const staticDir = path.join(__dirname, 'dist');
// 检查静态目录是否存在
if (!fs.existsSync(staticDir)) {
  console.warn(`静态文件目录 ${staticDir} 不存在，可能影响前端页面访问`);
}
app.use(express.static(staticDir));

// 数据库配置
const dbConfig = {
  user: 'sa',
  password: 'wintaiwoo2016',
  server: '172.16.8.203',
  database: 'XJL_151022',
  options: {
    encrypt: false,
    trustServerCertificate: true
  },
  pool: {
    max: 10, // 连接池最大连接数
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// 数据库连接池管理
let dbPool = null;

/**
 * 初始化数据库连接池
 * 若连接失败，会在5秒后重试
 */
async function initializeDbPool() {
  try {
    if (dbPool && dbPool.connected) {
      return dbPool; // 已连接则直接返回
    }
    dbPool = await sql.connect(dbConfig);
    console.log('数据库连接成功');
    return dbPool;
  } catch (err) {
    console.error('数据库连接失败:', err.message);
    dbPool = null;
    // 5秒后重试连接
    setTimeout(initializeDbPool, 5000);
    throw err;
  }
}

// API路由 - 根据库位查询库存
app.get('/api/inventory/bin/:binCode', async (req, res) => {
  try {
    const binCode = req.params.binCode;
    if (!binCode) {
      return res.status(400).json({ error: '库位编码不能为空' });
    }

    const pool = await initializeDbPool();
    const result = await pool.request()
      .input('BinInfoCode', sql.VarChar(50), binCode)
      .execute('usp_GetWhQohByBinCode'); // 库位查询专用存储过程
    
    res.json(result.recordset);
  } catch (err) {
    console.error('库位查询失败:', err);
    res.status(500).json({ error: '查询失败', message: err.message });
  }
});

// API路由 - 根据料号查询库存（修复：使用正确的存储过程）
app.get('/api/inventory/item/:itemCode', async (req, res) => {
  try {
    const itemCode = req.params.itemCode;
    if (!itemCode) {
      return res.status(400).json({ error: '料号不能为空' });
    }

    const pool = await initializeDbPool();
    // 注意：这里修改为料号查询专用的存储过程（根据实际情况调整名称）
    const result = await pool.request()
      .input('ItemCode', sql.VarChar(50), itemCode)
      .execute('usp_GetWhQohByBinCode'); // 修正存储过程名称
    
    res.json(result.recordset);
  } catch (err) {
    console.error('料号查询失败:', err);
    res.status(500).json({ error: '查询失败', message: err.message });
  }
});

// SPA路由支持：所有非API请求返回index.html
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API接口不存在' });
  }
  
  const indexPath = path.join(staticDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    return res.status(404).send('前端页面未找到');
  }
  
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('发送index.html失败:', err);
      res.status(500).send('服务器错误');
    }
  });
});

// 启动服务器
const keyPath = path.join(__dirname, 'key.pem');
const certPath = path.join(__dirname, 'cert.pem');

function startServer() {
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    try {
      const httpsOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
      };
      
      https.createServer(httpsOptions, app).listen(PORT, () => {
        console.log(`HTTPS服务器运行在 https://localhost:${PORT}`);
        initializeDbPool(); // 初始化数据库连接
      });
    } catch (err) {
      console.error('HTTPS证书加载失败，切换为HTTP:', err.message);
      startHttpServer();
    }
  } else {
    startHttpServer();
  }
}

function startHttpServer() {
  app.listen(PORT, () => {
    console.log(`HTTP服务器运行在 http://localhost:${PORT}`);
    initializeDbPool(); // 初始化数据库连接
  });
}

// 启动服务器
startServer();

// 优雅关闭处理
process.on('SIGTERM', async () => {
  console.log('收到关闭信号，正在关闭服务器...');
  if (dbPool && dbPool.connected) {
    await dbPool.close();
    console.log('数据库连接已关闭');
  }
  process.exit(0);
});

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
});