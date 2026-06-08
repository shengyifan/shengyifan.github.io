const sceneTemplate = document.querySelector("#scene-template");
const transitionTemplate = document.querySelector("#transition-template");
const sceneList = document.querySelector("#scene-list");
const searchInput = document.querySelector("#search-input");
const expandButton = document.querySelector("#expand-all");

let projectData;
let generationPrompts;
let expanded = false;

async function loadProject() {
  const [projectResponse, generationResponse, poemResponse] = await Promise.all([
    fetch("data/prompts.json"),
    fetch("data/generation-prompts.json"),
    fetch("poem.txt")
  ]);

  if (!projectResponse.ok || !generationResponse.ok || !poemResponse.ok) {
    throw new Error("项目数据读取失败，请通过本地 HTTP 服务打开页面。");
  }

  projectData = await projectResponse.json();
  const generationData = await generationResponse.json();
  generationPrompts = new Map(
    generationData.prompts.map((item) => [item.sceneId, item.prompt])
  );

  document.querySelector("#poem-source").textContent = await poemResponse.text();
  renderMetadata(projectData.metadata);
  renderScenes();
}

function renderMetadata(metadata) {
  document.querySelector("#continuity-copy").textContent = metadata.continuity;
  document.querySelector("#global-rules").replaceChildren(
    ...metadata.globalRules.map((rule) => {
      const item = document.createElement("li");
      item.textContent = rule;
      return item;
    })
  );

  const chips = [
    `${metadata.imageCount} 张电影帧`,
    `${metadata.videoPromptCount} 段长镜头`,
    metadata.aspectRatio,
    metadata.imageModel
  ];
  document.querySelector("#hero-meta").replaceChildren(
    ...chips.map((label) => {
      const chip = document.createElement("span");
      chip.className = "meta-chip";
      chip.textContent = label;
      return chip;
    })
  );
}

function renderScenes(query = "") {
  const normalized = query.trim().toLowerCase();
  const filteredScenes = projectData.scenes.filter((scene) => {
    const haystack = `${scene.title} ${scene.verse} ${scene.imagePrompt}`.toLowerCase();
    return haystack.includes(normalized);
  });

  if (!filteredScenes.length) {
    sceneList.innerHTML = '<p class="empty">没有匹配的诗句或场景。</p>';
    return;
  }

  const fragment = document.createDocumentFragment();
  filteredScenes.forEach((scene) => {
    const sceneNode = createScene(scene);
    fragment.append(sceneNode);

    const transition = projectData.transitions.find(
      (item) => item.fromScene === scene.id
    );
    if (transition && (!normalized || filteredScenes.some((item) => item.id === transition.toScene))) {
      fragment.append(createTransition(transition));
    }
  });
  sceneList.replaceChildren(fragment);
}

function createScene(scene) {
  const node = sceneTemplate.content.cloneNode(true);
  const article = node.querySelector(".scene");
  const figure = node.querySelector(".scene-visual");
  const image = node.querySelector("img");
  const sceneLabel = String(scene.id).padStart(2, "0");

  article.dataset.search = `${scene.title} ${scene.verse}`;
  node.querySelector(".scene-index").textContent = sceneLabel;
  node.querySelector(".scene-number").textContent = `FRAME ${sceneLabel} / 25`;
  node.querySelector("h3").textContent = scene.title;
  node.querySelector("blockquote").textContent = scene.verse;
  node.querySelector(".scene-type").textContent = scene.type.toUpperCase();
  node.querySelector(".scene-file").textContent = scene.image.split("/").at(-1);

  image.src = scene.image;
  image.alt = `${sceneLabel} ${scene.title}：${scene.verse}`;
  image.addEventListener("error", () => {
    image.alt = `${scene.title}（图片尚未生成）`;
    image.removeAttribute("src");
    figure.classList.add("image-missing");
    figure.style.setProperty("--missing-label", `"FRAME ${sceneLabel} · 图像待生成"`);
  });

  node.querySelector(".creative-prompt").textContent = scene.imagePrompt;
  node.querySelector(".generation-prompt").textContent =
    generationPrompts.get(scene.id) ?? "实际生成提示词待补充。";
  wireCopyButtons(node);
  return node;
}

function createTransition(transition) {
  const node = transitionTemplate.content.cloneNode(true);
  const transitionLabel = String(transition.id).padStart(2, "0");
  node.querySelector(".transition-number").textContent = `SHOT ${transitionLabel} / 24`;
  node.querySelector("h4").textContent = transition.title;
  node.querySelector(".frame-pair").textContent =
    `FRAME ${String(transition.fromScene).padStart(2, "0")} → ${String(transition.toScene).padStart(2, "0")}`;
  node.querySelector(".video-prompt").textContent = transition.seedancePrompt;
  wireCopyButtons(node);
  return node;
}

function wireCopyButtons(root) {
  root.querySelectorAll(".copy-button").forEach((button) => {
    button.addEventListener("click", async () => {
      const text = button.parentElement.querySelector("p").textContent;
      await navigator.clipboard.writeText(text);
      button.textContent = "已复制";
      window.setTimeout(() => {
        button.textContent = "复制";
      }, 1200);
    });
  });
}

searchInput.addEventListener("input", (event) => {
  renderScenes(event.target.value);
  expanded = false;
  expandButton.textContent = "展开全部提示词";
});

expandButton.addEventListener("click", () => {
  expanded = !expanded;
  document.querySelectorAll(".prompt-block").forEach((details) => {
    details.open = expanded;
  });
  expandButton.textContent = expanded ? "收起全部提示词" : "展开全部提示词";
});

loadProject().catch((error) => {
  sceneList.innerHTML = `<p class="empty">${error.message}</p>`;
  document.querySelector("#poem-source").textContent = error.message;
  console.error(error);
});
