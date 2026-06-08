# 《梦游天姥吟留别》长镜头视觉诗

项目包含：

- `index.html`：25帧电影分镜与24段Seedance 2.0首尾帧提示词网页
- `data/prompts.json`：完整创作提示词、诗句与转场提示词
- `data/generation-prompts.json`：实际送入图片生成器的完整提示词
- `images/`：25张16:9图片
- `poem.txt`：诗文原稿

本地预览：

```bash
python3 -m http.server 8000
```

然后访问 `http://localhost:8000/`。
