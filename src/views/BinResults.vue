<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const code = computed(() => route.params.code || '')
const results = ref([])
const loading = ref(true)
const error = ref('')
const invalidMessage = ref('')

// 使用相对路径而不是绝对路径，提高兼容性
const API_BASE = ''

function validateCode(c){
  if(!c) return false
  // 简单校验：非空字符串且去除空白后长度大于0；如果你有更严格规则可在此扩展
  return typeof c === 'string' && c.trim().length > 0
}

async function fetchData(bin){
  loading.value = true
  error.value = ''
  invalidMessage.value = ''
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

function goBackToScan(){
  router.push({ name: 'Scan' })
}

onMounted(()=>{
  if(!validateCode(code.value)){
    loading.value = false
    invalidMessage.value = '无效的库位编码，无法查询。请返回重新扫码。'
    return
  }
  fetchData(code.value)
})

// 若路由参数变化，重新处理
watch(() => route.params.code, (newVal) => {
  results.value = []
  error.value = ''
  invalidMessage.value = ''
  if(!validateCode(newVal)){
    loading.value = false
    invalidMessage.value = '无效的库位编码，无法查询。请返回重新扫码。'
    return
  }
  fetchData(newVal)
})
</script>

<template>
  <div>
    <table v-if="results.length">
      <thead>
        <tr>
          <th>序号</th>
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
          <td>{{ idx + 1 }}</td>
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
    <div v-else-if="invalidMessage" class="error">
      {{ invalidMessage }}
      <div style="text-align:center; margin-top:12px">
        <button @click.prevent="goBackToScan" style="padding:8px 12px; border-radius:6px; border:none; background:#42b983; color:white">返回扫码</button>
      </div>
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
