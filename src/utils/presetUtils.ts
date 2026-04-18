import axios from 'axios';

export interface PresetDefinition {
  on: boolean;
  bri?: number;
  n?: string;
  ql?: string;
}

export async function loadPresets(host: string): Promise<Record<number, PresetDefinition>> {
  try {
    const response = await axios.get(`http://${host}/presets.json`);
    const presets: Record<number, PresetDefinition | Record<string, never>> = response.data;

    return Object.fromEntries(
      Object.entries(presets).filter(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ([_, value]) => value && typeof value === 'object' && Object.keys(value).length > 0,
      ),
    ) as Record<number, PresetDefinition>;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Error while loading presets on ${host}: ${errorMessage}`, { cause: error });
  }
}

export function getPresetLabel(presetId: number | string, preset: PresetDefinition): string {
  const n = preset.n || `Preset ${presetId}`;
  const ql = preset.ql || '';
  return (ql ? `${ql} ` : '') + `${n}`;
}
