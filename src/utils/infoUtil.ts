import axios from 'axios';

export async function getInfo(
  host: string,
  onError: (error: string) => void,
): Promise<{
  ver: string;
  repo: string;
  brand: string;
  product: string;
  mac: string;
  ip: string;
}> {
  try {
    const response = await axios.get(`http://${host}/json/info`);
    return response.data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    onError(`Error while loading presets on ${host}: ${errorMessage}`);
    return {
      ver: 'unknown',
      repo: 'unknown',
      brand: 'unknown',
      product: 'unknown',
      mac: 'unknown',
      ip: 'unknown',
    };
  }
}

export async function getLatestWledVersion(onError: (error: string) => void): Promise<string | undefined> {
  try {
    return (await axios.get('https://api.github.com/repos/wled/WLED/releases/latest')).data.tag_name;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    onError(`Error while loading latest WLED version: ${errorMessage}`);
  }
}
