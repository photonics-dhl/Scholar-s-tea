# 私人知识库调试脚本

## 浏览器控制台查看 IndexedDB 内容

### 1. 列出所有文献
```js
(async () => {
  const db = await new Promise((resolve, reject) => {
    const req = indexedDB.open('scholars-tea-personal-kb', 1)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  const tx = db.transaction('documents', 'readonly')
  const store = tx.objectStore('documents')
  const docs = await new Promise((resolve, reject) => {
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  console.table(docs.map(d => ({
    docId: d.docId,
    全文长度: d.fullText?.length,
    chunks数: d.chunks?.length,
    已嵌入: d.chunks?.filter(c => c.embedding?.length > 0).length,
    存储时间: new Date(d.extractedAt).toLocaleString()
  })))
})()
```

### 2. 查看某篇文献的完整文本
```js
(async () => {
  // 把下面的 ID 换成你要查看的 docId
  const targetDocId = '替换为你的docId'
  const db = await new Promise((resolve, reject) => {
    const req = indexedDB.open('scholars-tea-personal-kb', 1)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  const tx = db.transaction('documents', 'readonly')
  const doc = await new Promise((resolve, reject) => {
    const req = tx.objectStore('documents').get(targetDocId)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  console.log('=== 全文 ===')
  console.log(doc.fullText)
  console.log('\n=== Chunks ===')
  doc.chunks.forEach((c, i) => {
    console.log(`[Chunk ${i+1}] tokens≈${Math.ceil(c.text.length/4)}, 有embedding=${!!c.embedding}`)
    console.log(c.text.slice(0, 200) + '...')
    console.log('---')
  })
})()
```

### 3. 导出所有数据为 JSON（备份/分析）
```js
(async () => {
  const db = await new Promise((resolve, reject) => {
    const req = indexedDB.open('scholars-tea-personal-kb', 1)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  const tx = db.transaction('documents', 'readonly')
  const docs = await new Promise((resolve, reject) => {
    const req = tx.objectStore('documents').getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  // 去掉 embedding 以减小体积（只保留文本）
  const exportData = docs.map(d => ({
    docId: d.docId,
    fullText: d.fullText,
    chunks: d.chunks.map(c => ({
      id: c.id,
      text: c.text,
      startIndex: c.startIndex,
      endIndex: c.endIndex,
      hasEmbedding: !!c.embedding
    })),
    extractedAt: d.extractedAt
  }))
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'pkb-export.json'
  a.click()
  console.log(`已导出 ${docs.length} 篇文献`)
})()
```

### 4. 查看 Embedding 配置
```js
(async () => {
  const db = await new Promise((resolve, reject) => {
    const req = indexedDB.open('scholars-tea-personal-kb', 1)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  const tx = db.transaction('settings', 'readonly')
  const config = await new Promise((resolve, reject) => {
    const req = tx.objectStore('settings').get('embeddingConfig')
    req.onsuccess = () => resolve(req.result?.value)
    req.onerror = () => reject(req.error)
  })
  console.log('Embedding 配置:', config)
})()
```
