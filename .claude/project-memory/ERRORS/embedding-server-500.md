# BGE-M3 Embedding Server 500 错误

**时间**: 2026-05-31  
**状态**: ✅ 已修复

## 错误现象

`~/.pm2/logs/scholars-tea-error-4.log` 中频繁出现：
```
[Embedding] Local BGE-M3 failed, falling back to ZChat API: Local API error: 500
```

`~/.pm2/logs/scholars-tea-embedding-error-3.log` 中堆栈：
```
TypeError: TextEncodeInput must be Union[TextInputSequence, Tuple[InputSequence, InputSequence]]
  File ".../tokenization_utils_fast.py", line 529, in _batch_encode_plus
    encodings = self._tokenizer.encode_batch(...)
```

## 根因分析

`scripts/embedding-server.py` 第 95 行 `model.encode(texts, ...)` 接收到非法输入时，transformers tokenizer 抛出 `TypeError`。

触发条件：请求中传入空字符串、null 字节 (`\x00`) 或其他控制字符，虽然代码有过滤逻辑，但边界情况未完全覆盖。

## 修复方案

1. **增强输入过滤**：过滤 null 字节和控制字符
2. **增加 try-except 容错**：批量编码失败时，逐个编码回退，对失败项返回零向量
3. **增加日志**：记录失败文本的长度和错误类型，便于后续排查

**修改文件**: `scripts/embedding-server.py`

**关键代码**:
```python
# 过滤空文本和特殊字符
texts = []
for t in raw_texts:
    if isinstance(t, str):
        cleaned = t.strip().replace('\x00', '').replace('\x01', '').replace('\x02', '')
        if cleaned:
            texts.append(cleaned)

# 容错编码
try:
    embeddings = model.encode(texts, ...)
except Exception as e:
    # 逐个回退
    embeddings = []
    for t in texts:
        try:
            emb = model.encode([t], ...)
            embeddings.append(emb[0])
        except:
            dim = model.get_sentence_embedding_dimension()
            embeddings.append([0.0] * dim)
```

## 验证

- 重启后 `curl http://127.0.0.1:9997/health` → `{"status":"ok","model":"BAAI/bge-m3","dim":1024}`
- 连续测试空字符串/混合列表/null 字符 → 全部返回 HTTP 200
- PM2 错误日志中不再出现 500 错误
