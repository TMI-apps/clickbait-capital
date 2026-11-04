import { describe, expect, it, vi } from "vitest";
import { createSoundPlayer, type AudioContextLike } from "./soundPlayer";
import { SOUND_MANIFEST } from "./soundManifest";
import { SOUND_EFFECT_IDS } from "@/features/game-audio/types/soundEffect.types";

const createFakeContext = () => {
  const started: number[] = [];
  const gains: number[] = [];
  const context = {
    state: "suspended",
    destination: {} as AudioNode,
    resume: vi.fn(async () => {
      context.state = "running";
    }),
    decodeAudioData: vi.fn(async () => ({}) as AudioBuffer),
    createBufferSource: vi.fn(
      () =>
        ({
          buffer: null,
          connect: vi.fn(),
          start: vi.fn(() => started.push(1)),
        }) as unknown as AudioBufferSourceNode
    ),
    createGain: vi.fn(() => {
      const node = { gain: { value: 1 }, connect: vi.fn() };
      queueMicrotask(() => gains.push(node.gain.value));
      return node as unknown as GainNode;
    }),
  };
  return { context: context as AudioContextLike & typeof context, started, gains };
};

const setup = (initialMuted = false) => {
  const fake = createFakeContext();
  const writeMuted = vi.fn();
  const player = createSoundPlayer({
    createContext: () => fake.context,
    fetchBytes: vi.fn(async () => new ArrayBuffer(8)),
    readMuted: () => initialMuted,
    writeMuted,
  });
  return { player, fake, writeMuted };
};

describe("createSoundPlayer", () => {
  it("should stay silent when no user gesture has unlocked audio yet", () => {
    const { player, fake } = setup();

    player.play("card-viral");

    expect(fake.started).toHaveLength(0);
    expect(fake.context.createBufferSource).not.toHaveBeenCalled();
  });

  it("should resume the context and load every sound when unlocked", async () => {
    const { player, fake } = setup();

    await player.unlock();

    expect(player.isUnlocked()).toBe(true);
    expect(fake.context.resume).toHaveBeenCalledOnce();
    expect(fake.context.decodeAudioData).toHaveBeenCalledTimes(SOUND_EFFECT_IDS.length);
  });

  it("should play a sound at its manifest volume when unlocked and not muted", async () => {
    const { player, fake } = setup();
    await player.unlock();

    player.play("card-news");
    await Promise.resolve();

    expect(fake.started).toHaveLength(1);
    expect(fake.gains).toEqual([SOUND_MANIFEST["card-news"].volume]);
  });

  it("should not play when muted and should remember the choice", async () => {
    const { player, fake, writeMuted } = setup();
    await player.unlock();

    player.setMuted(true);
    player.play("card-ad");

    expect(fake.started).toHaveLength(0);
    expect(writeMuted).toHaveBeenCalledWith(true);
  });

  it("should start muted when the stored choice is muted", () => {
    const { player } = setup(true);

    expect(player.isMuted()).toBe(true);
  });

  it("should notify subscribers when the mute state changes", () => {
    const { player } = setup();
    const listener = vi.fn();
    const unsubscribe = player.subscribe(listener);

    player.setMuted(true);
    unsubscribe();
    player.setMuted(false);

    expect(listener).toHaveBeenCalledOnce();
  });

  it("should keep playing other sounds when one file fails to load", async () => {
    const fake = createFakeContext();
    const player = createSoundPlayer({
      createContext: () => fake.context,
      fetchBytes: vi.fn(async (url: string) => {
        if (url.includes("card-ad")) throw new Error("404");
        return new ArrayBuffer(8);
      }),
      readMuted: () => false,
      writeMuted: vi.fn(),
    });
    await player.unlock();

    player.play("card-ad");
    player.play("card-viral");

    expect(fake.started).toHaveLength(1);
  });

  it("should stay locked and silent when the browser has no Web Audio", async () => {
    const player = createSoundPlayer({
      createContext: () => null,
      fetchBytes: vi.fn(),
      readMuted: () => false,
      writeMuted: vi.fn(),
    });

    await player.unlock();
    player.play("ui-tap");

    expect(player.isUnlocked()).toBe(false);
  });
});

describe("SOUND_MANIFEST", () => {
  it("should describe every sound id with a file, a prompt and a volume between 0 and 1", () => {
    for (const id of SOUND_EFFECT_IDS) {
      const entry = SOUND_MANIFEST[id];
      expect(entry.file).toBe(`/audio/${id}.mp3`);
      expect(entry.prompt.length).toBeGreaterThan(0);
      expect(entry.volume).toBeGreaterThan(0);
      expect(entry.volume).toBeLessThanOrEqual(1);
    }
  });
});
