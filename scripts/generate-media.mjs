import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const API = "https://openrouter.ai/api/v1";
const OUT = resolve("public/media");
const KEY = process.env.OPENROUTER_API_KEY;
const FINAL = process.argv.includes("--final");
const requested = process.argv.find((arg) => arg.startsWith("--asset="))?.split("=")[1];
const kindFilter = process.argv.find((arg) => arg.startsWith("--kind="))?.split("=")[1];
const resumeId = process.argv.find((arg) => arg.startsWith("--resume="))?.split("=")[1];
const STYLE = "soft clay 3D render, voxel-stepped forms, matte material, deep dark magenta background #16040d, brand magenta #f42a8f accent lighting, no text, no letters";
const MAX_COST = 8;

if (!KEY) throw new Error("OPENROUTER_API_KEY is required. Run with node --env-file=.env.local scripts/generate-media.mjs");

const assets = [
  // -- Core scene media (2026-07-31 run) -------------------------------------
  { name: "poster-hero", kind: "image", prompt: `A monumental rounded voxel pressure vessel breathing gently above a mound of gold voxel treasure, cinematic centered composition, ample dark negative space for interface copy, ${STYLE}` },
  { name: "env-glow", kind: "image", prompt: `A distant atmospheric field of tiny magenta voxel lights and soft volumetric haze, seamless wide environmental backdrop, no foreground objects, ${STYLE}` },
  { name: "fallback-loop", kind: "video", seconds: 5, seed: true, prompt: `Use the supplied image as an exact locked composition. Static camera, no zoom, no assembly, no growth, no transformation, no new objects. Keep the vessel's silhouette and treasure layout unchanged. Only a barely perceptible one-percent breathing pulse and two restrained treasure glints. First and last frame must match for a perfect ambient loop, ${STYLE}` },
  { name: "puff-src", kind: "video", seconds: 4, prompt: `Locked camera, pure black background. One centered clay smoke puff expands and dissolves completely, isolated effect for a flipbook, ${STYLE}` },
  { name: "spark-src", kind: "video", seconds: 4, prompt: `Locked camera, pure black background. One centered small gold voxel sparkle pops and dissolves completely, isolated effect for a flipbook, ${STYLE}` },

  // -- Regenerated brand asset slots (2026-08-01 run) -------------------------
  // Each entry rebuilds a motif the live pumpgame.ir landing ships as a raster,
  // in the repo's single clay-voxel language. Square-ish isolated renders sit
  // in rounded glass frames in the DOM overlay.
  { name: "img-coin", kind: "image", prompt: `A single large golden bottle-cap coin with a crimped ridged rim and an embossed stepped voxel Persian letter پ on its face, floating at a slight three-quarter angle, centered isolated product render, ${STYLE}` },
  { name: "img-treasure", kind: "image", prompt: `A mound of golden voxel treasure cubes with glowing pink gems and a small golden crown resting on top, centered isolated render, ${STYLE}` },
  { name: "img-gamepad", kind: "image", prompt: `A chunky rounded voxel gamepad with soft magenta buttons, floating at a slight angle, centered isolated product render, ${STYLE}` },
  { name: "img-users", kind: "image", prompt: `A small crowd of tiny abstract rounded voxel clay people gathered in a loose ring, seen from a slight high angle, centered isolated render, ${STYLE}` },
  { name: "img-gift", kind: "image", prompt: `A rounded voxel gift box with a glowing magenta ribbon, lid slightly ajar with warm golden light spilling out, centered isolated render, ${STYLE}` },
  { name: "img-phone", kind: "image", prompt: `A rounded voxel smartphone floating at a slight angle, its screen glowing with a tiny magenta voxel pressure vessel game scene, centered isolated product render, ${STYLE}` },
  { name: "img-arrows", kind: "image", prompt: `Two chunky rounded voxel arrow tokens facing each other in balance, one mint green pointing up and one soft red pointing down, centered isolated render, ${STYLE}` },

  // Animated brand member: the bottle-cap coin, turning. Used as a decorative
  // DOM loop (mix-blend-screen drops the black over glass) on the onboarding.
  { name: "coin-spin", kind: "video", seconds: 5, prompt: `Locked camera, pure black background. One centered golden voxel bottle-cap coin with an embossed stepped voxel Persian letter پ on its face rotates slowly in place through exactly one full turn, soft magenta rim light, gentle gold glints, isolated effect, first and last frame must match for a perfect seamless loop, ${STYLE}` },

  // -- Audio (Lyria 3 clip, 30 s @ 48 kHz mp3, $0.04 per clip) ----------------
  // Music gets a crossfade-loop pass; effects get onset-trimmed and faded so
  // they fire cleanly as one-shot UI feedback under the music bed.
  {
    name: "music-ambient", kind: "audio", post: "loop",
    prompt: "Dark luxurious ambient electronic background music, deep warm sub bass pulse around 90 BPM, soft shimmering analog synth pads, sparse gentle plucky arpeggio, calm premium lounge atmosphere, hypnotic seamless repetition, no vocals, no drums, no percussion, no risers, no drops, constant energy with no climax",
  },
  {
    name: "sfx-commit", kind: "audio", post: "oneshot", length: 1.2,
    prompt: "Minimal sound design study: one deep soft sub bass pluck note repeated sparsely every three seconds with long gaps of near silence, warm rounded attack, premium interface feedback feel, no melody, no drums, no vocals",
  },
  {
    name: "sfx-coin", kind: "audio", post: "oneshot", length: 1.0,
    prompt: "Minimal sound design study: one bright tiny golden coin chime, a delicate metallic clink repeated sparsely every three seconds with long gaps of near silence, premium interface feedback feel, no melody, no drums, no vocals",
  },
  {
    name: "sfx-tick", kind: "audio", post: "oneshot", length: 0.35,
    prompt: "Minimal sound design study: one tiny warm wooden tick click, soft and dry, repeated sparsely every two seconds with long gaps of near silence, subtle interface scroll feedback feel, no melody, no drums, no vocals",
  },
  {
    name: "sfx-whoosh", kind: "audio", post: "oneshot", length: 1.4,
    prompt: "Minimal sound design study: one gentle airy whoosh sweeping softly, repeated sparsely every four seconds with long gaps of near silence, smooth premium transition feel, no melody, no drums, no vocals",
  },
  {
    name: "sfx-win", kind: "audio", post: "oneshot", length: 2.2,
    prompt: "Minimal sound design study: one short rising magical sparkle arpeggio, warm triumphant chime cascade lasting two seconds, repeated sparsely with long gaps of near silence, celebratory but soft and premium, no drums, no vocals",
  },
  {
    name: "sfx-lose", kind: "audio", post: "oneshot", length: 1.4,
    prompt: "Minimal sound design study: one soft muted low thud, gentle friendly and warm, never harsh, repeated sparsely every three seconds with long gaps of near silence, no melody, no drums, no vocals",
  },
];

const selected = assets.filter((asset) =>
  (!requested || asset.name === requested) && (!kindFilter || asset.kind === kindFilter));
if (!selected.length) throw new Error(`Unknown asset: ${requested ?? kindFilter}`);
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

function run(command, args, { quiet = false } = {}) {
  return new Promise((accept, reject) => {
    const child = spawn(command, args, { stdio: quiet ? ["ignore", "pipe", "pipe"] : "inherit" });
    let out = "";
    if (quiet) {
      child.stdout.on("data", (chunk) => { out += chunk; });
      child.stderr.on("data", () => {});
    }
    child.on("error", reject);
    child.on("exit", (code) => code === 0 ? accept(out) : reject(new Error(`${command} exited ${code}`)));
  });
}

async function durationOf(path) {
  const out = await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path], { quiet: true });
  const seconds = Number(out.trim());
  if (!Number.isFinite(seconds) || seconds <= 0) throw new Error(`Cannot read duration of ${path}`);
  return seconds;
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

/**
 * Lyria streams one mp3 as base64 audio chunks over SSE. The model always
 * renders ~30 s; downstream ffmpeg passes shape that into what the runtime
 * actually needs (seamless loop or trimmed one-shot).
 */
async function audio(asset) {
  const model = "google/lyria-3-clip-preview";
  let chunks = [];
  let usage = null;
  // The Lyria stream occasionally completes without an audio payload; retry.
  for (let attempt = 1; attempt <= 3 && !chunks.length; attempt++) {
    const response = await fetch(`${API}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        modalities: ["audio", "text"],
        stream: true,
        messages: [{ role: "user", content: asset.prompt }],
      }),
    });
    if (!response.ok) throw new Error(`${response.status} ${await response.text()}`);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let pending = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      pending += decoder.decode(value, { stream: true });
      const lines = pending.split("\n");
      pending = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") continue;
        let json;
        try { json = JSON.parse(payload); } catch { continue; }
        if (json.usage) usage = json.usage;
        const data = json.choices?.[0]?.delta?.audio?.data;
        if (data) chunks.push(data);
      }
    }
  }
  if (!chunks.length) throw new Error(`No audio returned for ${asset.name}`);

  const raw = resolve(OUT, `${asset.name}-raw.mp3`);
  const output = resolve(OUT, `${asset.name}.mp3`);
  await writeFile(raw, Buffer.from(chunks.join(""), "base64"));

  if (asset.post === "loop") {
    // Seamless loop: blend the tail over the head. The material that naturally
    // follows the body's end is the tail, so fading tail->head closes the seam
    // without a composition change. Work in WAV: an mp3's bitrate-estimated
    // duration is inaccurate, and `acrossfade` silently starves on trims near
    // the estimated EOF — explicit envelopes + amix are deterministic.
    const wav = resolve(OUT, `${asset.name}-raw.wav`);
    await run("ffmpeg", ["-y", "-v", "error", "-i", raw, "-c:a", "pcm_s16le", wav]);
    const duration = await durationOf(wav);
    const x = Math.min(3, duration * 0.15);
    const main = duration - x;
    const filter = `[0:a]atrim=${main},asetpts=PTS-STARTPTS,afade=t=out:st=0:d=${x}:curve=tri,apad=whole_dur=${main}[tail];[0:a]atrim=0:${main},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=${x}:curve=tri[body];[tail][body]amix=inputs=2:duration=longest:normalize=0,loudnorm=I=-20:TP=-2:LRA=11`;
    await run("ffmpeg", ["-y", "-i", wav, "-filter_complex", filter, "-c:a", "libmp3lame", "-b:a", "160k", output]);
    await unlink(wav);
  } else {
    // One-shot: strip leading silence, take the first statement, quick fade.
    const length = asset.length ?? 1.5;
    const filter = `silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,atrim=0:${length},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.008,afade=t=out:st=${Math.max(0.05, length - 0.2)}:d=0.2,loudnorm=I=-18:TP=-1.5:LRA=11`;
    await run("ffmpeg", ["-y", "-i", raw, "-af", filter, "-c:a", "libmp3lame", "-b:a", "192k", output]);
  }
  await unlink(raw);
  return { model, cost: usage?.cost ?? 0 };
}

for (const asset of selected) {
  console.log(`Generating ${asset.name}...`);
  const result = asset.kind === "image" ? await image(asset) : asset.kind === "audio" ? await audio(asset) : await video(asset);
  manifest.cost = Number(manifest.cost ?? 0) + Number(result.cost ?? 0);
  if (manifest.cost > MAX_COST) throw new Error(`Media cost cap exceeded: $${manifest.cost.toFixed(2)}`);
  manifest.generatedAt = new Date().toISOString();
  manifest.assets[asset.name] = { kind: asset.kind, model: result.model, prompt: asset.prompt, date: manifest.generatedAt, cost: result.cost };
  await writeFile(resolve(OUT, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
}

console.log(`Media generation complete. Recorded cost: $${manifest.cost.toFixed(2)}`);
