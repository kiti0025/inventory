<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const code = route.params.code || ''
const results = ref([])
const loading = ref(true)
const error = ref('')

// 使用相对路径而不是绝对路径，提高兼容性
const API_BASE = ''

async function fetchData(bin){
  loading.value = true
  error.value = ''
  try{
    // 使用相对路径API调用，避免跨域问题
    const res = await fetch(`/api/inventory/bin/${encodeURIComponent(bin)}`)
    if(!res.ok) throw new Error(`${res.status}`)
    const data = await res.json()
    results.value = data
  }catch(e){
    results.value = []
    error.value = 'error'
    console.error('获取数据失败:', e)
  }finally{ loading.value = false }
}

function toItem(itemCode){
  router.push({ name: 'ItemResults', params: { code: itemCode } })
}

onMounted(()=>{ if(code) fetchData(code) })
</script>

<template>
  <div>
    <table v-if="results.length">
      <thead>
        <tr>
          <th>客户名称</th>
          <th>料号</th>
          <th>品名</th>
          <th>版本</th>
          <th>批号</th>
          <th>数量</th>
          <th>单位</th>
          <th>存储地点</th>
          <th>库位</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(r, idx) in results" :key="idx">
          <td>{{ r.customerName }}</td>
          <td><a href="#" @click.prevent="toItem(r.ItemCode)">{{ r.ItemCode }}</a></td>
          <td>{{ r.ItemName }}</td>
          <td>{{ r.ItemVersion }}</td>
          <td>{{ r.LotCode }}</td>
          <td>{{ r.StoreQty }}</td>
          <td>{{ r.StoreUomName }}</td>
          <td>{{ r._WhName }}</td>
          <td>{{ r.BinInfoCode }}</td>
        </tr>
      </tbody>
    </table>
    <div v-else-if="!loading && !error" class="no-data">
      未找到数据
    </div>
    <div v-else-if="error" class="error">
      数据加载失败
    </div>
    <!-- 当无数据时保持空白（按要求界面简洁） -->
  </div>
</template>

<style scoped>
  table{ width:100%; border-collapse:collapse }
  th,td{ border:1px solid #eaeaea; padding:8px; text-align:left }
  th{ background:#f5f5f5 }
  a{ color:#1976d2 }
  .no-data, .error {
    text-align: center;
    padding: 20px;
    color: #666;
  }
  .error {
    color: #f44336;
  }
</style>
