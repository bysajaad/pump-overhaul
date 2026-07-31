import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const API = "https://openrouter.ai/api/v1";
const OUT = resolve("public/media");
const KEY = process.env.OPENROUTER_API_KEY;
const FINAL = process.argv.includes("--final");
const requested = process.argv.find((arg) => arg.startsWith("--asset="))?.split("=")[1];
const resumeId = process.argv.find((arg) => arg.startsWith("--resume="))?.split("=")[1];
const STYLE = "soft clay 3D render, voxel-stepped forms, matte material, deep dark magenta background #16040d, brand magenta #f42a8f accent lighting, no text, no letters";
const MAX_COST = 8;

if (!KEY) throw new Error("OPENROUTER_API_KEY is required. Run with node --env-file=.env.local scripts/generate-media.mjs");

const assets = [
  { name: "poster-hero", kind: "image", prompt: `A monumental rounded voxel pressure vessel breathing gently above a mound of gold voxel treasure, cinematic centered composition, ample dark negative space for interface copy, ${STYLE}` },
  { name: "env-glow", kind: "image", prompt: `A distant atmospheric field of tiny magenta voxel lights and soft volumetric haze, seamless wide environmental backdrop, no foreground objects, ${STYLE}` },
  { name: "fallback-loop", kind: "video", seconds: 5, seed: true, prompt: `Use the supplied image as an exact locked composition. Static camera, no zoom, no assembly, no growth, no transformation, no new objects. Keep the vessel's silhouette and treasure layout unchanged. Only a barely perceptible one-percent breathing pulse and two restrained treasure glints. First and last frame must match for a perfect ambient loop, ${STYLE}` },
  { name: "puff-src", kind: "video", seconds: 4, prompt: `Locked camera, pure black background. One centered clay smoke puff expands and dissolves completely, isolated effect for a flipbook, ${STYLE}` },
  { name: "spark-src", kind: "video", seconds: 4, prompt: `Locked camera, pure black background. One centered small gold voxel sparkle pops and dissolves completely, isolated effect for a flipbook, ${STYLE}` },
];

const selected = requested ? assets.filter((asset) => asset.name === requested) : assets;
if (!selected.length) throw new Error(`Unknown asset: ${requested}`);
await mkdir(OUT, { recursive: true });

let manifest = { generatedAt: new Date().toISOString(), cost: 0, assets: {} };
try {
  manifest = JSON.parse(await readFile(resolve(OUT, "manifest.json"), "utf8"));
} catch {}

async function api(path, init = {}) {
  const response = await fetch(path.startsWith("http") ? path : `${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", ...init.headers },
  });
  if (!response.ok) throw new Error(`${response.status} ${await response.text()}`);
  return response.json();
}

function run(command, args) {
  return new Promise((accept, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => code === 0 ? accept() : reject(new Error(`${command} exited ${code}`)));
  });
}

async function download(url, path) {
  const openRouterDownload = new URL(url).hostname === "openrouter.ai";
  const response = await fetch(url, {
    headers: openRouterDownload ? { Authorization: `Bearer ${KEY}` } : undefined,
  });
  if (!response.ok) throw new Error(`Download failed: ${response.status} ${url}`);
  await writeFile(path, Buffer.from(await response.arrayBuffer()));
}

async function image(asset) {
  const model = FINAL ? "google/gemini-3-pro-image" : "google/gemini-3.1-flash-image";
  const result = await api("/chat/completions", {
    method: "POST",
    body: JSON.stringify({ model, modalities: ["image", "text"], messages: [{ role: "user", content: asset.prompt }] }),
  });
  const imageUrl = result.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!imageUrl) throw new Error(`No image returned for ${asset.name}`);
  const source = resolve(OUT, `${asset.name}.png`);
  if (imageUrl.startsWith("data:")) {
    await writeFile(source, Buffer.from(imageUrl.split(",")[1], "base64"));
  } else {
    await download(imageUrl, source);
  }
  await run("ffmpeg", ["-y", "-i", source, "-c:v", "libwebp", "-quality", "88", resolve(OUT, `${asset.name}.webp`)]);
  await unlink(source);
  return { model, cost: result.usage?.cost ?? 0 };
}

async function video(asset) {
  const model = "google/veo-3.1-lite";
  const body = { model, prompt: asset.prompt, seconds: asset.seconds };
  if (asset.seed) {
    const poster = await readFile(resolve(OUT, "poster-hero.webp"));
    body.image = `data:image/webp;base64,${poster.toString("base64")}`;
  }
  let task;
  if (resumeId) {
    task = { id: resumeId, polling_url: `${API}/videos/${resumeId}`, model };
  } else {
    try {
      task = await api("/videos", { method: "POST", body: JSON.stringify(body) });
    } catch (error) {
      task = await api("/videos", { method: "POST", body: JSON.stringify({ ...body, model: "kling/v3-std" }) });
    }
  }
  const deadline = Date.now() + 20 * 60_000;
  let status = resumeId ? await api(task.polling_url) : task;
  while (status.status !== "completed") {
    if (status.status === "failed") throw new Error(`Video failed: ${JSON.stringify(status)}`);
    if (Date.now() > deadline) throw new Error(`Video timed out: ${asset.name}`);
    await new Promise((accept) => setTimeout(accept, 15_000));
    status = await api(task.polling_url);
    process.stdout.write(`Waiting for ${asset.name}: ${status.status}\n`);
  }
  const url = status.unsigned_urls?.[0];
  if (!url) throw new Error(`No video URL returned for ${asset.name}`);
  const raw = resolve(OUT, `${asset.name}-raw.mp4`);
  const output = resolve(OUT, `${asset.name}.mp4`);
  await download(url, raw);
  await run("ffmpeg", ["-y", "-i", raw, "-an", "-c:v", "libx264", "-crf", "28", "-movflags", "+faststart", output]);
  await unlink(raw);
  if (asset.name.endsWith("-src")) {
    const sheet = resolve(OUT, `${asset.name.replace("-src", "-sheet")}.webp`);
    await run("ffmpeg", ["-y", "-i", output, "-vf", "fps=4,scale=256:256:force_original_aspect_ratio=decrease,pad=256:256:(ow-iw)/2:(oh-ih)/2:black,tile=4x4", "-frames:v", "1", sheet]);
  }
  return { model: task.model ?? model, cost: status.usage?.cost ?? task.usage?.cost ?? 0 };
}

for (const asset of selected) {
  console.log(`Generating ${asset.name}...`);
  const result = asset.kind === "image" ? await image(asset) : await video(asset);
  manifest.cost = Number(manifest.cost ?? 0) + Number(result.cost ?? 0);
  if (manifest.cost > MAX_COST) throw new Error(`Media cost cap exceeded: $${manifest.cost.toFixed(2)}`);
  manifest.generatedAt = new Date().toISOString();
  manifest.assets[asset.name] = { kind: asset.kind, model: result.model, prompt: asset.prompt, date: manifest.generatedAt, cost: result.cost };
  await writeFile(resolve(OUT, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
}

console.log(`Media generation complete. Recorded cost: $${manifest.cost.toFixed(2)}`);
