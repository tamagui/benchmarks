import { describe, expect, test } from "bun:test";

type Report = {
  gitRevision: string;
  tailwindVersion: string;
  reactNativeVersion: string;
  counts: Record<"ios" | "android", Record<string, number>>;
  platforms: Record<"ios" | "android", { candidate: string; evidence: string }[]>;
};

describe("pinned Tamagui lowering report", () => {
  test("contains only safe claims from the real frontend resolver", async () => {
    const compressed = await Bun.file("reports/tamagui-lowering.json.gz").bytes();
    const pin = (await Bun.file("adapters/tamagui/pin.json").json()) as {
      commit: string;
    };
    const report = JSON.parse(new TextDecoder().decode(Bun.gunzipSync(compressed))) as Report;
    const iosEvidence = new Map(
      report.platforms.ios.map(({ candidate, evidence }) => [candidate, evidence]),
    );
    const androidEvidence = new Map(
      report.platforms.android.map(({ candidate, evidence }) => [candidate, evidence]),
    );

    expect(report.gitRevision).toBe(pin.commit);
    expect(report.tailwindVersion).toBe("4.3.0");
    expect(report.reactNativeVersion).toBe("0.86.2");
    for (const platform of ["ios", "android"] as const) {
      expect(report.counts[platform].accepted).toBe(0);
      expect(report.counts[platform].invalid).toBe(0);
      expect(Object.values(report.counts[platform]).reduce((sum, value) => sum + value)).toBe(
        23_286,
      );
    }
    expect(iosEvidence.get("p-4")).toBe("lowered");
    expect(iosEvidence.get("grid")).toBe("rejected");
    expect(iosEvidence.get("mask-b-from-red-500")).toBe("rejected");
    expect(iosEvidence.get("ring-2")).toBe("lowered");
    expect(iosEvidence.get("brightness-105")).toBe("lowered");
    expect(iosEvidence.get("-left-full")).toBe("lowered");
    expect(iosEvidence.get("-translate-x-1/2")).toBe("lowered");
    expect(iosEvidence.get("flex-1/2")).toBe("lowered");
    expect(iosEvidence.get("leading-4")).toBe("lowered");
    expect(iosEvidence.get("blur-sm")).toBe("rejected");
    expect(androidEvidence.get("blur-sm")).toBe("lowered");
    expect(androidEvidence.get("decoration-red-500")).toBe("lowered");
  });
});
